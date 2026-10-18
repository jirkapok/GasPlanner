import { Segment } from './Segments';

/**
 * Time weighted average depth from start of the dive, built from the depth of every whole second.
 * Uses cumulative average, so no sum of all depths is kept.
 */
export class AverageDepth {
    /** seconds added after the start of the dive */
    private seconds = 0;
    private previousDepth = 0;
    private started = false;
    private _average = 0;

    /** in meters, the last average returned by add, 0 before the first depth */
    public get average(): number {
        return this._average;
    }

    /**
     * Adds depth of every whole second of the profile, see add. The profile is the whole dive, so use it on a new instance.
     * @param profile Not null profile, the segments follow each other
     * @returns Average depths in meters, index is run time in seconds (0 .. floor of total duration).
     * The first value is the depth at the start. Empty for empty profile.
     */
    public addProfile(profile: Segment[]): number[] {
        const averages: number[] = [];
        const lastSecond = Math.floor(profile.reduce((sum, segment) => sum + segment.duration, 0));
        let segmentIndex = 0;
        let segmentStart = 0;

        for (let runTime = 0; runTime <= lastSecond && profile.length > 0; runTime++) {
            while (segmentIndex < profile.length - 1 && segmentStart + profile[segmentIndex].duration < runTime) {
                segmentStart += profile[segmentIndex].duration;
                segmentIndex++;
            }

            const segment = profile[segmentIndex];
            // zero duration segment has no speed, so it stays at its end depth
            const depth = segment.duration > 0 ? segment.depthAt(runTime - segmentStart) : segment.endDepth;
            averages.push(this.add(depth));
        }

        return averages;
    }

    /**
     * Adds depth of the next whole second of the dive.
     * The first depth is the start of the dive, every next depth is one second later.
     * @param depth in meters
     * @returns average depth in meters from the start of the dive to this second
     */
    public add(depth: number): number {
        if (!this.started) {
            this.started = true;
            this._average = depth;
        } else {
            this.seconds++;
            // trapezoid of the last second, exact for linear depth change
            const secondAverage = (this.previousDepth + depth) / 2;
            this._average += (secondAverage - this._average) / this.seconds;
        }

        this.previousDepth = depth;
        return this._average;
    }
}
