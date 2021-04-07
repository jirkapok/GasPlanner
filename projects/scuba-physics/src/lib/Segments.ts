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

    /** Gets count stored items */
    public get length(): number {
        return this.segments.length;
    }

    /** Gets copy of managed items */
    public get items(): Segment[] {
        return this.segments.slice();
    }

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

    public add(startDepth: number, endDepth: number, gas: Gas, duration: number): Segment {
        const segment = new Segment(startDepth, endDepth, gas, duration);
        this.segments.push(segment);

        if (segment.endDepth > this._maxDepth) {
            this._maxDepth = segment.endDepth;
        }

        return segment;
    }

    public addFlat(depth: number, gas: Gas, duration: number): Segment {
        return this.add(depth, depth, gas, duration);
    }

    /** Adds transition to newDepth in meters, from last segment end depth using given gas for given duration in seconds */
    public addChangeTo(newDepth: number, gas: Gas, duration: number): Segment {
        return this.add(this.currentDepth, newDepth, gas, duration);
    }

    /** Returns not null collection managed items after all neighbor elements with identical speed are merged into one */
    public mergeFlat(): Segment[] {
        const toRemove: Segment[] = [];
        for (let index = this.segments.length - 1; index > 0; index--) {
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

    // TODO check units of this method
    /** Calculates duration in seconds for descent from surface to target depth (meters) based on descent speed */
    public static descentDuration(targetDepth: number, options: Options): number {
        return Time.toSeconds(targetDepth / options.descentSpeed);
    }

    /**
     * Returns remaining segments after count of user defined as automatically calculated ascent.
     * @param userSegments Number of segments from the start of the segments array to count as defined by user.
     */
    public static ascent(segments: Segment[], userSegments: number): Segment[] {
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
