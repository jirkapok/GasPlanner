import { Gas, Gases } from './Gases';
import { EventsFactory, Event } from './Profile';
import { Options } from './BuhlmannAlgorithm';
import { Time } from './Time';
import { Tank } from './Tanks';

export class SegmentsValidator {
    public static validate(segments: Segments, gases: Gases): Event[] {
        const events: Event[] = [];

        if (!segments.any()) {
            const error = EventsFactory.createError('There needs to be at least one segment at depth.');
            events.push(error);
        }

        segments.withAll(segment => {
            SegmentsValidator.validateRegisteredGas(events, gases, segment);
        });

        return events;
    }

    private static validateRegisteredGas(events: Event[], gases: Gases, segment: Segment): void {
        if (!gases.isRegistered(segment.gas)) {
            // no need to translate or convert units, this is development message.
            const message = `Segment ${segment.startDepth}-${segment.endDepth} has gas not registered in gases.`;
            const error = EventsFactory.createError(message);
            events.push(error);
        }
    }
}

export class Segment {
    private _tank?: Tank;

    constructor(
        /** in meters */
        public startDepth: number,
        /** in meters */
        public endDepth: number,
        private _gas: Gas,
        /** in seconds */
        public duration: number) { }

    public static from(other: Segment): Segment {
        return new Segment(other.startDepth, other.endDepth, other._gas, other.duration);
    }

    /** See tank, you can change gas only by assigning tank,
     * gas doesn't change for calculated segments.
     */
    public get gas(): Gas {
        return this._gas;
    }

    public get tank(): Tank | undefined {
        return this._tank;
    }

    /**
     * Gets or sets optional tank assignment.
     * If defined, user prefers to use this tank for consumption.
     * Assigning the tank overrides the gas also by gas from the tank.
     * This property should be used only for user defined segments.
    */
    public set tank(newValue: Tank | undefined) {
        this._tank = newValue;

        if (newValue) {
            this._gas = newValue.gas;
        }
    }

    public contentEquals(toCompare: Segment): boolean {
        return this.speed === toCompare.speed &&
            this._gas === toCompare._gas;
    }

    /**
     * meters per second, positive for descent, negative for ascent
     */
    public get speed(): number {
        return (this.endDepth - this.startDepth) / this.duration;
    }

    public mergeFrom(toAdd: Segment): void {
        this.duration += toAdd.duration;
        this.endDepth = toAdd.endDepth;
    }
}

export class Segments {
    private segments: Segment[] = [];
    private _maxDepth = 0;

    public static from(other: Segments): Segments {
        const result = new Segments();
        result._maxDepth = other._maxDepth;

        result.segments = [];
        other.segments.forEach(source => {
            // ignore gas for now
            const newSegment = Segment.from(source);
            result.segments.push(newSegment);
        });

        return result;
    }

    /** Calculates average depth in meters from provided segments */
    public static averageDepth(segments: Segment[]): number {
        if (segments.length <= 0) {
            return 0;
        }

        let cumulativeAverage = 0;
        let totalDuration = 0;

        // Uses cumulative average to prevent number overflow for large segment durations
        segments.forEach(segment => {
            if(segment.duration > 0) {
                const segmentAverage = (segment.endDepth + segment.startDepth) / 2;
                const cumulativeWeight = segmentAverage * segment.duration + totalDuration * cumulativeAverage;
                totalDuration += segment.duration;
                cumulativeAverage = cumulativeWeight / totalDuration;
            }
        });

        return cumulativeAverage;
    }

    /** Gets count stored items */
    public get length(): number {
        return this.segments.length;
    }

    /** Gets copy of managed items */
    public get items(): Segment[] {
        return this.segments.slice();
    }

    /** in meters */
    public get maxDepth(): number {
        return this._maxDepth;
    }

    /** Gets end depth of last segment as current depth in meters during profile generation */
    public get currentDepth(): number {
        if (this.any()) {
            return this.last().endDepth;
        }

        return 0;
    }

    /** in seconds */
    public get duration(): number {
        let total = 0;

        for (let index = 0; index < this.segments.length; index++) {
            const current = this.segments[index];
            total += current.duration;
        }

        return total;
    }

    /**
     * @param startDepth in meters
     * @param endDepth in meters
     * @param duration in seconds
     */
    public add(startDepth: number, endDepth: number, gas: Gas, duration: number): Segment {
        const segment = new Segment(startDepth, endDepth, gas, duration);
        this.segments.push(segment);
        this.updateMaxDepth(segment);
        return segment;
    }

    /**
    * @param depth in meters
    * @param duration in seconds
    */
    public addFlat(depth: number, gas: Gas, duration: number): Segment {
        return this.add(depth, depth, gas, duration);
    }

    /** Adds transition to newDepth in meters, from last segment end depth using given gas for given duration in seconds */
    public addChangeTo(newDepth: number, gas: Gas, duration: number): Segment {
        return this.add(this.currentDepth, newDepth, gas, duration);
    }

    /**
     * @param skipItems Positive number of items from start of this collection to don't merge.
     * @returns not null collection managed items after all neighbor elements with identical speed are merged into one
     * */
    public mergeFlat(skipItems = 0): Segment[] {
        if(skipItems < 0) {
            return this.segments;
        }

        const toRemove: Segment[] = [];
        for (let index = this.segments.length - 1; index > skipItems; index--) {
            const segment1 = this.segments[index - 1];
            const segment2 = this.segments[index];
            if (segment1.contentEquals(segment2)) {
                segment1.mergeFrom(segment2);
                toRemove.push(segment2);
            }
        }

        this.segments = this.segments.filter(s => !toRemove.includes(s));
        return this.segments;
    }

    /** Removes the given segment from managed collection */
    public remove(segment: Segment): void {
        this.segments = this.segments.filter(s => s !== segment);
        this.fixStartDepths();
    }

    public withAll(callBack: (segment: Segment) => void): void {
        for (let index = 0; index < this.segments.length; index++) {
            callBack(this.segments[index]);
        }
    }

    public any(): boolean {
        return this.segments.length !== 0;
    }

    public last(): Segment {
        return this.segments[this.segments.length - 1];
    }

    public copy(): Segments {
        return Segments.from(this);
    }

    /** This helps keep the list linked by setting all start depths to previous segment endDepth. */
    public fixStartDepths(): void {
        // in case of remove first segment, we enforce start from surface (0m).
        if (this.any()) {
            this.segments[0].startDepth = 0;
        }

        for (let index = 0; index < this.segments.length - 1; index++) {
            const previous = this.segments[index];
            const current = this.segments[index + 1];
            current.startDepth = previous.endDepth;
            this.updateMaxDepth(current);
        }
    }

    private updateMaxDepth(segment: Segment): void {
        if (segment.endDepth > this._maxDepth) {
            this._maxDepth = segment.endDepth;
        }
    }
}


/** Creates skeleton for dive profile */
export class SegmentsFactory {

    /**
     * Generates descent and swim segments for one level profile and returns newly created segments.
     * Returns always two segments.
     * If there isn't enough time for swim at target depth, the second segment duration is zero seconds.
     *
     * @param targetDepth in meters
     * @param duration in minutes
     * @param tank to be assigned to the segments
     * @param options Ascent/descent speeds
     */
    public static createForPlan(targetDepth: number, duration: number, tank: Tank, options: Options): Segments {
        const segments = new Segments();
        const descentDuration = SegmentsFactory.descentDuration(targetDepth, options);
        const descent = segments.add(0, targetDepth, tank.gas, descentDuration);
        descent.tank = tank;
        let bottomTime = Time.toSeconds(duration) - descentDuration;
        // not enough time to descent
        bottomTime = bottomTime < 0 ? 0 : bottomTime;
        const swim = segments.addFlat(targetDepth, tank.gas, bottomTime);
        swim.tank = tank;
        return segments;
    }

    /** Calculates duration in seconds for descent from surface to target depth (meters) based on descent speed */
    public static descentDuration(targetDepth: number, options: Options): number {
        return Time.toSeconds(targetDepth / options.descentSpeed);
    }

    /**
     * Returns remaining segments after count of user defined as automatically calculated ascent.
     * @param userSegments Number of segments from the start of the segments array to count as defined by user.
     */
    public static ascent(segments: Segment[], userSegments: number): Segment[] {
        // TODO test scenario: user defined segment is also part of the emergency ascent (e.g. deepest point),
        // we should identify the ascent another way than from last user defined segments
        // How to identify the worst point during the dive?
        // - take last segment as ascent - obviously not enough
        // - take deepest segment - doesn't have to be the ascent to end the dive, but is place where you need most of the gas
        // - take segment with highest ceiling, for no deco take deepest
        // - Is the deepest also with the minimum gas? Doesn't have to be.
        // - Take all segments from end till first descent - doesn't cover multilevel dives
        // Calculate this only in case user defined segments up to the surface
        // \              _/
        //  \   _        /
        //   \_/ \_  Asc/
        return segments.slice(userSegments, segments.length);
    }

    public static timeToSurface(ascent: Segment[]): number {
        const solutionDuration = 2 * Time.oneMinute;
        let duration = 0;

        for (const segment of ascent) {
            duration += segment.duration;
        }

        const seconds = solutionDuration + duration;
        return Time.toMinutes(seconds);
    }
}
