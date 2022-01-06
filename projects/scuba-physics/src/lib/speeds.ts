export interface SpeedOptions {
    /**
     * Usual Ascent speed of diver swim in depths below 6 meters in metres/minute, default 3 meters/minute.
     */
    ascentSpeed6m: number;

    /**
     * Usual Ascent speed of diver swim in depths from 75% of maximum depth in metres/minute up to 6 meters, default 6 meters/minute.
     */
    ascentSpeed50percTo6m: number;

    /**
     * Usual Ascent speed of diver swim in depths between 50% and 6 meters in metres/minute, default 9  meters/minute.
     */
    ascentSpeed50perc: number;
}

export class AscentSpeeds {
    // in meters
    public averageDepth = 0;

    constructor(private options: SpeedOptions) { }

    /** current depth in meters */
    public ascent(currentDepth: number): number {
        // TODO fix the calculation of current ascent speed
        // get average depth from current segment at start of ascent
        // calculate 50percent of depth from average depth as first checkpoint
        return this.options.ascentSpeed6m;
    }
}
