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
    /** User switched to gas with higher N2 content */
    switchToHigherN2 = 10
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
        public gas?: Gas
    ) { }
}

export class EventsFactory {
    public static createGasSwitch(timeStamp: number, depth: number, gas: Gas): Event {
        return {
            timeStamp: timeStamp,
            depth: depth,
            type: EventType.gasSwitch,
            gas: gas
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

    public static createMaxEndExceeded(timeStamp: number, depth: number, gas: Gas): Event {
        return {
            timeStamp: timeStamp,
            depth: depth,
            type: EventType.maxEndExceeded,
            gas: gas
        };
    }

    public static createSwitchToHigherN2(timeStamp: number, depth: number, gas: Gas): Event {
        return {
            timeStamp: timeStamp,
            depth: depth,
            type: EventType.switchToHigherN2,
            gas: gas
        };
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

    public static fromProfile(segments: Segment[], ceilings: Ceiling[]): CalculatedProfile {
        return new CalculatedProfile(segments, ceilings, []);
    }
}
