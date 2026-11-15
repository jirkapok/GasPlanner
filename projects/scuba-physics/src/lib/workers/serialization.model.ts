import { Tank } from '../consumption/Tanks';
import { Ceiling, EventType } from '../algorithm/CalculatedProfile';
import { Salinity } from '../physics/pressure-converter';
import { SafetyStop } from '../algorithm/Options';
import { CircuitType } from '../ccr/RebreatherOptions';
import { TissueOverPressures } from '../algorithm/Tissues.api';

/** Plan DTOs used to store the plan and for communication with the background workers, shared with the MCP server */
/**
 *  We can't us TankBound from models directly,
 *  because it will cause unresolved dependency in background tasks
 **/
export interface ITankBound {
    id: number;
    /** in bars to avoid conversions */
    workingPressureBars: number;
    tank: Readonly<Tank>;
}

export interface PlanRequestDto {
    diveId: number;
    tanks: TankDto[];
    /** Only the source plan segments defined by user */
    plan: SegmentDto[];
    options: OptionsDto;
    /** needed by rebreathers, where the breathed gas depends on the diver */
    diver: DiverDto;
    previousTissues: LoadedTissueDto[];
    surfaceInterval: number;
}

export type ProfileRequestDto = PlanRequestDto;

export interface DiveInfoRequestDto extends PlanRequestDto{
    eventOptions: EventOptionsDto;
    calculatedProfile: SegmentDto[];
    /** At end of the calculated profile, not previous one */
    calculatedTissues: LoadedTissueDto[];
    /** CNS % at end of previous dive, 0 for first dive */
    previousCns: number;
    /** Daily CNS exposures at end of previous dive, empty for first dive */
    previousCnsExposures: CnsExposureDto[];
}

export interface CnsExposureDto {
    duration: number;
    cns: number;
}

export interface EventOptionsDto {
    maxDensity: number;
}

export interface DiveInfoResultDto {
    diveId: number;
    noDeco: number;
    otu: number;
    /** CNS % at end of the dive including residual CNS from previous dive */
    cns: number;
    /** CNS % of the daily limit consumed by all dives within last 24 hours */
    dailyCns: number;
    cnsExposures: CnsExposureDto[];
    density: DensityDto;
    averageDepth: number;
    events: EventDto[];
    surfaceGradient: number;
    offgasingStartTime: number;
    offgasingStartDepth: number;
    ceilings: Ceiling[];
    /** Tissues history sampled at the same times as the ceilings, see DtoSerialization.packTissuesHistory */
    tissues: Float64Array;
    tissueOverPressures: TissueOverPressures[];
}

export interface DensityDto {
    gas: GasDto;
    depth: number;
    density: number;
}

export interface ProfileResultDto {
    diveId: number;
    profile: CalculatedProfileDto;
}

export interface EventDto {
    timeStamp: number;
    depth: number;
    type: EventType;
    message?: string;
    gas?: GasDto;
    value?: number;
}

export interface CalculatedProfileDto {
    segments: SegmentDto[];
    finalTissues: LoadedTissueDto[];
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
    previousTissues: LoadedTissueDto[];
    surfaceInterval: number;
}

export interface ConsumptionOptionsDto {
    diver: DiverDto;
    primaryTankReserve: number;
    stageTankReserve: number;
}

export interface ConsumedDto {
    /** Tank id */
    id: number;
    // Liters, the primary value of the consumption calculation, bars are derived by the Tank.
    consumedVolume: number;
    reserveVolume: number;
}

export interface ConsumedGasDto {
    gas: GasDto;
    /** Available gas in liters */
    total: number;
    /** Consumed gas in liters */
    consumed: number;
    /** Reserve in liters */
    reserve: number;
}

export interface ConsumptionResultDto {
    diveId: number;
    maxTime: number;
    timeToSurface: number;
    tanks: ConsumedDto[];
    /** Consumption grouped by gas, calculated together with tanks consumption */
    gases: ConsumedGasDto[];
    emergencyAscent: SegmentDto[];
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
    /** optional because of upgrade, missing means open circuit */
    rebreather?: RebreatherDto;
}

export interface RebreatherDto {
    circuit: CircuitType;
    /** liters/minute */
    metabolicO2: number;
    /** liters */
    loopVolume: number;
    injectionRatio: number;
    /** mCCR target ppO2 in bars, optional because of upgrade */
    setpoint?: number;
    /** mCCR oxygen flow in liters/minute, optional because of upgrade */
    o2Flow?: number;
    /** eCCR setpoint in bars shallower than the switch depth, optional because of upgrade */
    descentSetpoint?: number;
    /** eCCR setpoint in bars deeper than the switch depth, optional because of upgrade */
    bottomSetpoint?: number;
    /** eCCR setpoint in bars from the deepest point, optional because of upgrade */
    decoSetpoint?: number;
    /** eCCR setpoint switch depth in meters, optional because of upgrade */
    setpointSwitchDepth?: number;
}
