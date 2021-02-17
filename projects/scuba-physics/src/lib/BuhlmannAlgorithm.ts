import { Tissues, LoadSegment } from './Tissues';
import { Gases, Gas, GasOptions, GasesValidator } from './Gases';
import { Segments, Segment, SegmentsValidator } from './Segments';
import { DepthConverter, DepthConverterFactory, DepthOptions } from './depth-converter';
import { Time } from './Time';
import { CalculatedProfile, Ceiling, Event, EventType } from './Profile';

export class Options implements GasOptions, DepthOptions {
    /**
     * meters above see level, 0 for see level (default)
     */
    public altitude: number

    constructor(
        // Gradient factors in Shearwater
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
         * Maximum pp02 to be used during the dive in range 0.21-1.6, default 1.4
         */
        public maxPpO2: number,

        /**
         * Maximum pp02 to be used during decompression in range 0.21-1.6, default 1.6
         */
        public maxDecoPpO2: number,

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
        altitude?: number
    ) {
        this.gfLow = gfLow || 0.4;
        this.gfHigh = gfHigh || 0.85;
        this.maxPpO2 = maxPpO2 || 1.4;
        this.maxDecoPpO2 = maxDecoPpO2 || 1.6;
        this.maxEND = maxEND || 30;
        this.isFreshWater = isFreshWater || false;
        this.addSafetyStop = addSafetyStop || false;
        this.ascentSpeed = ascentSpeed || 10;
        this.descentSpeed = descentSpeed || 20;
        this.altitude = altitude || 0;
    }
}

class DepthLevels {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;

    public static firstDecoStop(context: AlgorithmContext): number {
        const ceiling = context.ceiling();
        const rounded = Math.ceil(ceiling / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;

        if (context.options.addSafetyStop && rounded <= DepthLevels.decoStopDistance &&
            context.currentDepth > DepthLevels.decoStopDistance) {
            return DepthLevels.decoStopDistance;
        }

        return rounded;
    }

    public static nextStop(nextGasSwitch: number, nextDecoStop: number): number {
        return Math.max(nextDecoStop, nextGasSwitch);
    }
    
    public static nextDecoStop(lastStop: number): number {
        const candidate = lastStop - DepthLevels.decoStopDistance;
        return candidate >= 0 ? candidate : 0;
    }

    public static gasSwitch(gasMod: number): number {
        const rounded = Math.floor(gasMod / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;
        return rounded;
    }
}

class AlgorithmContext {
    public tissues: Tissues;
    public ceilings: Ceiling[] = [];
    public events: Event[] = [];
    public currentGas: Gas;

    /** in seconds */
    public runTime = 0;
    private lowestCeiling = 0;

    // TODO reuse tissues for repetitive dives
    constructor(public gases: Gases, public segments: Segments, public options: Options, public depthConverter: DepthConverter) {
        this.tissues = new Tissues(depthConverter.surfacePressure);
        // add 1 to compensate gradient low on start of the dive
        this.lowestCeiling = this.depthConverter.surfacePressure + 1;

        const last = segments.last();
        this.currentGas = last.gas;
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

    public nextGasSwitch(currentGas: Gas): number {
        const nextGasSwitch = this.gases.nextGasSwitch(currentGas, this.currentDepth, this.options, this.depthConverter);
        return DepthLevels.gasSwitch(nextGasSwitch);
    }
}

export class BuhlmannAlgorithm {
    public calculateDecompression(options: Options, gases: Gases, segments: Segments): CalculatedProfile {
        const depthConverter = new DepthConverterFactory(options).create();
        const errorMessages = this.validate(segments, gases, options, depthConverter);
        if (errorMessages.length > 0) {
            return CalculatedProfile.fromErrors(errorMessages);
        }

        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        this.swimPlan(context);

        let nextDecoStop = DepthLevels.firstDecoStop(context);
        let nextGasSwitch = context.nextGasSwitch(context.currentGas);
        let nextStop = DepthLevels.nextStop(nextDecoStop, nextGasSwitch);

        while (nextStop >= 0) {
            // ascent to the nextStop
            // TODO we may still ongasing during ascent to next stop
            const depthDifference = context.currentDepth - nextStop;
            const duration = this.duration(depthDifference, options.ascentSpeed / Time.oneMinute);
            const ascent = context.segments.add(context.currentDepth, nextStop, context.currentGas, duration);
            this.swim(context, ascent);

            if (context.currentDepth <= 0) {
                break;
            }

            // TODO check, if ascent to next stop isn't already possible

            // Deco stop
            const lastGas = context.currentGas;
            context.currentGas = context.gases.bestDecoGas(context.currentDepth, options, depthConverter);
            this.addGasSwitch(context, lastGas, context.currentGas);

            nextDecoStop = DepthLevels.nextDecoStop(nextStop);

            while (nextDecoStop < context.ceiling()) {
                const decoStop = context.segments.add(context.currentDepth, nextStop, context.currentGas, Time.oneMinute);
                this.swim(context, decoStop);
            }

            if (options.addSafetyStop && context.currentDepth === DepthLevels.decoStopDistance) {
                const safetyStopDuration = Time.oneMinute * 3;
                const decoStop = context.segments.add(context.currentDepth, nextStop, context.currentGas, safetyStopDuration);
                this.swim(context, decoStop);
            }

            // multiple gas switches may happen before first deco stop
            nextGasSwitch = context.nextGasSwitch(context.currentGas);
            nextStop = DepthLevels.nextStop(nextGasSwitch, nextDecoStop);
        }

        const merged = segments.mergeFlat();
        return CalculatedProfile.fromProfile(merged, context.ceilings, context.events);
    }

    private addGasSwitch(context: AlgorithmContext, lastGas: Gas, currentGas: Gas) {
        if (lastGas.compositionEquals(currentGas)) {
            return;
        }

        const gasSwitch: Event =  {
            timeStamp: context.runTime,
            depth: context.currentDepth,
            type: EventType.gasSwitch,
            message: 'switch to ' + currentGas.fO2
        };

        context.events.push(gasSwitch);
        const decoStop = context.segments.add(context.currentDepth, context.currentDepth, currentGas, Time.oneMinute);
        this.swim(context, decoStop);
    }

    private validate(segments: Segments, gases: Gases, options: Options, depthConverter: DepthConverter): string[] {
        const segmentMessages = SegmentsValidator.validate(segments, gases, options.maxPpO2, depthConverter);
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

    private swimPlan(context: AlgorithmContext): void {
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

    /**
     * Calculates no decompression limit in minutes
     * @param depth depth below surface in meters
     * @param gas gas to use as the only one during the plan
     * @param options conservatism options to be used
     */
    public noDecoLimit(depth: number, gas: Gas, options: Options): number {
        const depthConverter = new DepthConverterFactory(options).create();
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
        let result = Time.toMinutes(context.runTime);
        result = Math.floor(result); 
        return result - 1;
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
