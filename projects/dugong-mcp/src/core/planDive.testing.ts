import {
    Diver, DtoSerialization, GasDensity, Options, PlanFactory, PlanningTasks, ProfileTissues, Salinity, SafetyStop, Segments, Tank, Time
} from 'scuba-physics';
import { PlanDiveInput } from './planDiveInput';

/** Result values calculated the way the planner application calculates a new dive */
export interface AppReference {
    /** minutes */
    runtime: number;
    noDecoLimit: number;
    cns: number;
    otu: number;
    /** flat ascent segments: depth in m, duration in minutes, gas name */
    stops: { depth: number; duration: number; gas: string }[];
    /** bars, not rounded */
    endPressures: number[];
}

/** Runs the planning tasks with the requests built as the planner builds them for the first dive of the day */
export const appReference = (input: PlanDiveInput): AppReference => {
    const options = new Options();
    // as the OptionsService constructor
    options.salinity = Salinity.fresh;
    options.safetyStop = SafetyStop.auto;
    const source = input.options ?? {};
    options.gfLow = (source.gfLow ?? options.gfLow * 100) / 100;
    options.gfHigh = (source.gfHigh ?? options.gfHigh * 100) / 100;
    options.ascentSpeed6m = source.ascentSpeed6m ?? options.ascentSpeed6m;
    options.ascentSpeed50percTo6m = source.ascentSpeed50percTo6m ?? options.ascentSpeed50percTo6m;
    options.ascentSpeed50perc = source.ascentSpeed50perc ?? options.ascentSpeed50perc;
    options.descentSpeed = source.descentSpeed ?? options.descentSpeed;
    options.problemSolvingDuration = source.problemSolvingDuration ?? options.problemSolvingDuration;
    options.safetyStop = source.safetyStop === 'always' ? SafetyStop.always : options.safetyStop;

    const tanks = input.tanks.map((t, index) => {
        const tank = new Tank(t.size, t.startPressure, 21);
        tank.assignGas(t.o2, t.he ?? 0);
        tank.id = index + 1;
        return tank;
    });
    const diver = new Diver(input.diver?.rmv ?? Diver.defaultSac, input.diver?.stressRmv);
    const plan = PlanFactory.createPlan(input.depth, input.bottomTime, tanks[0], options);
    const request = {
        diveId: 1,
        tanks: DtoSerialization.fromTanks(tanks.map(t => ({ id: t.id, workingPressureBars: 0, tank: t }))),
        plan: DtoSerialization.fromSegments(plan.items),
        options: DtoSerialization.fromOptions(options),
        diver: DtoSerialization.fromDiver(diver),
        previousTissues: DtoSerialization.fromTissues(ProfileTissues.createAtSurface(options.altitude)),
        surfaceInterval: Number.POSITIVE_INFINITY
    };

    const profile = PlanningTasks.calculateDecompression(request).profile;
    const info = PlanningTasks.diveInfo({
        ...request,
        eventOptions: { maxDensity: GasDensity.recommendedMaximum },
        calculatedProfile: profile.segments,
        calculatedTissues: profile.finalTissues,
        previousCns: 0,
        previousCnsExposures: []
    });
    const consumption = PlanningTasks.calculateConsumption({
        diveId: 1,
        isComplex: tanks.length > 1 || tanks.some(t => t.he > 0),
        plan: request.plan,
        profile: profile.segments,
        options: request.options,
        consumptionOptions: { diver: request.diver, primaryTankReserve: 30, stageTankReserve: 20 },
        tanks: request.tanks,
        previousTissues: request.previousTissues,
        surfaceInterval: request.surfaceInterval
    });

    const calculated = DtoSerialization.toSegments(profile.segments, tanks);
    tanks.forEach(tank => {
        const consumed = consumption.tanks.find(c => c.id === tank.id);
        tank.consumedVolume = consumed?.consumedVolume ?? 0;
    });

    return {
        runtime: Time.toMinutes(Segments.duration(calculated)),
        noDecoLimit: info.noDeco,
        cns: info.cns,
        otu: info.otu,
        stops: calculated.slice(plan.items.length)
            .filter(s => s.startDepth === s.endDepth && s.endDepth > 0)
            .map(s => ({ depth: s.endDepth, duration: Time.toMinutes(s.duration), gas: s.gas.name })),
        endPressures: tanks.map(t => t.endPressure)
    };
};
