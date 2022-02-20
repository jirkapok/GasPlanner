import { Segments } from './Segments';

export interface SpeedOptions {
    /**
     * Usual Ascent speed of diver swim in depths below 6 meters in metres/minute, default 3 meters/minute.
     */
    ascentSpeed6m: number;

    /**
     * Usual Ascent speed of diver swim in depths from 75% of maximum depth (50% of average depth)
     * in metres/minute up to 6 meters, default 6 meters/minute.
     */
    ascentSpeed50percTo6m: number;

    /**
     * Usual Ascent speed of diver swim in depths between 50% and 6 meters in metres/minute, default 9  meters/minute.
     */
    ascentSpeed50perc: number;
}

export class AscentSpeeds {
    private static readonly sixMeters = 6;
    // in meters
    public averageDepth = 0;

    constructor(private options: SpeedOptions) { }

    public markAverageDepth(profile: Segments): void {
        const deepestPart = profile.deepestPart();
        this.averageDepth = Segments.averageDepth(deepestPart);
    }

    /** current depth in meters */
    public ascent(currentDepth: number): number {
        const halfTo6m = this.averageDepth / 2;

        if (currentDepth > AscentSpeeds.sixMeters) {
            if (currentDepth > halfTo6m) {
                return this.options.ascentSpeed50perc;
            }

            return this.options.ascentSpeed50percTo6m;
        }

        return this.options.ascentSpeed6m;
    }
}
