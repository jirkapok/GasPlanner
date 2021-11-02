import { Options } from './BuhlmannAlgorithm';
import { DepthConverter, DepthConverterFactory } from './depth-converter';
import { Gas } from './Gases';
import { Segment } from './Segments';
import { Time } from './Time';

export enum EventType {
    noAction = 0,
    /** Generic error which prevents algorithm calculation */
    error = 1,
    /** Gas switch happened at this moment */
    gasSwitch = 2,
    /** At this moment, diver reached end of no deco limit */
    reachedNoDeco = 3,
    /** when breathing gas at this depth, it leads to Hypoxia */
    lowPpO2 = 3,
    /** breathing gas with high ppO2 can lead to oxygen toxicity */
    highPpO2 = 4,
    /** high ascent speed can lead to decompression sickness */
    highAscentSpeed = 5,
    /**
     * high descent speed can lead to uncontrolled falls to the bottom
     * or reaching higher depth than expected
     */
    highDescentSpeed = 6,
    /** User defined segments may cross the ceiling */
    brokenCeiling = 7
}

export class Event {
    constructor(
        /** The number of seconds since dive begin the event occurred */
        public timeStamp: number,
        /** depth in meters, at which the diver was, when the event occurred */
        public depth: number,
        /** purpose of the event to happen */
        public type: EventType,
        /** Optional explanation of the event or empty string */
        public message?: string,
        /** Optional data associated with the event, e.g. Gas for gas switch */
        public data?: any
    ) { }
}

export class EventsFactory {
    public static createGasSwitch(timeStamp: number, depth: number, gas: Gas): Event {
        return {
            timeStamp: timeStamp,
            depth: depth,
            type: EventType.gasSwitch,
            data: gas
        };
    }

    public static createError(message: string): Event {
        return {
            timeStamp: 0,
            depth: 0,
            type: EventType.error,
            message: message
        };
    }

    public static createLowPpO2(timestamp: number, depth: number): Event {
        return {
            timeStamp: timestamp,
            depth: depth,
            type: EventType.lowPpO2
        };
    }

    public static createHighPpO2(timestamp: number, depth: number): Event {
        return {
            timeStamp: timestamp,
            depth: depth,
            type: EventType.highPpO2
        };
    }

    public static createHighAscentSpeed(timestamp: number, depth: number): Event {
        return {
            timeStamp: timestamp,
            depth: depth,
            type: EventType.highAscentSpeed
        };
    }

    public static createHighDescentSpeed(timestamp: number, depth: number): Event {
        return {
            timeStamp: timestamp,
            depth: depth,
            type: EventType.highDescentSpeed
        };
    }

    public static createBrokenCeiling(timeStamp: number, depth: number): Event {
        return {
            timeStamp: timeStamp,
            depth: depth,
            type: EventType.brokenCeiling
        };
    }
}

export class Events {
    public items: Event[] = [];

    public add(event: Event): void {
        this.items.push(event);
    }
}

/** all values in bar */
class PressureSegment {
    constructor(
        public startDepth: number,
        public endDepth: number
    ) { }

    public get minDepth(): number {
        return Math.min(this.startDepth, this.endDepth);
    }

    public get maxDepth(): number {
        return Math.max(this.startDepth, this.endDepth);
    }

    public get isDescent(): boolean {
        return this.startDepth < this.endDepth;
    }

    public get isFlat(): boolean {
        return this.startDepth === this.endDepth;
    }

    public get isAscent(): boolean {
        return this.startDepth > this.endDepth;
    }
}

class EventsContext {
    public events: Events = new Events();
    public elapsed = 0;
    public index = 0;

    constructor(private userSegments: number, private profile: Segment[],
        public depthConverter: DepthConverter, public options: Options) { }

    public get previous(): Segment | null {
        if (this.index > 0) {
            return this.profile[this.index - 1];
        }

        return null;
    }

    public get isUserSegment(): boolean {
        return  this.index < this.userSegments;
    }

    public get maxPpo(): number {
        if (this.isUserSegment) {
            return this.options.maxPpO2;
        }

        return this.options.maxDecoPpO2;
    }

    public get current(): Segment {
        return this.profile[this.index];
    }

    public get switchingGas(): boolean {
        return !!this.previous && !this.current.gas.compositionEquals(this.previous.gas);
    }
}

/** Creates events from profile generated by the algorithm */
export class ProfileEvents {
    /** Generates events for calculated profile
     * @param userSegments Number of segments from beginning to count as added by user
     * @param profile Complete list profile segments as user defined + calculated ascent
     * @param options User options used to create the profile
     */
    public static fromProfile(userSegments: number, profile: Segment[], options: Options): Events {
        const depthConverter = new DepthConverterFactory(options).create();
        const context = new EventsContext(userSegments, profile, depthConverter, options);

        for (context.index = 0; context.index < profile.length; context.index++) {
            // nice to have calculate exact time and depth of the events, it is enough it happened
            const pressureSegment = this.toPressureSegment(context.current, depthConverter);
            this.addHighPpO2(context, pressureSegment);
            this.addLowPpO2(context, pressureSegment);
            this.addGasSwitch(context);
            this.addHighDescentSpeed(context);
            this.addHighAscentSpeed(context);
            context.elapsed += context.current.duration;
        }

        return context.events;
    }

    private static addHighAscentSpeed(context: EventsContext) {
        const current = context.current;
        const speed = Time.toSeconds(current.speed);

        // ascent speed is negative number
        if (-speed > context.options.ascentSpeed) {
            const event = EventsFactory.createHighAscentSpeed(context.elapsed, current.startDepth);
            context.events.add(event);
        }
    }

    private static addHighDescentSpeed(context: EventsContext) {
        const current = context.current;
        const speed = Time.toSeconds(current.speed);

        if (speed > context.options.descentSpeed) {
            const event = EventsFactory.createHighDescentSpeed(context.elapsed, current.startDepth);
            context.events.add(event);
        }
    }

    private static addGasSwitch(context: EventsContext): void {
        if (context.switchingGas) {
            const current = context.current;
            const event = EventsFactory.createGasSwitch(context.elapsed, current.startDepth, current.gas);
            context.events.add(event);
        }
    }

    private static toPressureSegment(segment: Segment, depthConverter: DepthConverter) {
        const startPressure = depthConverter.toBar(segment.startDepth);
        const endPressure = depthConverter.toBar(segment.endDepth);
        return new PressureSegment(startPressure, endPressure);
    }

    private static addHighPpO2(context: EventsContext, segment: PressureSegment): void {
        // non user defined gas switches are never to high ppO2 - see gases.bestGas
        // otherwise we don't know which ppO2 level to use
        if (segment.isDescent || (context.isUserSegment && context.switchingGas)) {
            const gasMod = context.current.gas.mod(context.maxPpo);

            if (segment.maxDepth > gasMod) {
                const highDepth = context.depthConverter.fromBar(gasMod);
                const event = EventsFactory.createHighPpO2(context.elapsed, highDepth);
                context.events.add(event);
            }
        }
    }

    private static addLowPpO2(context: EventsContext, segment: PressureSegment): void {
        const gasCeiling = context.current.gas.ceiling(context.depthConverter.surfacePressure);
        const shouldAdd = (segment.minDepth < gasCeiling && context.switchingGas) ||
                          ( segment.startDepth > gasCeiling && gasCeiling > segment.endDepth && segment.isAscent) ||
                          // only at beginning of a dive
                          (context.current.startDepth === 0 && segment.startDepth < gasCeiling && segment.isDescent);

        // only crossing the line or gas switch
        if (shouldAdd) {
            const lowDepth = context.depthConverter.fromBar(gasCeiling);
            const event = EventsFactory.createLowPpO2(context.elapsed, lowDepth);
            context.events.add(event);
        }
    }

}

/**
 * Dive definition point in moment during the dive.
 */
export class Ceiling {
    constructor(
        /**
         * Gets or sets absolute number of seconds since start of the dive
         */
        public time: number,

        /**
         * Gets or sets the maximum safe depth to ascent to in meters.
         */
        public depth: number
    ) { }
}

/**
 * Result of the Algorithm calculation
 */
export class CalculatedProfile {
    /**
     * Not null collection of segments filled whole dive profile.
     */
    public get segments(): Segment[] {
        return this.seg;
    }

    /**
     * Not null collection of ceilings.
     */
    public get ceilings(): Ceiling[] {
        return this.ceil;
    }

    /**
     * Not null collection of errors.
     */
    public get errors(): Event[] {
        return this.err;
    }

    private constructor(private seg: Segment[], private ceil: Ceiling[], private err: Event[]) { }

    public static fromErrors(segments: Segment[], errors: Event[]): CalculatedProfile {
        return new CalculatedProfile(segments, [], errors);
    }


    public static fromProfile(segments: Segment[], ceilings: Ceiling[], errors: Event[]): CalculatedProfile {
        return new CalculatedProfile(segments, ceilings, errors);
    }
}
