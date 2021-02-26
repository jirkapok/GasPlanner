import { Gas } from './Gases';
import { Segment } from './Segments';

export enum EventType {
    noAction = 0,
    /** Generic error which prevents algorithm calculation */
    error = 1,
    /** Gas switch happened at this moment */
    gasSwitch = 2,
    /** At this moment, diver reached end of no deco limit */
    reachedNoDeco = 3
}

export class Event {
    /** The number of seconds since dive begin the event occurred */
    public timeStamp: number;
    /** depth in meters, at which the diver was, when the event occurred */
    public depth: number;
    /** purpose of the event to happen */
    public type: EventType;
    /** Optional explanation of the event or empty string */
    public message?: string;
    /** Optional data associated with the event, e.g. Gas for gas switch */
    public data?: any;
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
}

/**
 * Dive definition point in moment during the dive.
 */
export class Ceiling {
    /**
     * Gets or sets moment in seconds during the dive
     */
    public time: number;

    /**
     * Gets or sets the maximum safe depth to ascent to.
     */
    public depth: number;
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
     * Not null collection of errors occurred during the profile calculation.
     * If not empty, ceilings and segments are empty.
     */
    public get events(): Event[] {
        return this.evnt;
    }

    private constructor(private seg: Segment[], private ceil: Ceiling[], private evnt: Event[]) { }

    public static fromErrors(errors: Event[]) {
        return new CalculatedProfile([], [], errors);
    }

    public static fromProfile(segments: Segment[], ceilings: Ceiling[], events: Event[]) {
        return new CalculatedProfile(segments, ceilings, events);
    }
}
