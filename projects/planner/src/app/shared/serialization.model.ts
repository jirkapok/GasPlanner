import {
    Options, Segment, Tank, Tanks,
    CalculatedProfile, Ceiling, EventType,
    Event, Events, Gas, Diver, Salinity, SafetyStop, HighestDensity
} from 'scuba-physics';

export interface AppPreferences extends AppPreferencesDto {
    states: AppStates;
}

export interface AppStates {
    /** route to the last page opened */
    lastScreen: string;
    /** all other views than plan, because its state are dives */
    states: ViewState[];
}

export interface AltitudeViewState extends ViewState {
    /** pressure is calculated from altitude */
    altitude: number;
    actualDepth: number;
}

/** We don\'t need mod, since it is calculated */
export interface NitroxViewState extends ViewState {
    fO2: number;
    pO2: number;
}

/** rmv is calculated */
export interface SacViewState extends ViewState {
    avgDepth: number;
    tankSize: number;
    workPressure: number;
    used: number;
    duration: number;
}

export interface NdlViewState extends ViewState {
    fO2: number;
    pO2: number;
    altitude: number;
    salinity: Salinity;
    gfLow: number;
    gfHigh: number;
}

/** all data are stored in metric */
export interface ViewState {
    /** case sensitive id as view key */
    id: string;
}

/** Only for url serialization */
export interface AppPreferencesDto {
    options: AppOptionsDto;
    dives: DiveDto[];
}

export interface DiveDto {
    options: OptionsDto;
    diver: DiverDto;
    tanks: TankDto[];
    plan: SegmentDto[];
}

/**
 * Send these in url, because screen without them
 * may cause different/unexpected rounding and value ranges
 **/
export interface AppOptionsDto {
    imperialUnits: boolean;
    isComplex: boolean;
    language: string;
}

/**
 *  We can't us TankBound from models directly,
 *  because it will cause unresolved dependency in background tasks
 **/
export interface ITankBound {
    id: number;
    /** in bars to avoid conversions */
    workingPressureBars: number;
    tank: Tank;
}

export interface ProfileRequestDto {
    tanks: TankDto[];
    plan: SegmentDto[];
    options: OptionsDto;
    eventOptions: EventOptionsDto;
}

export interface EventOptionsDto {
    maxDensity: number;
}

export interface DiveInfoResultDto {
    noDeco: number;
    otu: number;
    cns: number;
    density: DensityDto;
}

export interface DensityDto {
    gas: GasDto;
    depth: number;
    density: number;
}

export interface ProfileResultDto {
    profile: CalculatedProfileDto;
    events: EventDto[];
}

export interface EventDto {
    timeStamp: number;
    depth: number;
    type: EventType;
    message?: string;
    gas?: GasDto;
}

export interface CalculatedProfileDto {
    segments: SegmentDto[];
    ceilings: Ceiling[];
    errors: EventDto[];
}

export interface ConsumptionRequestDto {
    plan: SegmentDto[];
    profile: SegmentDto[];
    options: OptionsDto;
    diver: DiverDto;
    tanks: TankDto[];
}

export interface ConsumedDto {
    /** Tank id */
    id: number;
    consumed: number;
    reserve: number;
}

export interface ConsumptionResultDto {
    maxTime: number;
    timeToSurface: number;
    tanks: ConsumedDto[];
}

export interface TankDto {
    id: number;
    size: number;
    /** in bars */
    workPressure: number;
    startPressure: number;
    gas: GasDto;
}

export interface SegmentDto {
    startDepth: number;
    endDepth: number;
    duration: number;
    tankId: number;
    gas: GasDto;
}

export interface GasDto {
    fO2: number;
    fHe: number;
}

export interface DiverDto {
    rmv: number;
    maxPpO2: number;
    maxDecoPpO2: number;
}

export interface OptionsDto {
    gfLow: number;
    gfHigh: number;
    maxPpO2: number;
    maxDecoPpO2: number;
    salinity: Salinity;
    altitude: number;
    roundStopsToMinutes: boolean;
    gasSwitchDuration: number;
    safetyStop: SafetyStop;
    lastStopDepth: number;
    decoStopDistance: number;
    minimumAutoStopDepth: number;
    maxEND: number;
    oxygenNarcotic: boolean;
    ascentSpeed6m: number;
    ascentSpeed50percTo6m: number;
    ascentSpeed50perc: number;
    descentSpeed: number;
    problemSolvingDuration: number;
}

/** Serialization used to store preferences and for communication with background workers */
export class DtoSerialization {
    public static toTanks(source: TankDto[]): Tank[] {
        const result: Tank[] = [];
        source.forEach(tank => {
            const converted = new Tank(tank.size, tank.startPressure, 0);
            converted.id = tank.id;
            converted.gas.fO2 = tank.gas.fO2;
            converted.gas.fHe = tank.gas.fHe;
            result.push(converted);
        });

        Tanks.renumberIds(result);
        return result;
    }

    public static loadWorkingPressure(source: TankDto[], target: ITankBound[]): void {
        for (let index = 0; index < target.length; index++) {
            target[index].workingPressureBars = source[index].workPressure;
        }
    }

    public static fromTanks(tanks: ITankBound[]): TankDto[] {
        const result: TankDto[] = [];
        tanks.forEach(t => {
            const tank = t.tank;
            const serialized: TankDto = {
                id: tank.id,
                size: tank.size,
                workPressure: t.workingPressureBars,
                startPressure: tank.startPressure,
                gas: DtoSerialization.fromGas(tank.gas)
            };
            result.push(serialized);
        });
        return result;
    }

    public static toConsumed(tanks: Tank[]): ConsumedDto[] {
        const result: ConsumedDto[] = [];
        for (let index = 0; index < tanks.length; index++) {
            const tank = tanks[index];
            const converted = {
                id: tank.id,
                consumed: tank.consumed,
                reserve: tank.reserve
            };
            result.push(converted);
        }

        return result;
    }

    public static toSegments(source: SegmentDto[], tanks: Tank[]): Segment[] {
        const result: Segment[] = [];

        for (let index = 0; index < source.length; index++) {
            const loaded = source[index];
            // segment always has gas
            const gas = DtoSerialization.toGas(loaded.gas);
            const converted = new Segment(loaded.startDepth, loaded.endDepth, gas, loaded.duration);

            if (loaded.tankId > 0 && loaded.tankId <= tanks.length) {
                const tankIndex = loaded.tankId - 1;
                converted.tank = tanks[tankIndex];
            }

            result.push(converted);
        }

        return result;
    }

    public static fromSegments(plan: Segment[]): SegmentDto[] {
        const result: SegmentDto[] = [];
        plan.forEach(segment => {
            const tankId = segment.tank ? segment.tank.id : 0;
            const serialized: SegmentDto = {
                startDepth: segment.startDepth,
                endDepth: segment.endDepth,
                duration: segment.duration,
                tankId: tankId,
                gas: DtoSerialization.fromGas(segment.gas)
            };
            result.push(serialized);
        });
        return result;
    }

    public static toProfile(profile: CalculatedProfileDto, tanks: Tank[]): CalculatedProfile {
        const segments = DtoSerialization.toSegments(profile.segments, tanks);
        // ceilings have simple data, no custom conversion needed
        return CalculatedProfile.fromProfile(segments, profile.ceilings);
    }

    public static fromProfile(profile: CalculatedProfile): CalculatedProfileDto {
        const segments = DtoSerialization.fromSegments(profile.segments);

        return {
            segments: segments,
            ceilings: profile.ceilings,
            errors: DtoSerialization.fromEvents(profile.errors)
        };
    }

    public static toEvents(dto: EventDto[]): Events {
        const result = new Events();
        dto.forEach(d => {
            const e = Event.create(d.type, d.timeStamp, d.depth);
            e.message = d.message;

            if (d.gas) {
                e.gas = DtoSerialization.toGas(d.gas);
            }

            result.add(e);
        });
        return result;
    }

    public static fromEvents(events: Event[]): EventDto[] {
        const result: EventDto[] = [];
        events.forEach(e => {
            const dto: EventDto = {
                timeStamp: e.timeStamp,
                depth: e.depth,
                type: e.type,
                message: e.message,
            };

            if (e.gas) {
                dto.gas = DtoSerialization.fromGas(e.gas);
            }
            result.push(dto);
        });
        return result;
    }

    public static fromDiver(diver: Diver): DiverDto {
        return {
            rmv: diver.rmv,
            maxPpO2: diver.maxPpO2,
            maxDecoPpO2: diver.maxDecoPpO2
        };
    }

    public static toDiver(dto: DiverDto): Diver {
        const diver = new Diver(dto.rmv, dto.maxPpO2);
        diver.maxDecoPpO2 = dto.maxDecoPpO2;
        return diver;
    }

    public static fromOptions(options: Options): OptionsDto {
        return {
            gfLow: options.gfLow,
            gfHigh: options.gfHigh,
            maxPpO2: options.maxPpO2,
            maxDecoPpO2: options.maxDecoPpO2,
            salinity: options.salinity,
            altitude: options.altitude,
            roundStopsToMinutes: options.roundStopsToMinutes,
            gasSwitchDuration: options.gasSwitchDuration,
            safetyStop: options.safetyStop,
            lastStopDepth: options.lastStopDepth,
            decoStopDistance: options.decoStopDistance,
            minimumAutoStopDepth: options.minimumAutoStopDepth,
            maxEND: options.maxEND,
            oxygenNarcotic: options.oxygenNarcotic,
            ascentSpeed6m: options.ascentSpeed6m,
            ascentSpeed50percTo6m: options.ascentSpeed50percTo6m,
            ascentSpeed50perc: options.ascentSpeed50perc,
            descentSpeed: options.descentSpeed,
            problemSolvingDuration: options.problemSolvingDuration,
        };
    }

    public static toOptions(dto: OptionsDto): Options {
        const options = new Options(dto.gfLow, dto.gfHigh, dto.maxPpO2, dto.maxDecoPpO2, dto.salinity);
        options.altitude = dto.altitude;
        options.roundStopsToMinutes = dto.roundStopsToMinutes;
        options.gasSwitchDuration = dto.gasSwitchDuration;
        options.safetyStop = dto.safetyStop;
        options.lastStopDepth = dto.lastStopDepth;
        options.decoStopDistance = dto.decoStopDistance;
        options.minimumAutoStopDepth = dto.minimumAutoStopDepth;
        options.maxEND = dto.maxEND;
        options.oxygenNarcotic = dto.oxygenNarcotic;
        options.ascentSpeed6m = dto.ascentSpeed6m;
        options.ascentSpeed50percTo6m = dto.ascentSpeed50percTo6m;
        options.ascentSpeed50perc = dto.ascentSpeed50perc;
        options.descentSpeed = dto.descentSpeed;
        options.problemSolvingDuration = dto.problemSolvingDuration;
        return options;
    }

    public static fromDensity(density: HighestDensity): DensityDto {
        return {
            gas: DtoSerialization.fromGas(density.gas),
            depth: density.depth,
            density: density.density
        };
    }

    public static toDensity(dto: DensityDto): HighestDensity {
        const gas = DtoSerialization.toGas(dto.gas);
        return new HighestDensity(gas, dto.depth, dto.density);
    }

    public static toGas(dto: GasDto): Gas {
        return new Gas(dto.fO2, dto.fHe);
    }

    public static fromGas(gas: Gas): GasDto {
        return {
            fO2: gas.fO2,
            fHe: gas.fHe
        };
    }
}
