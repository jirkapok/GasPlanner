import { Tissues } from './Tissues';
import { Gases, Gas, GasOptions, GasesValidator } from './Gases';
import { Segments, Segment, SegmentsValidator } from './Segments';
import { DepthConverter } from './depth-converter';

export class Options implements GasOptions {
    private _ascentSpeed: number;

    public get ascentSpeed(): number {
        return this._ascentSpeed;
    }
    constructor(
        /**
         * Low gradient factor  in range 0-1 (e.g 0-100%), default 1
         */
        public gfLow: number,

        /**
         * Hight gradient factor in range 0-1 (e.g 0-100%), default 1
         */
        public gfHigh: number,

        /**
         * Maximum pp02 to be used during decompression in rnage 0.21-1.6, default 1.6
         */
        public maxppO2: number,

        /**
         * Maximum equivalent air narcotic depth in meters, default 30 meters
         */
        public maxEND: number,

        /**
         * Select water salinity, default false (salt water)
         */
        public isFreshWater: boolean,

        /**
         * Usual Ascent speed used by the diver in metres/minute, default 10 meters/minute.
         */
        ascentSpeed?: number
    ) {
        gfLow = gfLow || 1.0;
        gfHigh = gfHigh || 1.0;
        maxppO2 = maxppO2 || 1.6;
        maxEND = maxEND || 30;
        isFreshWater = isFreshWater || false;
        this._ascentSpeed = ascentSpeed || 10;
    }
}

/**
 * Dive definition point in moment during the dive.
 */
export class Ceiling {
    /**
     * Gets or sets moment in minutes during the dive
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

    private constructor(private seg: Segment[], private ceil: Ceiling[], private errors: string[]) { }

    public static fromErrors(errors: string[]) {
        return new CalculatedProfile([], [], errors);
    }

    public static fromProfile(segments: Segment[], ceilings: Ceiling[]) {
        return new CalculatedProfile(segments, ceilings, []);
    }
}


class AlgorithmContext {
    private gfDiff: number;
    public tissues = new Tissues();
    public ceilings: Ceiling[] = [];
    public runTime = 0;

    // TODO reuse tissues for repetitive dives
    constructor(public gases: Gases, public segments: Segments, public options: Options,
                public depthConverter: DepthConverter, private firstCelingDepth:  number) {
        this.gfDiff = options.gfHigh - options.gfLow;
    }

    public get currentDepth(): number {
        if(this.segments.any()) {
            return this.segments.last().endDepth;
        }

        return 0;
    }

    public addCeiling(depth: number) {
        this.ceilings.push({
            time: this.runTime,
            depth: depth
        });
    }

    public ceiling(): number {
        return this.ceilingForDepth(this.currentDepth);
    }

    public gradientForDepth(depth: number): number {
        return this.options.gfHigh - this.gfDiff * depth / this.firstCelingDepth;
    }

    public ceilingForDepth(depth: number): number {
        const gf = this.gradientForDepth(depth);
        return this.tissues.ceiling(gf, this.depthConverter);
    }
}

export class BuhlmannAlgorithm {
    /**
     * Depth difference between two deco stops in metres.
     */
    private static readonly decoStopDistance = 3;
    private oneMinute = 1;

    public calculateDecompression(options: Options, gases: Gases, segments: Segments): CalculatedProfile {
        const depthConverter = this.selectDepthConverter(options.isFreshWater);
        const segmentMessages = SegmentsValidator.validate(segments, gases, options.maxppO2, depthConverter);
        if (segmentMessages.length > 0) {
            return CalculatedProfile.fromErrors(segmentMessages);
        }

        const last = segments.last();

        // TODO fix max depth: last doesn't have to be max. depth in multilevel diving.
        const gasMessages = GasesValidator.validate(gases, options, depthConverter, last.endDepth);
        if (gasMessages.length > 0) {
            return CalculatedProfile.fromErrors(gasMessages);
        }

        const context = new AlgorithmContext(gases, segments, options, depthConverter, last.endDepth);
        this.dive(context);

        const firstDecoStop = this.firstDecoStop(context);
        let nextDecoStop = firstDecoStop;
        let nextGasSwitch = context.gases.nextGasSwitch(last.gas, context.currentDepth, 0, options, context.depthConverter);
        let nextStop = this.nextStop(firstDecoStop, nextGasSwitch, nextDecoStop);
        let currentGas = last.gas;

        while (nextStop >= 0) {
            // ascent to the nextStop
            const duration = (context.currentDepth - nextStop) / options.ascentSpeed;
            const ascent = context.segments.add(context.currentDepth, nextStop, currentGas, duration);
            this.swim(context, ascent);

            if (context.currentDepth <= 0) {
                break;
            }

            // Deco stop
            currentGas = context.gases.bestDecoGas(context.currentDepth, options, depthConverter);
            nextDecoStop = this.nextDecoStop(nextStop);

            while (nextDecoStop < context.ceiling()) {
                const decoStop = context.segments.add(context.currentDepth, nextStop, currentGas, this.oneMinute);
                this.swim(context, decoStop);
            }

            // multiple gas switches may happen before first deco stop
            nextGasSwitch = context.gases.nextGasSwitch(currentGas, context.currentDepth, 0, options, context.depthConverter);
            nextStop = this.nextStop(firstDecoStop, nextGasSwitch, nextDecoStop);
        }

        const merged = segments.mergeFlat();
        return CalculatedProfile.fromProfile(merged, context.ceilings);
    }

    private nextStop(firstDecoStop: number, nextGasSwitch: number, nextDecoStop: number) {
        return firstDecoStop > nextGasSwitch ? nextDecoStop : nextGasSwitch;
    }

    private nextDecoStop(lastStop: number): number {
        return lastStop - BuhlmannAlgorithm.decoStopDistance;
    }

    private firstDecoStop(context: AlgorithmContext): number {
        const ceiling = context.ceiling();
        const rounded = Math.round(ceiling / BuhlmannAlgorithm.decoStopDistance) * BuhlmannAlgorithm.decoStopDistance;

        const needsAdd = !!(ceiling % BuhlmannAlgorithm.decoStopDistance);
        if (needsAdd) {
            return rounded + BuhlmannAlgorithm.decoStopDistance;
        }

        return rounded;
    }

    private selectDepthConverter(isFreshWater: boolean): DepthConverter {
        if (isFreshWater) {
          return DepthConverter.forFreshWater();
        }

        return DepthConverter.forSaltWater();
    }

    private dive(context: AlgorithmContext): void {
        // initial ceiling doesn't have to be 0m, because of previous tissues loading.
        const ceiling =  context.ceiling();
        context.addCeiling(ceiling);

        context.segments.withAll(segment => {
            this.swim(context, segment);
        });
    }

    private swim(context: AlgorithmContext, segment: Segment){
        let startDepth = segment.startDepth;

        for (let elapsed = 0; elapsed < segment.duration; elapsed++) {
            const interval = this.calculateInterval(segment.duration, elapsed);
            const endDepth = startDepth + interval * segment.speed;
            const part = new Segment(startDepth, endDepth, segment.gas, interval);
            this.swimPart(context, part);
            startDepth = part.endDepth;
        }
    }

    private swimPart(context: AlgorithmContext, segment: Segment) {
        context.tissues.load(segment, segment.gas, context.depthConverter);
        context.runTime += segment.duration;
        const ceiling = context.ceilingForDepth(segment.endDepth);
        context.addCeiling(ceiling);
    }

    private calculateInterval(duration: number, elapsed: number): number {
        const remaining = duration - elapsed;

        if (remaining >= this.oneMinute) {
            return this.oneMinute;
        }

        return remaining % this.oneMinute;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        const options = new Options(gf, gf, 1.6, 30, isFreshWater, 10);
        const depthConverter = this.selectDepthConverter(isFreshWater);
        const gases = new Gases();
        gases.addBottomGas(gas);

        const segments = new Segments();
        const descentSpeed = 20;
        const descent = segments.enterWater(gas, descentSpeed, depth);

        const context = new AlgorithmContext(gases, segments, options, depthConverter, depth);
        this.swim(context, descent);
        const hover = new Segment(depth, depth, gas, this.oneMinute);
        let change = 1;

        while (context.ceiling() <= 0 && change > 0) {
            change = context.tissues.load(hover, gas, context.depthConverter);
            context.runTime += this.oneMinute;
        }

        if (change === 0) {
            return Number.POSITIVE_INFINITY;
        }
        return context.runTime - 1; // We went one minute past a ceiling of "0"
    }
}
