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


    

    // const pressureSegment = this.toPressureSegment(segment, depthConverter);
    // this.validateGas(messages, segment.gas, pressureSegment, maxPpo, depthConverter.surfacePressure);

    private static toPressureSegment(segment: Segment, depthConverter: DepthConverter) {
        const startPressure = depthConverter.toBar(segment.startDepth);
        const endPressure = depthConverter.toBar(segment.endDepth);
        return new PressureSegment(startPressure, endPressure);
    }


    private static validateGas(messages: string[], segmentGas: Gas, pressureSegment: PressureSegment, maxPpo: number, surfacePressure: number): void {
        const gasMod = segmentGas.mod(maxPpo);

        if (pressureSegment.maxDepth > gasMod) {
            // TODO move to algorithm as high ppO2: messages.push('Gas is not breathable at bottom segment depth.');
        }

        const gasCeiling = segmentGas.ceiling(surfacePressure);

        if (gasCeiling > pressureSegment.minDepth) {
            // TODO move to algorithm as low ppO2: messages.push('Gas is not breathable at segment ceiling.');
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
