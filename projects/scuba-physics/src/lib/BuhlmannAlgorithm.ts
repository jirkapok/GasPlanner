import { Tissues, LoadSegment, Tissue } from './Tissues';
import { Gases, Gas, BestGasOptions, GasesValidator, OCGasSource } from './Gases';
import { Segments, Segment, SegmentsValidator } from './Segments';
import { DepthConverter, DepthConverterFactory } from './depth-converter';
import { Time } from './Time';
import { CalculatedProfile, Ceiling, Event } from './Profile';
import { GradientFactors, SubSurfaceGradientFactors } from './GradientFactors';
import { Options } from './Options';
import { AscentSpeeds } from './speeds';
import { DepthLevels } from './DepthLevels';
import { Precision } from './precision';
import { BinaryIntervalSearch, SearchContext } from './BinaryIntervalSearch';

interface ContextMemento {
    tissues: Tissue[];
    ceilings: number;
    segments: number;
    runTime: number;
    lowestCeiling: number;
}

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
    private gasSource: OCGasSource;

    constructor(public gases: Gases, public segments: Segments, public options: Options, public depthConverter: DepthConverter) {
        // TODO reuse tissues for repetitive dives
        this.tissues = Tissues.createFromSurfacePressure(depthConverter.surfacePressure);
        // this.gradients = new SimpleGradientFactors(depthConverter, options, this.tissues, this.segments);
        this.gradients = new SubSurfaceGradientFactors(depthConverter, options, this.tissues);
        const last = segments.last();
        this.currentGas = last.gas;

        this.bestGasOptions = {
            currentDepth: this.currentDepth,
            maxDecoPpO2: this.options.maxDecoPpO2,
            oxygenNarcotic: this.options.oxygenNarcotic,
            maxEnd: this.options.maxEND,
            currentGas: this.currentGas
        };

        this.speeds = new AscentSpeeds(this.options);
        this.levels = new DepthLevels(depthConverter, options);
        this.gasSource = new OCGasSource(gases, options);
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

    public get isAtSurface(): boolean {
        return this.segments.last().endDepth === 0;
    }

    /** use this just before calculating ascent to be able calculate correct speeds */
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
        const newGas = this.gasSource.bestGas(this.bestGasOptions);
        return newGas;
    }

    public createMemento(): ContextMemento {
        return {
            runTime: this.runTime,
            tissues: Tissues.copy(this.tissues.compartments),
            ceilings: this.ceilings.length,
            segments: this.segments.length,
            lowestCeiling: this.gradients.lowestCeiling
        };
    }

    public restore(memento: ContextMemento): void {
        // here we don't copy, since we expect it wasn't touched
        this.tissues.compartments = Tissues.copy(memento.tissues);
        this.gradients.lowestCeiling = memento.lowestCeiling;
        this.runTime = memento.runTime;
        // ceilings and segments are only added
        this.ceilings = this.ceilings.slice(0, memento.ceilings);
        const toCut = this.segments.length - memento.segments;
        this.segments.cutDown(toCut);
    }

    public nextStop(currentStop: number): number {
        return this.levels.nextStop(currentStop);
    }

    public shouldSwitchTo(newGas: Gas): boolean {
        return newGas && !this.currentGas.compositionEquals(newGas);
    }

    public addGasSwitchSegment(): Segment {
        const duration = this.options.gasSwitchDuration * Time.oneMinute;
        return this.addStopSegment(duration);
    }

    public addDecoStopSegment(): Segment {
        return this.addStopSegment(0);
    }

    public addSafetyStopSegment(): Segment {
        const duration = Time.safetyStopDuration;
        return this.addStopSegment(duration);
    }

    public addAscentSegment(nextStop: number, duration: number): Segment {
        return this.segments.add(this.currentDepth, nextStop, this.currentGas, duration);
    }

    private addStopSegment(duration: number): Segment {
        return this.segments.add(this.currentDepth, this.currentDepth, this.currentGas, duration);
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
        return this.swimNoDecoLimit(segments, gases, context);
    }

    public calculateDecompression(options: Options, gases: Gases, originSegments: Segments): CalculatedProfile {
        const depthConverter = new DepthConverterFactory(options).create();
        const segments = originSegments.copy();
        const errors = this.validate(segments, gases);
        if (errors.length > 0) {
            const origProfile = segments.mergeFlat(originSegments.length);
            return CalculatedProfile.fromErrors(origProfile, errors);
        }

        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        this.swimPlan(context);
        context.markAverageDepth();
        let nextStop = context.nextStop(context.currentDepth);

        // for performance reasons we don't want to iterate each second, instead we iterate by 3m steps where the changes happen.
        while (nextStop >= 0 && !context.isAtSurface) {
            // Next steps need to be in this order
            this.tryGasSwitch(context); // multiple gas switches may happen before first deco stop
            // TODO add air breaks - https://www.diverite.com/uncategorized/oxygen-toxicity-and-ccr-rebreather-diving/
            this.stayAtDecoStop(context, nextStop);
            this.stayAtSafetyStop(context);
            this.ascentToNextStop(context, nextStop);
            nextStop = context.nextStop(nextStop);
        }

        const merged = context.segments.mergeFlat(originSegments.length);
        return CalculatedProfile.fromProfile(merged, context.ceilings);
    }

    private tryGasSwitch(context: AlgorithmContext) {
        const newGas: Gas = context.bestDecoGas();

        if (context.shouldSwitchTo(newGas)) {
            context.currentGas = newGas;
            const stop = context.addGasSwitchSegment();
            this.swim(context, stop);
        }
    }

    private stayAtDecoStop(context: AlgorithmContext, nextStop: number): void {
        if (this.needsDecoStop(context, nextStop)) {
            const memento = context.createMemento();

            const searchContext: SearchContext = {
                // choosing the step based on max. deco for middle experienced divers
                estimationStep: Time.oneMinute * 20,
                initialValue: 0,
                maxValue: Time.oneDay,
                doWork: (newDuration) => this.swimDecoStop(context, memento, newDuration),
                // max stop duration was chosen as one day which may not be enough for saturation divers
                meetsCondition: () => this.needsDecoStop(context, nextStop),
            };

            const interval = new BinaryIntervalSearch();
            // the algorithm returns lowest value, so the last second where the deco isn't enough
            // so we need to add one more second to be safe and adjust it to the required rounding
            const stopDuration = interval.search(searchContext) + Time.oneSecond;
            const rounded = Precision.ceilDistance(stopDuration, context.decoStopDuration);
            this.swimDecoStop(context, memento, rounded);
            // we don't restore last search iteration, we keep the deco stop segment
        }
    }

    private swimDecoStop(context: AlgorithmContext, memento: ContextMemento, stopDuration: number): void {
        context.restore(memento);
        const decoStop = context.addDecoStopSegment();
        decoStop.duration = stopDuration;
        this.swim(context, decoStop);
    }

    /* there is NO better option then to try, since we can't predict the tissues loading */
    private needsDecoStop(context: AlgorithmContext, nextStop: number): boolean {
        if (nextStop >= context.ceiling()) {
            return false;
        }

        // only in case the offgasing is faster than ascent to next stop.
        const memento = context.createMemento();
        this.ascentToNextStop(context, nextStop);
        const result = nextStop < context.ceiling();
        context.restore(memento);
        return result;
    }

    private stayAtSafetyStop(context: AlgorithmContext): void {
        if (context.addSafetyStop) {
            const safetyStop = context.addSafetyStopSegment();
            this.swim(context, safetyStop);
        }
    }

    private ascentToNextStop(context: AlgorithmContext, nextStop: number): void {
        const depthDifference = context.currentDepth - nextStop;
        const duration = this.duration(depthDifference, context.ascentSpeed);
        const ascent = context.addAscentSegment(nextStop, duration);
        this.swim(context, ascent);
    }

    private validate(segments: Segments, gases: Gases): Event[] {
        const segmentErrors = SegmentsValidator.validate(segments, gases);
        if (segmentErrors.length > 0) {
            return segmentErrors;
        }

        const gasMessages = GasesValidator.validate(gases);
        if (gasMessages.length > 0) {
            return gasMessages;
        }

        return [];
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
    private swimNoDecoLimit(segments: Segments, gases: Gases, context: AlgorithmContext): number {
        const errorMessages = this.validate(segments, gases);
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
