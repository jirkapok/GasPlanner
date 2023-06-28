import { Gas } from './Gases';
import { Segment } from './Segments';

export enum EventType {
    noAction = 0,
    /** Generic error which prevents algorithm calculation */
    error = 1,
    /** Gas switch happened at this moment */
    gasSwitch = 2,
    /** At this moment, diver reached end of no deco limit */
    reachedNoDeco = 3, // TODO add usage of event reached no deco limit
    /** when breathing gas at this depth, it leads to Hypoxia */
    lowPpO2 = 4,
    /** breathing gas with high ppO2 can lead to oxygen toxicity */
    highPpO2 = 5,
    /** high ascent speed can lead to decompression sickness */
    highAscentSpeed = 6,
    /**
     * high descent speed can lead to uncontrolled falls to the bottom
     * or reaching higher depth than expected
     */
    highDescentSpeed = 7,
    /** User defined segments may cross the ceiling */
    brokenCeiling = 8,
    /** Gas used at the depth exceeds the maximum narcotic depth */
    maxEndExceeded = 9,
    /** User switched to gas with higher N2 content (isobaric counter diffusion - ICD) */
    switchToHigherN2 = 10,
    /** Exceeded maximum gas density at depth */
    highGasDensity = 11,
}

export class Event {
    private constructor(
        /** The number of seconds since dive begin the event occurred */
        public timeStamp: number,
        /** depth in meters, at which the diver was, when the event occurred */
        public depth: number,
        /** purpose of the event to happen */
        public type: EventType,
        /** Optional explanation of the event or empty string */
        public message?: string,
        /** Optional data associated with the event, e.g. Gas for gas switch */
        public gas?: Gas
    ) { }

    public static create(type: EventType, timeStamp: number, depth: number, gas?: Gas): Event {
        return new Event(timeStamp, depth, type, '', gas);
    }

    public static createError(message: string): Event {
        return new Event(0, 0, EventType.error, message);
    }
}

export class EventsFactory {
    public static createError(message: string): Event {
        return Event.createError(message);
    }

    public static createGasSwitch(timeStamp: number, depth: number, gas: Gas): Event {
        return Event.create(EventType.gasSwitch, timeStamp, depth, gas);
    }

    public static createLowPpO2(timeStamp: number, depth: number): Event {
        return Event.create(EventType.lowPpO2, timeStamp, depth);
    }

    public static createHighPpO2(timeStamp: number, depth: number): Event {
        return Event.create(EventType.highPpO2, timeStamp, depth);
    }

    public static createHighAscentSpeed(timeStamp: number, depth: number): Event {
        return Event.create(EventType.highAscentSpeed, timeStamp, depth);
    }

    public static createHighDescentSpeed(timeStamp: number, depth: number): Event {
        return Event.create(EventType.highDescentSpeed, timeStamp, depth);
    }

    public static createBrokenCeiling(timeStamp: number, depth: number): Event {
        return Event.create(EventType.brokenCeiling, timeStamp, depth);
    }

    public static createMaxEndExceeded(timeStamp: number, depth: number, gas: Gas): Event {
        return Event.create(EventType.maxEndExceeded, timeStamp, depth, gas);
    }

    public static createSwitchToHigherN2(timeStamp: number, depth: number, gas: Gas): Event {
        return Event.create(EventType.switchToHigherN2, timeStamp, depth, gas);
    }

    public static createHighDensity(timeStamp: number, depth: number, gas: Gas): Event {
        return Event.create(EventType.highGasDensity, timeStamp, depth, gas);
    }
}

export class Events {
    public items: Event[] = [];

    public add(event: Event): void {
        this.items.push(event);
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

    public get notAtSurface(): boolean {
        return this.depth > 0;
    }

    /**
     *  This is only estimated from ceilings, better prediction is if there is any deco stop needed
     */
    public static isDecoDive(ceilings: Ceiling[]): boolean {
        for (const ceiling of ceilings) {
            if (ceiling.notAtSurface) {
                return true;
            }
        }

        return false;
    }
}

/**
 * Result of the Algorithm calculation
 */
export class CalculatedProfile {
    private constructor(private seg: Segment[], private ceil: Ceiling[], private err: Event[]) { }

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

    public static fromErrors(segments: Segment[], errors: Event[]): CalculatedProfile {
        return new CalculatedProfile(segments, [], errors);
    }

    public static fromProfile(segments: Segment[], ceilings: Ceiling[]): CalculatedProfile {
        return new CalculatedProfile(segments, ceilings, []);
    }
}
