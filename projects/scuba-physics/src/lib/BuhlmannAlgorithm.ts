import { Tissues, LoadSegment } from './Tissues';
import { Gases, Gas, BestGasOptions, GasesValidator } from './Gases';
import { Segments, Segment, SegmentsValidator } from './Segments';
import { DepthConverter, DepthConverterFactory } from './depth-converter';
import { Time } from './Time';
import { CalculatedProfile, Ceiling, Event } from './Profile';
import { GradientFactors, SubSurfaceGradientFactors } from './GradientFactors';
import { Options } from './Options';
import { AscentSpeeds } from './speeds';
import { DepthLevels } from './DepthLevels';
import { Precision } from './precision';

class AlgorithmContext {
    public tissues: Tissues;
    public ceilings: Ceiling[] = [];
    public currentGas: Gas;
    /** in seconds */
    public runTime = 0;
    private gradients: GradientFactors;
    private bestGasOptions: BestGasOptions;
    private speeds: AscentSpeeds;
    private levels: DepthLevels;

    // TODO reuse tissues for repetitive dives
    constructor(public gases: Gases, public segments: Segments, public options: Options, public depthConverter: DepthConverter) {
        this.tissues = new Tissues(depthConverter.surfacePressure);
        // this.gradients = new SimpleGradientFactors(depthConverter, options, this.tissues, this.segments);
        this.gradients = new SubSurfaceGradientFactors(depthConverter, options, this.tissues);
        const last = segments.last();
        this.currentGas = last.gas;

        this.bestGasOptions = {
            currentDepth: this.currentDepth,
            maxDecoPpO2: this.options.maxDecoPpO2,
            oxygenNarcotic: this.options.oxygenNarcotic,
            maxEndPressure: this.depthConverter.toBar(this.options.maxEND),
            currentGas: this.currentGas
        };

        this.speeds = new AscentSpeeds(this.options);
        this.levels = new DepthLevels(depthConverter, options);
    }

    public get ascentSpeed(): number {
        return this.speeds.ascent(this.currentDepth);
    }

    public get currentDepth(): number {
        return this.segments.currentDepth;
    }

    public get ambientPressure(): number {
        return this.depthConverter.toBar(this.currentDepth);
    }

    public get addSafetyStop(): boolean {
        return this.levels.addSafetyStop(this.currentDepth, this.segments.maxDepth);
    }

    public get decoStopDuration(): number {
        return this.options.roundStopsToMinutes ? Time.oneMinute : Time.oneSecond;
    }

    // use this just before calculating ascent to be able calculate correct speeds
    public markAverageDepth(): void {
        this.speeds.markAverageDepth(this.segments);
    }

    public addCeiling() {
        const depth = this.ceiling();
        const newCeiling = new Ceiling(this.runTime, depth);
        this.ceilings.push(newCeiling);
    }

    public ceiling(): number {
        return this.gradients.ceiling();
    }

    public bestDecoGas(): Gas {
        this.bestGasOptions.currentDepth = this.currentDepth;
        this.bestGasOptions.currentGas = this.currentGas;
        const newGas = this.gases.bestGas(this.levels, this.depthConverter, this.bestGasOptions);
        return newGas;
    }

    public nextStop(currentStop: number): number {
        return this.levels.nextStop(currentStop);
    }
}

export class BuhlmannAlgorithm {
    /**
     * Calculates no decompression limit in minutes.
     * Returns positive number or Infinity, in case there is no more tissues loading.
     * Usually at small depths (bellow 10 meters).
     * @param depth depth below surface in meters
     * @param gas gas to use as the only one during the plan
     * @param options conservatism options to be used
     */
    public noDecoLimit(depth: number, gas: Gas, options: Options): number {
        const gases = new Gases();
        gases.add(gas);

        const segments = new Segments();
        const duration = this.duration(depth, options.descentSpeed);
        segments.add(0, depth, gas, duration);

        return this.noDecoLimitMultiLevel(segments, gases, options);
    }

    /**
     * Calculates no decompression limit in minutes.
     * Returns positive number or Infinity, in case there is no more tissues loading.
     * Usually at small depths (bellow 10 meters).
     * @param segments Already realized part of the dive
     * @param options conservatism options to be used
     */
    public noDecoLimitMultiLevel(segments: Segments, gases: Gases, options: Options): number {
        const depthConverter = new DepthConverterFactory(options).create();
        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        return this.swimNoDecoLimit(segments, gases, context, options);
    }

    public calculateDecompression(options: Options, gases: Gases, originSegments: Segments): CalculatedProfile {
        const depthConverter = new DepthConverterFactory(options).create();
        const segments = originSegments.copy();
        const errors = this.validate(segments, gases, options, depthConverter);
        if (errors.length > 0) {
            const origProfile = segments.mergeFlat(originSegments.length);
            return CalculatedProfile.fromErrors(origProfile, errors);
        }

        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        this.swimPlan(context);
        context.markAverageDepth();
        let nextStop = context.nextStop(context.currentDepth);

        // for performance reasons we don't want to iterate each second, instead we iterate by 3m steps where the changes happen.
        while (nextStop >= 0 && segments.last().endDepth !== 0) {
            // 1. Gas switch
            // multiple gas switches may happen before first deco stop
            this.tryGasSwitch(context);

            // 2. Deco stop
            // TODO we may still ongasing during ascent to next stop
            // TODO performance, we need to try faster algorithm, how to find the stop length
            // TODO add air breaks - https://www.diverite.com/uncategorized/oxygen-toxicity-and-ccr-rebreather-diving/
            let stopElapsed = 0; // max stop duration was chosen as one day.
            while (nextStop < context.ceiling() && stopElapsed < Time.oneDay) {
                const stopDuration = context.decoStopDuration;
                const decoStop = context.segments.add(context.currentDepth, context.currentDepth, context.currentGas, stopDuration);
                this.swim(context, decoStop);
                stopElapsed += stopDuration;
            }

            // 3. safety stop
            if (context.addSafetyStop) {
                const safetyStopDuration = Time.oneMinute * 3;
                const decoStop = context.segments.add(context.currentDepth, context.currentDepth, context.currentGas, safetyStopDuration);
                this.swim(context, decoStop);
            }

            // 4. ascent to the nextStop
            const depthDifference = context.currentDepth - nextStop;
            const duration = this.duration(depthDifference, context.ascentSpeed);
            const ascent = context.segments.add(context.currentDepth, nextStop, context.currentGas, duration);
            this.swim(context, ascent);
            nextStop = context.nextStop(nextStop);
        }

        const merged = segments.mergeFlat(originSegments.length);
        return CalculatedProfile.fromProfile(merged, context.ceilings);
    }

    private validate(segments: Segments, gases: Gases, options: Options, depthConverter: DepthConverter): Event[] {
        const segmentErrors = SegmentsValidator.validate(segments, gases);
        if (segmentErrors.length > 0) {
            return segmentErrors;
        }

        const gasMessages = GasesValidator.validate(gases, options, depthConverter.surfacePressure);
        if (gasMessages.length > 0) {
            return gasMessages;
        }

        return [];
    }

    private tryGasSwitch(context: AlgorithmContext) {
        const newGas: Gas = context.bestDecoGas();

        if (!newGas || context.currentGas.compositionEquals(newGas)) {
            return;
        }

        context.currentGas = newGas;
        const duration = context.options.gasSwitchDuration * Time.oneMinute;
        const stop = context.segments.add(context.currentDepth, context.currentDepth, context.currentGas, duration);
        this.swim(context, stop);
    }

    // Speed in meters / min.
    private duration(depthDifference: number, speed: number): number {
        const meterPerSec = Time.toMinutes(speed);
        return depthDifference / meterPerSec;
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
            const endDepth = Segment.depthAt(startDepth, segment.speed, interval);
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
     * Simply continue from currently planned segments, expecting diver stays in the same depth breathing the same gas.
     */
    private swimNoDecoLimit(segments: Segments, gases: Gases, context: AlgorithmContext, options: Options): number {
        const errorMessages = this.validate(segments, gases, options, context.depthConverter);
        if (errorMessages.length > 0) {
            return 0;
        }

        this.swimPlan(context);
        // We may already passed the Ndl during descent or user defined profile
        const currentNdl = this.currentNdl(context.ceilings);
        if (currentNdl !== Number.POSITIVE_INFINITY) {
            return currentNdl;
        }

        return this.predictNoDecoLimit(segments, context);
    }

    private predictNoDecoLimit(segments: Segments, context: AlgorithmContext): number {
        const last = segments.last();
        const depth = last.endDepth;
        const hover = new Segment(depth, depth, last.gas, Time.oneMinute);
        const hoverLoad = this.toLoadSegment(context.depthConverter, hover);
        let change = 1;

        while (context.ceiling() <= 0 && change > 0) {
            change = context.tissues.load(hoverLoad, last.gas);
            context.runTime += Time.oneMinute;
        }

        if (change === 0 || depth === 0) {
            return Number.POSITIVE_INFINITY;
        }

        const result = this.floorNdl(context.runTime);
        return result;
    }

    private floorNdl(ndlSeconds: number): number {
        let result = Time.toMinutes(ndlSeconds);
        result = Precision.floor(result);
        // We went one minute past a ceiling of "0"
        return result - 1;
    }

    /** Fastest way to get Ndl from current Decompression profile.
     * Returns infinity, if the profile isn't decompression. */
    private currentNdl(ceilings: Ceiling[]): number {
        for (let index = 0; index < ceilings.length; index += Time.oneMinute) {
            const ceiling = ceilings[index];
            if (ceiling.notAtSurface) {
                const minutes = this.floorNdl(ceiling.time);
                return minutes;
            }
        }

        return Number.POSITIVE_INFINITY;
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
