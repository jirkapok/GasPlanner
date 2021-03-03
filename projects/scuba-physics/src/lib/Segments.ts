import { Gas, Gases } from './Gases';
import { EventsFactory, Event } from './Profile';
import { Options } from './BuhlmannAlgorithm';
import { Time } from './Time';

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
    constructor (
        /** in meters */
        public startDepth: number,
        /** in meters */
        public endDepth: number,
        public gas: Gas,
        /** in seconds */
        public duration: number) {}

    public contentEquals(toCompare: Segment): boolean {
        return this.speed === toCompare.speed &&
            this.gas === toCompare.gas;
    }

    /**
     * meters per second
     */
    public get speed(): number {
        return (this.endDepth - this.startDepth) / this.duration;
    }

    public get isFlat(): boolean {
        return this.startDepth === this.endDepth;
    }

    public mergeFrom(toAdd: Segment): void {
        this.duration += toAdd.duration;
        this.endDepth = toAdd.endDepth;
    }
}

export class Segments {
    private segments: Segment[] = [];
    private _maxDepth: number = 0;

    public get maxDepth(): number {
        return this._maxDepth;
    }

    public add(startDepth: number, endDepth: number, gas: Gas, duration: number): Segment {
        const segment = new Segment(startDepth, endDepth, gas, duration);
        this.segments.push(segment);

        if(segment.endDepth > this._maxDepth) {
            this._maxDepth = segment.endDepth;
        }
        
        return segment;
    }

    public addFlat(depth: number, gas: Gas, duration: number) {
        this.add(depth, depth, gas, duration);
    }

    public mergeFlat(): Segment[] {
        const toRemove = [];
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

    public withAll(callBack: (segment: Segment) => void): void {
        for(let index = 0; index < this.segments.length; index++) {
            callBack(this.segments[index]);
        }
    }

    public any(): boolean {
        return this.segments.length !== 0;
    }

    public last(): Segment {
        return this.segments[this.segments.length - 1];
    }
}


/** Creates skeleton for dive profile */
export class SegmentsFactory {

    /**
     * Generates descent and swim segments for one level profile and returns newly created segments.
     * 
     * @param targetDepth in meters
     * @param duration in minutes
     * @param gas gas to be assigned to the segments
     * @param options Ascent/descent speeds
     */
    public static createForPlan(targetDepth: number, duration: number, gas: Gas, options: Options): Segments {
        const segments = new Segments();
        const descentDuration = SegmentsFactory.descentDuration(targetDepth, options);
        segments.add(0, targetDepth, gas, descentDuration);
        let bottomTime = Time.toSeconds(duration) - descentDuration;
        // not enough time to descent
        bottomTime = bottomTime < 0 ? 0 : bottomTime;
        segments.addFlat(targetDepth, gas, bottomTime);
        return segments;
    }

    // TODO multilevel diving: fix minimum duration based on required descent/ascent time
    /** Calculates duration in seconds for descent from surface to target depth (meters) based on descent speed */
    public static descentDuration(targetDepth: number, options: Options) {
        return Time.toSeconds(targetDepth / options.descentSpeed);
    }
}
