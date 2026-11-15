import {
    Consumption, ConsumptionResultDto, DiveInfoResultDto, Diver, DtoSerialization, EventDto, EventType, GasDensity, Options,
    PlanFactory, PlanningTasks, PlanRequestDto, Precision, ProfileTissues, SafetyStop, Salinity, SegmentDto, Segments, Tank, Time
} from 'scuba-physics';
import { PlanDiveInput } from './planDiveInput';
import { DecoStop, DiveEvent, disclaimer, eventText, PlanDiveResult, TankResult } from './planDiveResult';

type InputOptions = NonNullable<PlanDiveInput['options']>;

const salinities: Record<NonNullable<InputOptions['salinity']>, Salinity> = {
    fresh: Salinity.fresh,
    brackish: Salinity.brackish,
    salt: Salinity.salt
};

const safetyStops: Record<NonNullable<InputOptions['safetyStop']>, SafetyStop> = {
    never: SafetyStop.never,
    auto: SafetyStop.auto,
    always: SafetyStop.always
};

/** Options of a new dive in the application (see OptionsService constructor) overridden by the input */
const createOptions = (source: InputOptions = {}): Options => {
    const options = new Options();
    options.salinity = Salinity.fresh;
    options.safetyStop = SafetyStop.auto;

    options.gfLow = source.gfLow !== undefined ? source.gfLow / 100 : options.gfLow;
    options.gfHigh = source.gfHigh !== undefined ? source.gfHigh / 100 : options.gfHigh;
    options.salinity = source.salinity ? salinities[source.salinity] : options.salinity;
    options.safetyStop = source.safetyStop ? safetyStops[source.safetyStop] : options.safetyStop;
    options.altitude = source.altitude ?? options.altitude;
    options.maxPpO2 = source.maxPpO2 ?? options.maxPpO2;
    options.maxDecoPpO2 = source.maxDecoPpO2 ?? options.maxDecoPpO2;
    options.ascentSpeed50perc = source.ascentSpeed50perc ?? options.ascentSpeed50perc;
    options.ascentSpeed50percTo6m = source.ascentSpeed50percTo6m ?? options.ascentSpeed50percTo6m;
    options.ascentSpeed6m = source.ascentSpeed6m ?? options.ascentSpeed6m;
    options.descentSpeed = source.descentSpeed ?? options.descentSpeed;
    options.lastStopDepth = source.lastStopDepth ?? options.lastStopDepth;
    options.gasSwitchDuration = source.gasSwitchDuration ?? options.gasSwitchDuration;
    options.problemSolvingDuration = source.problemSolvingDuration ?? options.problemSolvingDuration;
    return options;
};

const createTanks = (source: PlanDiveInput['tanks']): Tank[] => source.map((t, index) => {
    const tank = new Tank(t.size, t.startPressure, t.o2);
    tank.assignGas(t.o2, t.he ?? 0);
    tank.id = index + 1;
    return tank;
});

const createRequest = (input: PlanDiveInput, options: Options, tanks: Tank[]): PlanRequestDto => {
    const diver = new Diver(input.diver?.rmv ?? Diver.defaultSac, input.diver?.stressRmv);
    const plan = PlanFactory.createPlan(input.depth, input.bottomTime, tanks[0], options);
    return {
        diveId: 1,
        // metric input, the working pressure is needed only for imperial units
        tanks: DtoSerialization.fromTanks(tanks.map(t => ({ id: t.id, workingPressureBars: 0, tank: t }))),
        plan: DtoSerialization.fromSegments(plan.items),
        options: DtoSerialization.fromOptions(options),
        diver: DtoSerialization.fromDiver(diver),
        // first dive of the day, as the application plans it
        previousTissues: DtoSerialization.fromTissues(ProfileTissues.createAtSurface(options.altitude)),
        surfaceInterval: Number.POSITIVE_INFINITY
    };
};

const minutes = (seconds: number): number => Precision.round(Time.toMinutes(seconds), 1);

const eventMessage = (event: EventDto, noDecoLimit: number): string | undefined => {
    if (event.type === EventType.noDecoEnd) {
        return `No decompression time for current depth exceeded (For no decompression dive set dive time maximum to ${noDecoLimit} min)!`;
    }

    return eventText(event.type);
};

const toEvents = (events: EventDto[], noDecoLimit: number): DiveEvent[] => events
    .map(e => ({ event: e, message: eventMessage(e, noDecoLimit) }))
    .filter((e): e is { event: EventDto; message: string } => e.message !== undefined)
    .map(e => ({
        type: EventType[e.event.type],
        runtime: minutes(e.event.timeStamp),
        depth: Precision.round(e.event.depth, 1),
        message: e.message
    }));

const toDecoStops = (profile: SegmentDto[], userSegments: number, tanks: Tank[]): DecoStop[] => DtoSerialization
    .toSegments(profile, tanks)
    .slice(userSegments)
    .filter(s => s.startDepth === s.endDepth && s.endDepth > 0)
    .map(s => ({ depth: Precision.round(s.endDepth, 1), duration: minutes(s.duration), gas: s.gas.name }));

const toTanks = (tanks: Tank[], consumption: ConsumptionResultDto): TankResult[] => tanks.map((tank, index) => {
    const consumed = consumption.tanks.find(c => c.id === tank.id);
    tank.consumedVolume = consumed?.consumedVolume ?? 0;
    tank.reserveVolume = consumed?.reserveVolume ?? 0;
    return {
        index: index + 1,
        gas: tank.name,
        size: tank.size,
        startPressure: tank.startPressure,
        endPressure: Precision.round(tank.endPressure, 1),
        reservePressure: Precision.round(tank.reserve, 1),
        consumedVolume: Precision.round(tank.consumedVolume, 1),
        hasReserve: tank.hasReserve
    };
});

const failed = (errors: EventDto[]): PlanDiveResult => ({
    noDecoDive: false,
    noDecoLimit: 0,
    runtime: 0,
    timeToSurface: 0,
    maxDepth: 0,
    averageDepth: 0,
    decoStops: [],
    tanks: [],
    cns: 0,
    otu: 0,
    maxDensity: { density: 0, depth: 0, gas: '' },
    events: [],
    errors: errors.map(e => e.message ?? eventText(e.type) ?? 'The dive can\'t be calculated.'),
    disclaimer: disclaimer
});

const toResult = (input: PlanDiveInput, request: PlanRequestDto, tanks: Tank[], profile: SegmentDto[],
    info: DiveInfoResultDto, consumption: ConsumptionResultDto): PlanDiveResult => {
    const density = DtoSerialization.toDensity(info.density);
    return {
        noDecoDive: input.bottomTime <= info.noDeco,
        noDecoLimit: info.noDeco,
        runtime: minutes(Segments.duration(DtoSerialization.toSegments(profile, tanks))),
        timeToSurface: Precision.round(consumption.timeToSurface, 1),
        maxDepth: Precision.round(Math.max(...profile.map(s => s.endDepth)), 1),
        averageDepth: Precision.round(info.averageDepth, 1),
        decoStops: toDecoStops(profile, request.plan.length, tanks),
        tanks: toTanks(tanks, consumption),
        cns: Math.round(info.cns),
        otu: Math.round(info.otu),
        maxDensity: {
            density: Precision.round(density.density, 2),
            depth: Precision.round(density.depth, 1),
            gas: density.gas.name
        },
        events: toEvents(info.events, info.noDeco),
        errors: [],
        disclaimer: disclaimer
    };
};

/** Plans a single level open circuit dive the same way as the application plans a new dive */
export const planDive = (input: PlanDiveInput): PlanDiveResult => {
    const options = createOptions(input.options);
    const tanks = createTanks(input.tanks);
    const request = createRequest(input, options, tanks);
    const profile = PlanningTasks.calculateDecompression(request).profile;

    if (profile.errors.length > 0) {
        return failed(profile.errors);
    }

    const info = PlanningTasks.diveInfo({
        ...request,
        eventOptions: { maxDensity: GasDensity.recommendedMaximum },
        calculatedProfile: profile.segments,
        calculatedTissues: profile.finalTissues,
        previousCns: 0,
        previousCnsExposures: []
    });

    const consumption = PlanningTasks.calculateConsumption({
        diveId: request.diveId,
        // the application needs the complex view for more tanks or trimix
        isComplex: input.tanks.length > 1 || input.tanks.some(t => (t.he ?? 0) > 0),
        plan: request.plan,
        profile: profile.segments,
        options: request.options,
        consumptionOptions: {
            diver: request.diver,
            primaryTankReserve: Consumption.defaultPrimaryReserve,
            stageTankReserve: Consumption.defaultStageReserve
        },
        tanks: request.tanks,
        previousTissues: request.previousTissues,
        surfaceInterval: request.surfaceInterval
    });

    return toResult(input, request, tanks, profile.segments, info, consumption);
};
