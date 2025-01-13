import { Gas } from './Gases';
import { Segment } from './Segments';
import { LoadedTissue, TissueOverPressures } from './Tissues.api';

export enum EventType {
    noAction = 0,
    /** Generic error which prevents algorithm calculation */
    error = 1,
    /** Gas switch happened at this moment */
    gasSwitch = 2,
    /** At this moment, diver reached end of no deco limit */
    noDecoEnd = 3,
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
    isobaricCounterDiffusion = 10,
    /** Exceeded maximum gas density at depth */
    highGasDensity = 11,
    /* Marks start of additional safety stop */
    safetyStop = 12,
    /* Algorithm is used in shallow depths bellow 9 meters with long exposure which may lead to saturation diving */
    minDepth = 13,
    /* Algorithm si used in depths higher than 120 meters, where the algorithm wasn't tested enough */
    maxDepth = 14,
    /* Unable ot switch to bottom gas, in case of generating air breaks */
    missingAirBreak = 15,
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

    public static createSafetyStopStart(timeStamp: number, depth: number): Event {
        return Event.create(EventType.safetyStop, timeStamp, depth);
    }

    public static createNoDecoEnd(timeStamp: number, depth: number): Event {
        return Event.create(EventType.noDecoEnd, timeStamp, depth);
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

    public static createIsobaricCounterDiffusion(timeStamp: number, depth: number, gas: Gas): Event {
        return Event.create(EventType.isobaricCounterDiffusion, timeStamp, depth, gas);
    }

    public static createHighDensity(timeStamp: number, depth: number, gas: Gas): Event {
        return Event.create(EventType.highGasDensity, timeStamp, depth, gas);
    }

    public static createShallowDepth(depth: number): Event {
        // consider find the moment of maximum depth from the profile
        return Event.create(EventType.minDepth, 0, depth);
    }

    public static createMaxDepth(depth: number): Event {
        // consider find the moment of maximum depth from the profile
        return Event.create(EventType.maxDepth, 0, depth);
    }

    public static createMissingAirBreak(timeStamp: number, depth: number): Event {
        return Event.create(EventType.missingAirBreak, timeStamp, depth);
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
    public static readonly emptyTissueOverPressures: TissueOverPressures = [];
    private constructor(
        private seg: Segment[],
        private ceil: Ceiling[],
        private tiss: LoadedTissue[],
        private _tissueOverPressures: TissueOverPressures,
        private err: Event[]
    ) { }

    /**
     * Not null collection of segments filled whole calculated dive profile.
     * Or user defined part of the profile in case of error.
     */
    public get segments(): Segment[] {
        return this.seg;
    }

    /**
     * Not null collection of ceilings. Empty in case of error.
     */
    public get ceilings(): Ceiling[] {
        return this.ceil;
    }

    /**
     * Not null tissues state at end of the dive or empty in case of error.
     * Items are ordered as Compartments by their half time Buhlmann m-values table.
     * See Compartments class.
     */
    public get tissues(): LoadedTissue[] {
        return this.tiss;
    }

    // TODO consider collect all loaded tissue snapshosts instead and calculate the overpressures later
    public get tissueOverPressures(): number[][] {
        return this._tissueOverPressures;
    }

    /**
     * Not null collection of errors. Or empty in case of successfully calculated profile.
     */
    public get errors(): Event[] {
        return this.err;
    }

    public static fromErrors(segments: Segment[], errors: Event[]): CalculatedProfile {
        return new CalculatedProfile(segments, [], [], CalculatedProfile.emptyTissueOverPressures, errors);
    }

    public static fromProfile(segments: Segment[], ceilings: Ceiling[], tissueOverPressures: number[][],
        tissues: LoadedTissue[]): CalculatedProfile {
        return new CalculatedProfile(segments, ceilings, tissues, tissueOverPressures, []);
    }
}
