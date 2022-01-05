export interface SpeedOptions {
    /**
     * Usual Ascent speed of diver swim in depths below 6 meters in metres/minute, default 3 meters/minute.
     */
    ascentSpeed6m: number;

    /**
     * Usual Ascent speed of diver swim in depths from 75% of maximum depth in metres/minute up to 6 meters, default 6 meters/minute.
     */
    ascentSpeed75percTo6m: number;

    /**
     * Usual Ascent speed of diver swim in depths between 50% and 6 meters in metres/minute, default 9  meters/minute.
     */
    ascentSpeed75perc: number;
}

export class AscentSpeeds {
    constructor(private options: SpeedOptions) { }

    /** current and max depth in meters */
    public ascent(currentDepth: number, maxDepth: number): number {
        return this.options.ascentSpeed6m;
    }
}
