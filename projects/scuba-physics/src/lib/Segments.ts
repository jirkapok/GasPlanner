import { Gas, Gases } from './Gases';
import { Event, EventsFactory } from './CalculatedProfile';
import { Tank } from './Tanks';
import { LinearFunction } from './linearFunction';

export class SegmentsValidator {
    public static validate(segments: Segments, gases: Gases): Event[] {
        const events: Event[] = [];

        if (!segments.any()) {
            const error = EventsFactory.createError('There needs to be at least one segment at depth.');
            events.push(error);
        }

        segments.items.forEach(segment => {
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
    public _startDepth: number;
    public _endDepth: number;
    public _duration: number;
    private _tank?: Tank;
    private _gas: Gas;

    constructor(
        /** in meters */
        startDepth: number,
        /** in meters */
        endDepth: number,
        /**
         *  Use tank for user defined segments otherwise gas only.
         *  User defined tank is used to enforce the tank usage in emergency ascent consumed gas calculation.
         **/
        source: Gas | Tank,
        /** in seconds */
        duration: number) {
        this._startDepth = startDepth;
        this._endDepth = endDepth;
        this._duration = duration;

        if(source instanceof Tank) {
            this._tank = source;
            this._gas = source.gas;
        } else {
            this._gas = source;
        }
    }

    /** in meters */
    public get startDepth(): number {
        return this._startDepth;
    }

    /** in meters */
    public get endDepth(): number {
        return this._endDepth;
    }

    /** in seconds */
    public get duration(): number {
        return this._duration;
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
     * meters per second, positive for descent, negative for ascent
     */
    public get speed(): number {
        return Segment.speed(this.startDepth, this.endDepth, this.duration);
    }

    /** in meters */
    public get averageDepth(): number {
        return (this.startDepth + this.endDepth) / 2;
    }

    /** in meters */
    public set startDepth(newValue: number) {
        this._startDepth = newValue;
    }

    /** in meters */
    public set endDepth(newValue: number) {
        this._endDepth = newValue;
    }

    /** in seconds */
    public set duration(newValue: number) {
        this._duration = newValue;
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

    public static from(other: Segment): Segment {
        const copy = new Segment(other.startDepth, other.endDepth, other._gas, other.duration);
        // this assignment causes some rounding issues, which are ignored
        copy.tank = other.tank;
        return copy;
    }

    /**
     * We don't care about the units, this is still valid for both meter and bars.
     * Duration in seconds.
     */
    public static speed(startDepth: number, endDepth: number, duration: number): number {
        return LinearFunction.speedByXChange(startDepth, endDepth, duration);
    }

    /**
     * We don't care about the units, this is still valid for both meter and bars.
     * Duration in seconds.
     */
    public static depthAt(startDepth: number, speed: number, duration: number): number {
        return LinearFunction.yValueAt(startDepth, speed, duration);
    }

    /**
     * Returns number of seconds it takes to reach currentDepth from start depth.
     * We don't care about the units, this is still valid for both meter and bars.
     * Duration in seconds.
     */
    public static timeAt(startDepth: number, speed: number, currentDepth: number): number {
        return LinearFunction.xValueAt(startDepth, speed, currentDepth);
    }

    public contentEquals(toCompare: Segment): boolean {
        return this.speed === toCompare.speed &&
            this._gas.compositionEquals(toCompare._gas);
    }

    /**
     * @param duration Seconds since start of this segment
     * @returns current depth in meters where the diver was at the moment
     */
    public depthAt(duration: number): number {
        return Segment.depthAt(this.startDepth, this.speed, duration);
    }

    public mergeFrom(toAdd: Segment): void {
        this.duration += toAdd.duration;
        this.endDepth = toAdd.endDepth;
    }
}

export class Segments {
    private segments: Segment[] = [];
    private _maxDepth = 0;

    /** Index of the first segment, where the ascent starts */
    public get startAscentIndex(): number {
        return this.deepestPart().length;
    }

    /**
     * Duration of dive up to the ascent start in seconds.
     */
    public get startAscentTime(): number {
        const toCount = this.deepestPart();
        return Segments.duration(toCount);
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

    /** Gets total duration of all segments in seconds */
    public get duration(): number {
        return Segments.duration(this.segments);
    }

    /** deep copy of all element, Does not fix start depths  */
    public static from(other: Segments): Segments {
        const result = Segments.fromCollection(other.segments);
        return result;
    }

    /** Deep copy of all elements, Does not fix start depths */
    public static fromCollection(segments: Segment[]): Segments {
        const result = new Segments();

        segments.forEach(source => {
            const newSegment = Segment.from(source);
            result.segments.push(newSegment);
            result.updateMaxDepth(newSegment);
        });
        return result;
    }

    /**
     * Sum of all profile segments duration in seconds
     * @param profile Not null collection of segments to count with
     * @returns Total sum of all elements duration in seconds
     */
    public static duration(profile: Segment[]): number {
        let total = 0;

        for (const segment of profile) {
            total += segment.duration;
        }

        return total;
    }

    /**
     * Find depth in meters, at which the diver was at given runtime in seconds for given profile.
     * @param profile Not empty array of elements of valid profile.
     * @param runtime Positive number in seconds within the profile segments total duration.
     * @returns Returns 0 m, if no segments fits the runtime or the segments array is empty.
     **/
    public static depthAt(profile: Segment[], runtime: number): number {
        let elapsedSince = 0;

        for (let index = 0; index < profile.length; index++) {
            const segment = profile[index];
            const remainingDuration = runtime - elapsedSince;

            if (elapsedSince <= runtime && remainingDuration <= segment.duration) {
                return segment.depthAt(remainingDuration);
            }

            elapsedSince += segment.duration;
        }

        return 0;
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
            if (segment.duration > 0) {
                const cumulativeWeight = segment.averageDepth * segment.duration + totalDuration * cumulativeAverage;
                totalDuration += segment.duration;
                cumulativeAverage = cumulativeWeight / totalDuration;
            }
        });

        return cumulativeAverage;
    }

    /**
     * Adds transition to newDepth in meters, from last segment end depth using given gas for given duration in seconds
     * @param newDepth The target depth in meters
     * @param  in meters
     * @param source Tank in case user defined segment, otherwise gas, see segment constructor
     * @param duration in seconds
     */
    public add(newDepth: number, source: Tank | Gas, duration: number): Segment {
        const segment = new Segment(this.currentDepth, newDepth, source, duration);
        this.segments.push(segment);
        this.updateMaxDepth(segment);
        return segment;
    }

    /**
     * Adds continuation of last segment at its endDepth, use for stops or hover swim
     * @param source Tank in case user defined segment, otherwise gas, see segment constructor
     * @param duration in seconds
     */
    public addFlat(source: Tank | Gas, duration: number): Segment {
        return this.add(this.currentDepth, source, duration);
    }

    /**
     * @param skipItems Positive number of items from start of this collection to don't merge.
     * @returns not null collection managed items after all neighbor elements with identical speed are merged into one
     * */
    public mergeFlat(skipItems = 0): Segment[] {
        if (skipItems < 0) {
            return this.items;
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
        return this.items;
    }

    /** Removes the given segment from managed collection */
    public remove(segment: Segment): void {
        this.segments = this.segments.filter(s => s !== segment);
        this.fixStartDepths();
    }

    /**
     * Removes required number of elements from end of the array
     * @param count Number of segments to remove
     */
    public cutDown(count: number): void {
        const endIndex = this.segments.length - count;
        this.segments = this.segments.slice(0, endIndex);
        this.fixStartDepths();
    }

    public any(): boolean {
        return this.segments.length !== 0;
    }

    public last(): Segment {
        return this.segments[this.segments.length - 1];
    }

    /* deep copy of managed items */
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

    /**
    * Returns all segments up to the last deepest point.
    * In case of multiple depths the average on the last occurrence will be smaller.
    * But it is Ok, since the last segment is the one, where decompression ascent is calculated.
    */
    public deepestPart(): Segment[] {
        for (let index = this.segments.length - 1; index >= 0; index--) {
            if (this.segments[index].endDepth === this.maxDepth) {
                return this.items.slice(0, index + 1);
            }
        }

        return [];
    }

    private updateMaxDepth(segment: Segment): void {
        if (segment.endDepth > this._maxDepth) {
            this._maxDepth = segment.endDepth;
        }
    }
}


