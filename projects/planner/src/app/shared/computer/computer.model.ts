import { EventType } from 'scuba-physics';

/** One sample of the dive computer readings */
export interface RunTimePoint {
    /** in seconds since start of the dive */
    runTime: number;
    /** current depth in meters */
    depth: number;
    /** current ceiling in meters */
    ceiling: number;
    /** remaining no decompression time in seconds */
    ndl: number;
    /**
     * Not the total runtime to end of the dive, but current time to surface at this point in the dive profile.
     * This will require calculate the profile for every second of the dive - performance hit maybe not feasible.
     * in seconds.
     **/
    tts: number;
}

export interface Warning {
    /** in seconds */
    runTime: number;
    eventType: EventType;
    message: string;
}

/**
 * Model to generate data for computer visualization.
 * Sampling for every second of the dive.
 */
export interface ComputerData {
    profile: RunTimePoint[];
    events: Warning[];
}
