import { Gas, Gases } from './Gases';
import { DepthConverter } from './depth-converter';
import { EventsFactory, Event } from './Profile';


/** all values in bar */
class PressureSegment {
    constructor(
        public startDepth: number,
        public endDepth: number
    ) {}
    
    public get minDepth(): number {
        return Math.min(this.startDepth, this.endDepth)
    }

    public get maxDepth(): number {
        return Math.max(this.startDepth, this.endDepth)
    }
}

export class SegmentsValidator {
    public static validate(segments: Segments, gases: Gases, maxPpo: number, depthConverter: DepthConverter): Event[] {
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

    public static addSegmentEvents(depthConverter: DepthConverter, maxPpo: number, segment: Segment, events: Event[]): void {
        const pressureSegment = this.toPressureSegment(segment, depthConverter);
        this.validateGas(events, segment.gas, pressureSegment, maxPpo, depthConverter);
    }


    private static toPressureSegment(segment: Segment, depthConverter: DepthConverter) {
        const startPressure = depthConverter.toBar(segment.startDepth);
        const endPressure = depthConverter.toBar(segment.endDepth);
        return new PressureSegment(startPressure, endPressure);
    }


    private static validateGas(events: Event[], segmentGas: Gas, pressureSegment: PressureSegment, maxPpo: number, depthConverter: DepthConverter): void {
        const gasMod = segmentGas.mod(maxPpo);
        // nice to have calculate exact time and depth of the events, it is enough it happened

        if (pressureSegment.maxDepth > gasMod) {
            const highDepth = depthConverter.fromBar(gasMod);
            const highPpO2Event = EventsFactory.createHighPpO2(highDepth);
            events.push(highPpO2Event);
        }

        const gasCeiling = segmentGas.ceiling(depthConverter.surfacePressure);

        if (gasCeiling > pressureSegment.minDepth) {
            const lowDepth = depthConverter.fromBar(gasCeiling);
            const lowPpO2Event = EventsFactory.createLowPpO2(lowDepth);
            events.push(lowPpO2Event);
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

    public speedEquals(toCompare: Segment): boolean {
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
            if (segment1.speedEquals(segment2)) {
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
