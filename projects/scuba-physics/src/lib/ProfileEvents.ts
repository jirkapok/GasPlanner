import { Options } from './Options';
import { DepthConverter, DepthConverterFactory } from './depth-converter';
import { Ceiling, EventsFactory, Events } from './CalculatedProfile';
import { Segment, Segments } from './Segments';
import { Time } from './Time';
import { AscentSpeeds } from './speeds';
import { Precision } from './precision';
import { DensityAtDepth } from './GasDensity';
import { DepthLevels } from './DepthLevels';
import { LinearFunction } from './linearFunction';

/** all values in bar */
class PressureSegment {
    constructor(
        public startDepth: number,
        public endDepth: number,
        public duration: number
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

    public timeAt(currentDepth: number): number {
        const speed = Segment.speed(this.startDepth, this.endDepth, this.duration);
        const time = Segment.timeAt(this.startDepth, speed, currentDepth);
        return Precision.round(time);
    }
}

class EventsContext {
    /** because of UI, e.g. depths for MOD, user wants to see well known values like 6 m MOD for oxygen */
    public simpleDepths: DepthConverter = DepthConverter.simple();
    /** for exact measures like density */
    public exactDepths: DepthConverter;
    public densityAtDepth: DensityAtDepth;
    public events: Events = new Events();
    public speeds: AscentSpeeds;
    public options: Options;
    /** total duration in seconds at beginning of current segment */
    public elapsed = 0;
    public index = 0;
    public fixedMnd = true;
    public maxDensity: number;
    private levels: DepthLevels;
    private startAscentIndex: number;
    private profile: Segment[];
    private _mndBars: number;
    private maxDepth: number;

    constructor(eventOptions: EventOptions) {
        this.profile = eventOptions.profile;
        this.options = eventOptions.profileOptions;
        this.startAscentIndex = eventOptions.startAscentIndex;
        this.maxDensity = eventOptions.maxDensity;
        this.exactDepths = new DepthConverterFactory(this.options).create();
        this.levels = new DepthLevels(this.exactDepths, this.options);
        this.densityAtDepth = new DensityAtDepth(this.exactDepths);
        this.speeds = new AscentSpeeds(this.options);
        const segments = Segments.fromCollection(this.profile);
        this.speeds.markAverageDepth(segments);
        this.maxDepth = segments.maxDepth;
        this._mndBars = this.simpleDepths.toBar(this.options.maxEND);
    }

    public get previous(): Segment | null {
        if (this.index > 0) {
            return this.profile[this.index - 1];
        }

        return null;
    }

    public get isBeforeDecoAscent(): boolean {
        return this.index < this.startAscentIndex;
    }

    public get maxPpo(): number {
        if (this.isBeforeDecoAscent) {
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

    /** Tank is only assigned by user */
    public get switchingTank(): boolean {
        return !!this.previous && !!this.previous.tank && !!this.current.tank &&
            this.previous.tank !== this.current.tank;
    }

    /** Gets maximum narcotic depth in bars */
    public get maxMnd(): number {
        return this._mndBars;
    }

    public get currentEndTime(): number {
        return this.elapsed + this.current.duration;
    }

    public get atSafetyStop(): boolean {
        // safety stop is always the last hover segment before last ascent to surface
        if (this.index !== this.profile.length - 2) {
            return false;
        }

        const currentDepth = this.current.startDepth;
        return this.levels.addSafetyStop(currentDepth, this.maxDepth);
    }

    /** For depth in bars calculates the current equivalent narcotic depth in bars */
    public gasEnd(depth: number): number {
        const gas = this.current.gas;
        const oxygenNarcotic = this.options.oxygenNarcotic;
        return gas.end(depth, oxygenNarcotic);
    }

    public addElapsed(): void {
        this.elapsed = this.currentEndTime;
    }
}

export interface EventOptions {
    /** Maximum gas density in gram per liter. Defaults is 5.5 g/l */
    maxDensity: number;

    /**
     * startAscentIndex Number of segments from beginning to count as dive, later segments are considered as decompression ascent
     * E.g. In case of simple profile with 3 segments, only the last one is ascent, so this value is 2.
     */
    startAscentIndex: number;

    /** profile Complete list profile segments as user defined + calculated ascent */
    profile: Segment[];

    /** Ceilings for the associated profile */
    ceilings: Ceiling[];

    /** options User options used to create the profile */
    profileOptions: Options;
}

/** Creates events from profile generated by the algorithm */
export class ProfileEvents {
    /**
     * Generates events for calculated profile
     */
    public static fromProfile(eventOptions: EventOptions): Events {
        const context = new EventsContext(eventOptions);
        const ceilingContext = new CeilingContext(context.events, context.current);

        for (context.index = 0; context.index < eventOptions.profile.length; context.index++) {
            // nice to have calculate exact time and depth of the events, it is enough it happened
            const pressureSegment = this.toPressureSegment(context.current, context.simpleDepths);
            this.addHighPpO2(context, pressureSegment);
            this.addLowPpO2(context, pressureSegment);
            this.addGasSwitch(context);
            this.addUserTankSwitch(context);
            this.addHighDescentSpeed(context);
            this.addHighAscentSpeed(context);
            this.addSwitchHighN2(context);
            this.addMndExceeded(context, pressureSegment);
            this.addDensityExceeded(context);
            this.addSafetyStop(context);

            ceilingContext.assignSegment(context.current);
            ProfileEvents.addBrokenCeiling(ceilingContext, eventOptions.ceilings);

            context.addElapsed();
        }

        return context.events;
    }

    private static addHighAscentSpeed(context: EventsContext) {
        const current = context.current;
        // Prevent events generated by precise numbers, it is safe because segments are generated with higher precision
        // this doesn't happen for descent, because it is never automatically calculated
        let speed = Time.toSeconds(current.speed);
        speed = Precision.roundTwoDecimals(speed);

        // ascent speed is negative number
        if (-speed > context.speeds.ascent(current.startDepth)) {
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

    private static addUserTankSwitch(context: EventsContext): void {
        if (context.switchingTank) {
            const current = context.current;
            const event = EventsFactory.createGasSwitch(context.elapsed, current.startDepth, current.gas);
            context.events.add(event);
        }
    }

    private static toPressureSegment(segment: Segment, depthConverter: DepthConverter) {
        const startPressure = depthConverter.toBar(segment.startDepth);
        const endPressure = depthConverter.toBar(segment.endDepth);
        return new PressureSegment(startPressure, endPressure, segment.duration);
    }

    private static addHighPpO2(context: EventsContext, segment: PressureSegment): void {
        // non user defined gas switches are never to high ppO2 - see gases.bestGas
        // otherwise we don't know which ppO2 level to use
        if (segment.isDescent || (context.isBeforeDecoAscent && context.switchingGas)) {
            const gasMod = context.current.gas.mod(context.maxPpo);

            if (segment.maxDepth > gasMod) {
                let highDepth = segment.startDepth; // gas switch
                let timeStamp = context.elapsed;

                if (segment.startDepth < gasMod) { // ascent
                    highDepth = gasMod;
                    timeStamp += segment.timeAt(highDepth);
                }

                const depth = context.simpleDepths.fromBar(highDepth);
                const event = EventsFactory.createHighPpO2(timeStamp, depth);
                context.events.add(event);
            }
        }
    }

    private static addLowPpO2(context: EventsContext, segment: PressureSegment): void {
        const current = context.current;
        const gasCeiling = current.gas.ceiling(context.simpleDepths.surfacePressure);
        const shouldAdd = (segment.minDepth < gasCeiling && context.switchingGas) ||
            (segment.startDepth > gasCeiling && gasCeiling > segment.endDepth && segment.isAscent) ||
            // only at beginning of a dive
            (current.startDepth === 0 && segment.startDepth < gasCeiling && segment.isDescent);

        if (shouldAdd) {
            // start of dive or gas switch
            let lowDepth = segment.startDepth;
            let timeStamp = context.elapsed;

            if (segment.startDepth > gasCeiling) { // ascent
                lowDepth = gasCeiling;
                timeStamp += segment.timeAt(lowDepth);
            }

            const depth = context.simpleDepths.fromBar(lowDepth);
            const event = EventsFactory.createLowPpO2(timeStamp, depth);
            context.events.add(event);
        }
    }

    /** Check only user defined segments break ceiling, because we trust the algorithm never breaks ceiling */
    private static addBrokenCeiling(context: CeilingContext, ceilings: Ceiling[]): void {
        while (context.lastCeilingIndex < context.currentSegmentEndTime && context.lastCeilingIndex < ceilings.length - 1) {
            const ceiling = ceilings[context.lastCeilingIndex];
            context.lastCeilingIndex++;
            this.addNdlEnd(context, ceiling);

            const ceilingOk = context.belowCeiling(ceiling);
            if (!ceilingOk && context.fixedBrokenCeiling) {
                const event = EventsFactory.createBrokenCeiling(ceiling.time, ceiling.depth);
                context.events.add(event);
                context.fixedBrokenCeiling = false;
                break;
            }

            if (ceilingOk && !context.fixedBrokenCeiling) {
                context.fixedBrokenCeiling = true;
            }

            if (ceiling.time > context.currentSegmentEndTime) {
                break;
            }
        }
    }

    private static addNdlEnd(context: CeilingContext, ceiling: Ceiling): void {
        if (!context.ndlCeilingMarked && ceiling.depth > 0) {
            context.ndlCeilingMarked = true;
            const timeStamp = ceiling.time - context.currentSegmentStartTime;
            const depth = context.current.depthAt(timeStamp);
            const event = EventsFactory.createNoDecoEnd(ceiling.time, depth);
            context.events.add(event);
        }
    }

    private static addSwitchHighN2(context: EventsContext): void {
        const current = context.current;
        const previous = context.previous;

        if (context.switchingGas && previous) {
            const deltaN2 = current.gas.fN2 - previous.gas.fN2;
            const deltaHe = current.gas.fHe - previous.gas.fHe;

            if (previous.gas.fHe > 0 && deltaN2 * 5 > -deltaHe) {
                const event = EventsFactory.createSwitchToHigherN2(context.elapsed, current.startDepth, current.gas);
                context.events.add(event);
            }
        }
    }

    private static addMndExceeded(context: EventsContext, pressureSegment: PressureSegment): void {
        const current = context.current;
        // we need to check both start and end, because next segment may use another gas
        const startEnd = context.gasEnd(pressureSegment.startDepth);
        const endEnd = context.gasEnd(pressureSegment.endDepth);

        if (context.maxMnd < startEnd && context.fixedMnd ||
            context.maxMnd < endEnd && context.fixedMnd) {
            // gas switch already bellow maxMnd
            if(pressureSegment.startDepth > context.maxMnd) {
                this.addMndEvent(context, context.elapsed, current.startDepth);
            } else {
                const mndRange = { start: pressureSegment.startDepth, end: pressureSegment.endDepth };
                const timeRange = { start: context.elapsed, end: context.elapsed + current.duration };
                const timeStamp = LinearFunction.xValueAtAbsolute(timeRange, mndRange, context.maxMnd);
                const depth = current.depthAt(timeStamp - context.elapsed);
                this.addMndEvent(context, timeStamp, depth);
            }
        }

        // we can add the event multiple times, only after it is fixed
        context.fixedMnd = endEnd <= context.maxMnd;
    }

    private static addMndEvent(context: EventsContext, timeStamp: number, depth: number): void {
        const gas = context.current.gas;
        const event = EventsFactory.createMaxEndExceeded(timeStamp, depth, gas);
        context.events.add(event);
        context.fixedMnd = true;
    }

    private static addDensityExceeded(context: EventsContext): void {
        const current = context.current;
        const currentGas = current.gas;
        const startDepth = current.startDepth;
        const endDepth = current.endDepth;
        const isDescent = current.endDepth > current.startDepth;
        const switchToDifferentDensity = context.switchingGas;
        const startDensity = context.densityAtDepth.atDepth(currentGas, startDepth);
        const endDensity = context.densityAtDepth.atDepth(currentGas, endDepth);

        // first segment starts at surface, so there is never high density
        // skip, if event was already added at end of previous
        // add if there is a gas switch to different gas
        // ignore switch to the same gas
        // descent => density is higher at end
        if ((switchToDifferentDensity && startDensity > context.maxDensity) ||
            (isDescent && endDensity > context.maxDensity)) {
            // gas switch while ascending
            if(current.startDepth > current.endDepth) {
                const event = EventsFactory.createHighDensity(context.elapsed, current.startDepth, current.gas);
                context.events.add(event);
            } else {
                const densityRange = { start: startDensity, end: endDensity };
                const timeRange = { start: context.elapsed, end: context.elapsed + current.duration };
                const timeStamp = LinearFunction.xValueAtAbsolute(timeRange, densityRange, context.maxDensity);
                const depth = current.depthAt(timeStamp - context.elapsed);
                const event = EventsFactory.createHighDensity(timeStamp, depth, current.gas);
                context.events.add(event);
            }
        }
    }

    private static addSafetyStop(context: EventsContext): void {
        const current = context.current;
        if (context.atSafetyStop && current.duration >= Time.safetyStopDuration) {
            const timeStamp = context.elapsed + current.duration - Time.safetyStopDuration;
            const event = EventsFactory.createSafetyStopStart(timeStamp, current.endDepth);
            context.events.add(event);
        }
    }
}

class CeilingContext {
    public lastCeilingIndex = 0; // prevents search in past ceilings
    public currentSegmentStartTime = 0;
    public currentSegmentEndTime = 0;
    public fixedBrokenCeiling = true;
    public ndlCeilingMarked = false;
    private _current: Segment;

    constructor(public events: Events, current: Segment) {
        this._current = current;
    }

    public get current(): Segment {
        return this._current;
    }

    public assignSegment(newSegment: Segment): void {
        this.currentSegmentStartTime = this.currentSegmentEndTime;
        this.currentSegmentEndTime = this.currentSegmentStartTime + newSegment.duration;
        this._current = newSegment;
    }

    public belowCeiling(ceiling: Ceiling): boolean {
        const duration = ceiling.time - this.currentSegmentStartTime;
        const diverDepth = this._current.depthAt(duration);
        return diverDepth >= ceiling.depth;
    }
}
