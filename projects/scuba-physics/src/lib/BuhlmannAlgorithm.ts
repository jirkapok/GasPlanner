import { Tissues, LoadSegment } from './Tissues';
import { Gases, Gas, GasOptions, GasesValidator } from './Gases';
import { Segments, Segment, SegmentsValidator } from './Segments';
import { DepthConverter } from './depth-converter';
import { Time } from './Time';

export class Options implements GasOptions {
    constructor(
        // Gradient factors in Shaerwater Teric
        // Low (45/95)
        // Med (40/85)
        // High (35/75)

        /**
         * Low gradient factor  in range 0-1 (e.g 0-100%), default 0.4
         */
        public gfLow: number,

        /**
         * Hight gradient factor in range 0-1 (e.g 0-100%), default 0.85
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
         * If true, adds 3 minutes to last stop in 3 meters
         */
        public addSafetyStop?: boolean,

        /**
         * Usual Ascent speed used by the diver in metres/minute, default 10 meters/minute.
         */
        public ascentSpeed?: number,

        /**
         * Usual descent speed used by the diver in metres/minute, default 20 meters/minute.
         */
        public descentSpeed?: number,

        /**
         * meters above see level, 0 for see level (default)
         */
        public altitude?: number,
    ) {
        this.gfLow = gfLow || 0.4;
        this.gfHigh = gfHigh || 0.85;
        this.maxppO2 = maxppO2 || 1.6;
        this.maxEND = maxEND || 30;
        this.isFreshWater = isFreshWater || false;
        this.addSafetyStop = addSafetyStop || false;
        this.ascentSpeed = ascentSpeed || 10;
        this.descentSpeed = descentSpeed || 20;
        this.altitude = altitude || 0;
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
    public tissues: Tissues;
    public ceilings: Ceiling[] = [];
    /** in seconds */
    public runTime = 0;
    private lowestCeiling = 0;

    // TODO reuse tissues for repetitive dives
    constructor(public gases: Gases, public segments: Segments, public options: Options, public depthConverter: DepthConverter) {
        this.tissues = new Tissues(depthConverter.surfacePressure);
    }

    public get currentDepth(): number {
        if (this.segments.any()) {
            return this.segments.last().endDepth;
        }

        return 0;
    }

    public addCeiling() {
        const depth = this.ceiling();
        this.ceilings.push({
            time: this.runTime,
            depth: depth
        });
    }

    private tolerated(): number {
        const gfLow = this.options.gfLow;
        const gfHigh = this.options.gfHigh;
        const surface = this.depthConverter.surfacePressure;
        const currentLowestCeiling = this.tissues.ceiling(gfLow);

        if (currentLowestCeiling > this.lowestCeiling) {
            this.lowestCeiling = currentLowestCeiling;
        }

        const tolerated = this.tissues.tolerated(surface, this.lowestCeiling, gfHigh, gfLow);
        return tolerated;
    }

    public ceiling(): number {
        let bars = this.tolerated();

        // less than surface pressure means no ceiling, this aproximation is OK,
        // because tissues are loaded only under water
        if (bars < this.depthConverter.surfacePressure) {
            bars = this.depthConverter.surfacePressure;
        }

        return this.depthConverter.fromBar(bars);
    }
}

export class BuhlmannAlgorithm {
    /**
     * Depth difference between two deco stops in metres.
     */
    private static readonly decoStopDistance = 3;

    public calculateDecompression(options: Options, gases: Gases, segments: Segments): CalculatedProfile {
        const depthConverter = this.selectDepthConverter(options.isFreshWater, options.altitude);
        const errorMessages = this.validate(segments, gases, options, depthConverter);
        if (errorMessages.length > 0) {
            return CalculatedProfile.fromErrors(errorMessages);
        }

        const last = segments.last();
        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        this.descent(context);

        const firstDecoStop = this.firstDecoStop(context);
        let nextDecoStop = firstDecoStop;
        let nextGasSwitch = context.gases.nextGasSwitch(last.gas, context.currentDepth, 0, options, context.depthConverter);
        let nextStop = this.nextStop(firstDecoStop, nextGasSwitch, nextDecoStop);
        let currentGas = last.gas;

        while (nextStop >= 0) {
            // ascent to the nextStop
            // TODO we may still ongasing during ascent to next stop
            const depthDifference = context.currentDepth - nextStop;
            const duration = this.duration(depthDifference, options.ascentSpeed / Time.oneMinute);
            const ascent = context.segments.add(context.currentDepth, nextStop, currentGas, duration);
            this.swim(context, ascent);

            if (context.currentDepth <= 0) {
                break;
            }

            // Deco stop
            currentGas = context.gases.bestDecoGas(context.currentDepth, options, depthConverter);
            nextDecoStop = this.nextDecoStop(nextStop);

            while (nextDecoStop < context.ceiling()) {
                const decoStop = context.segments.add(context.currentDepth, nextStop, currentGas, Time.oneMinute);
                this.swim(context, decoStop);
            }

            if (options.addSafetyStop && context.currentDepth === BuhlmannAlgorithm.decoStopDistance) {
                const safetyStopDuration = Time.oneMinute * 3;
                const decoStop = context.segments.add(context.currentDepth, nextStop, currentGas, safetyStopDuration);
                this.swim(context, decoStop);
            }

            // multiple gas switches may happen before first deco stop
            nextGasSwitch = context.gases.nextGasSwitch(currentGas, context.currentDepth, 0, options, context.depthConverter);
            nextStop = this.nextStop(firstDecoStop, nextGasSwitch, nextDecoStop);
        }

        const merged = segments.mergeFlat();
        return CalculatedProfile.fromProfile(merged, context.ceilings);
    }

    private validate(segments: Segments, gases: Gases, options: Options, depthConverter: DepthConverter): string[] {
        const segmentMessages = SegmentsValidator.validate(segments, gases, options.maxppO2, depthConverter);
        if (segmentMessages.length > 0) {
            return segmentMessages;
        }

        const last = segments.last();

        // TODO fix max depth: last doesn't have to be max. depth in multilevel diving.
        const gasMessages = GasesValidator.validate(gases, options, depthConverter, last.endDepth);
        if (gasMessages.length > 0) {
            return gasMessages;
        }

        return [];
    }

    private duration(depthDifference: number, speed: number): number {
        return depthDifference / speed;
    }

    private nextStop(firstDecoStop: number, nextGasSwitch: number, nextDecoStop: number): number {
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

        if (context.options.addSafetyStop && rounded <= BuhlmannAlgorithm.decoStopDistance &&
            context.currentDepth > BuhlmannAlgorithm.decoStopDistance) {
            return BuhlmannAlgorithm.decoStopDistance;
        }

        return rounded;
    }

    private selectDepthConverter(isFreshWater: boolean, altitude: number): DepthConverter {
        if (isFreshWater) {
          return DepthConverter.forFreshWater(altitude);
        }

        return DepthConverter.forSaltWater(altitude);
    }

    private descent(context: AlgorithmContext): void {
        // initial ceiling doesn't have to be 0m, because of previous tissues loading.
        context.addCeiling();

        context.segments.withAll(segment => {
            this.swim(context, segment);
        });
    }

    private swim(context: AlgorithmContext, segment: Segment) {
        let startDepth = segment.startDepth;
        const interval = Time.oneSecond;

        for (let elapsed = 0; elapsed < segment.duration; elapsed += interval) {
            const endDepth = startDepth + interval * segment.speed;
            const part = new Segment(startDepth, endDepth, segment.gas, interval);
            this.swimPart(context, part);
            startDepth = part.endDepth;
        }
    }

    private swimPart(context: AlgorithmContext, segment: Segment) {
        const loadSegment = this.toLoadSegment(context.depthConverter, segment);
        context.tissues.load(loadSegment, segment.gas);
        context.runTime += segment.duration;
        context.addCeiling();
    }

    public noDecoLimit(depth: number, gas: Gas, options: Options): number {
        const depthConverter = this.selectDepthConverter(options.isFreshWater, options.altitude);
        const gases = new Gases();
        gases.addBottomGas(gas);

        const segments = new Segments();
        const duration = this.duration(depth, options.descentSpeed / Time.oneMinute);
        const descent = segments.add(0, depth, gas, duration);

        const errorMessages = this.validate(segments, gases, options, depthConverter);
        if (errorMessages.length > 0) {
            return 0;
        }

        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        this.swim(context, descent);
        const hover = new Segment(depth, depth, gas, Time.oneMinute);
        const hoverLoad = this.toLoadSegment(context.depthConverter, hover);
        let change = 1;

        while (context.ceiling() <= 0 && change > 0) {
            change = context.tissues.load(hoverLoad, gas);
            context.runTime += Time.oneMinute;
        }

        if (change === 0 || depth === 0) {
            return Number.POSITIVE_INFINITY;
        }

         // We went one minute past a ceiling of "0"
        return (context.runTime - Time.oneMinute) / Time.oneMinute;
    }

    private toLoadSegment(depthConverter: DepthConverter, segment: Segment): LoadSegment {
        // because surface pressure was added during the conversion
        const speed = depthConverter.toBar(segment.speed) - depthConverter.surfacePressure;

        return {
            startPressure: depthConverter.toBar(segment.startDepth),
            duration: segment.duration,
            speed: speed
        };
    }
}
