import { Segment } from './Segments';

export enum EventType {
    noAction = 0,
    /** At this moment, diver reached end of no deco limit */
    reachedNoDeco = 1,
    /** Gas switch happened at this moment */
    gasSwitch = 2
}

export class Event {
    /** The number of seconds since dive begin the event occurred */
    public timeStamp: number;
    /** depth in meters, at which the diver was, when the event occurred */
    public depth: number;
    /** purpose of the event to happen */
    public type: EventType;
    /** Explanation of the event or empty string */
    public message: string;
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
    public get errorMessages(): string[] {
        return this.errors;
    }

    /**
     * Not null collection of errors occurred during the profile calculation.
     * If not empty, ceilings and segments are empty.
     */
    public get events(): Event[] {
        return this.evnt;
    }

    private constructor(private seg: Segment[], private ceil: Ceiling[], private errors: string[], private evnt: Event[]) { }

    public static fromErrors(errors: string[]) {
        return new CalculatedProfile([], [], errors, []);
    }

    public static fromProfile(segments: Segment[], ceilings: Ceiling[], events: Event[]) {
        return new CalculatedProfile(segments, ceilings, [], events);
    }
}
