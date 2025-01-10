import {
    Tank, Ceiling, EventType,
    Salinity, SafetyStop, ProfileMoment
} from 'scuba-physics';
import { ViewState } from './views.model';

export interface AppPreferences extends AppPreferencesDto {
    states: AppStates;
}

export interface AppStates {
    /** route to the last page opened */
    lastScreen: string;
    /** all other views than plan, because its state are dives */
    states: ViewState[];
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
    surfaceInterval?: number;
}

/**
 * Send these in url, because screen without them
 * may cause different/unexpected rounding and value ranges
 **/
export interface AppOptionsDto {
    imperialUnits: boolean;
    isComplex: boolean;
    language: string;
    maxDensity: number;
    primaryTankReserve: number;
    stageTankReserve: number;
    icdIgnored: boolean;
    densityIgnored: boolean;
    noDecoIgnored: boolean;
    missingAirBreakIgnored: boolean;
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

export interface PlanRequestDto {
    diveId: number;
    tanks: TankDto[];
    /** Only the source plan segments defined by user */
    plan: SegmentDto[];
    options: OptionsDto;
    tissues: LoadedTissueDto[];
    surfaceInterval: number;
}

export interface ProfileRequestDto extends PlanRequestDto {
    eventOptions: EventOptionsDto;
}

export interface DiveInfoRequestDto extends PlanRequestDto{
    calculatedProfile: SegmentDto[];
    /** At end of the calculated profile, not previous one */
    calculatedTissues: LoadedTissueDto[];
    calculatedOverPressures: number[][];
}

export interface EventOptionsDto {
    maxDensity: number;
}

export interface DiveInfoResultDto {
    diveId: number;
    noDeco: number;
    otu: number;
    cns: number;
    density: DensityDto;
    averageDepth: number;
    surfaceGradient: number;
    offgasingStart: ProfileMoment;
}

export interface DensityDto {
    gas: GasDto;
    depth: number;
    density: number;
}

export interface ProfileResultDto {
    diveId: number;
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
    tissues: LoadedTissueDto[];
    tissueOverPressures: number[][];
    errors: EventDto[];
}

export interface LoadedTissueDto {
    pHe: number;
    pN2: number;
}

export interface ConsumptionRequestDto {
    diveId: number;
    isComplex: boolean;
    plan: SegmentDto[];
    profile: SegmentDto[];
    options: OptionsDto;
    consumptionOptions: ConsumptionOptionsDto;
    tanks: TankDto[];
}

export interface ConsumptionOptionsDto {
    diver: DiverDto;
    primaryTankReserve: number;
    stageTankReserve: number;
}

export interface ConsumedDto {
    /** Tank id */
    id: number;
    consumed: number;
    reserve: number;
}

export interface ConsumptionResultDto {
    diveId: number;
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
    stressRmv: number;
}

export interface AirBreaksDto {
    enabled: boolean;
    oxygenDuration: number;
    bottomGasDuration: number;
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
    /** optional because of upgrade */
    airBreaks?: AirBreaksDto;
}
