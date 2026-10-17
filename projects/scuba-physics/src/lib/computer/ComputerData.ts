/** One sample of the dive computer readings */
export interface RunTimePoint {
    /** in seconds since start of the dive */
    runTime: number;
    /** current depth in meters */
    depth: number;
    /** current maximum depth at this moment in meters, the deepest depth reached so far */
    maxDepth: number;
    /** current average depth at this moment in meters, time weighted from start of the dive */
    averageDepth: number;
    /** current ceiling in meters */
    ceiling: number;
    /**
     * Current no decompression limit at this moment in seconds: remaining time till the ceiling isn't at surface,
     * when staying at current depth on current gas. 0 while in decompression, Infinity at surface or for more than 1000 minutes.
     */
    ndl: number;
    /**
     * Not the total runtime to end of the dive, but current time to surface at this point in the dive profile.
     * This will require calculate the profile for every second of the dive - performance hit maybe not feasible.
     * in seconds.
     **/
    tts: number;
    /**
     * Next stop (decompression or safety stop) not finished yet at this moment, including the stop in progress.
     * A decompression stop takes precedence over an overlapping safety stop.
     * Undefined after the last stop.
     */
    nextStop?: StopEvent;
}

/** Events shown by the dive computer, the stops exist only in the computer data */
export enum ComputerEventType {
    highPpO2 = 0,
    lowPpO2 = 1,
    brokenCeiling = 2,
    gasSwitch = 3,
    /** decompression stop */
    stop = 4,
    safetyStop = 5
}

export interface ComputerEvent {
    type: ComputerEventType;
    /** in seconds since start of the dive */
    runTime: number;
    /** in meters */
    depth: number;
}

export interface GasSwitchEvent extends ComputerEvent {
    type: ComputerEventType.gasSwitch;
    /** name of the gas switched to, e.g. EAN50 */
    gasName: string;
}

export interface StopEvent extends ComputerEvent {
    type: ComputerEventType.stop | ComputerEventType.safetyStop;
    /** in seconds */
    duration: number;
}

/**
 * Model to generate data for computer visualization.
 * Sampling for every second of the dive.
 */
export interface ComputerData {
    profile: RunTimePoint[];
    /** Computer events ignore the planner's ignored-issues list, as a real dive computer would. */
    events: ComputerEvent[];
}
