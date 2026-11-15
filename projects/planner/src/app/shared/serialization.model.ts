import {
    ComputerData, DiverDto, EventDto, OptionsDto, PlanRequestDto, RunTimePoint, SegmentDto, TankDto
} from 'scuba-physics';
import { ViewState } from './views.model';

export interface AppPreferences extends AppPreferencesDto {
    states: AppStates;
    quizSessions:  QuizSessionDto[];
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
    consumptionInLiters: boolean;
    /** Rebreather waypoints show the bailout profile, optional because of upgrade */
    showBailoutProfile?: boolean;
    language: string;
    maxDensity: number;
    primaryTankReserve: number;
    stageTankReserve: number;
    icdIgnored: boolean;
    densityIgnored: boolean;
    noDecoIgnored: boolean;
    missingAirBreakIgnored: boolean;
}

export interface QuizSessionDto {
    category: string;
    correctCount: number;
    totalAnswered: number;
    totalScore: number;
    trophyGained: boolean;
}

export interface ComputerRequestDto extends PlanRequestDto {
    /** Identifies the calculation, messages of interrupted calculations are ignored */
    calculationId: number;
    /** Already calculated profile of the dive: user defined segments followed by the calculated ascent */
    profile: SegmentDto[];
    /** Already calculated ceilings of the profile */
    ceilings: CeilingDto[];
    /**
     * Already calculated tissues history of the profile, sampled at the same times as the ceilings,
     * see DtoSerialization.packTissuesHistory
     */
    tissues: Float64Array;
    /** All events of the profile calculated by the algorithm, not filtered by ignored issues */
    events: EventDto[];
}

/** Ceiling after the transfer to the worker, plain object without the methods of Ceiling */
export interface CeilingDto {
    /** in seconds since start of the dive */
    time: number;
    /** in meters */
    depth: number;
}

export interface ComputerStartedDto {
    calculationId: number;
    type: 'started';
    /** Count of points, which will follow */
    total: number;
    events: ComputerData['events'];
}

/** Object references can't be transferred, so next stop is index in the events */
export interface RunTimePointDto extends Omit<RunTimePoint, 'nextStop'> {
    nextStopIndex?: number;
}

export interface ComputerPointDto {
    calculationId: number;
    type: 'point';
    index: number;
    point: RunTimePointDto;
}

export interface ComputerFinishedDto {
    calculationId: number;
    type: 'finished';
}

export type ComputerResultDto = ComputerStartedDto | ComputerPointDto | ComputerFinishedDto;
