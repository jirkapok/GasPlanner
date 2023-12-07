import { LoadedTissue, LoadSegment, Tissues, TissuesValidator } from './Tissues';
import { Gas, Gases, GasesValidator, StandardGases } from './Gases';
import { Segment, Segments, SegmentsValidator } from './Segments';
import { DepthConverter, DepthConverterFactory } from './depth-converter';
import { Time } from './Time';
import { CalculatedProfile, Ceiling, Event } from './Profile';
import { Options } from './Options';
import { Precision } from './precision';
import { BinaryIntervalSearch, SearchContext } from './BinaryIntervalSearch';
import { Salinity } from './pressure-converter';
import { AlgorithmContext, ContextMemento } from './AlgorithmContext';

// Speed in meters / min.
const durationFor = (depthDifference: number, speed: number): number => {
    const meterPerSec = Time.toMinutes(speed);
    return depthDifference / meterPerSec;
};

export class AlgorithmParams {
    private constructor(private _segments: Segments, private _gases: Gases, private _options: Options) {
    }

    public get segments(): Segments {
        return this._segments;
    }

    public get gases(): Gases {
        return this._gases;
    }

    public get options(): Options {
        return this._options;
    }

    /**
     * Creates not null new instance of parameters.
     * @param depth depth below surface in meters
     * @param gas gas to use as the only one during the plan
     * @param options conservatism options to be used
     */
    public static forSimpleDive(depth: number, gas: Gas, options: Options): AlgorithmParams {
        const gases = new Gases();
        gases.add(gas);

        const segments = new Segments();
        const duration = durationFor(depth, options.descentSpeed);
        segments.add(0, depth, gas, duration);

        return new AlgorithmParams(segments, gases, options);
    }

    /**
     * Creates not null new instance of parameters.
     * @param segments Already realized part of the dive
     * @param gases Gases used during the dive, only need to contain gases used in segments.
     * @param options conservatism options to be used
     */
    public static forMultilevelDive(segments: Segments, gases: Gases, options: Options): AlgorithmParams {
        return new AlgorithmParams(segments, gases, options);
    }
}

export class BuhlmannAlgorithm {
    /**
     * Calculates no decompression limit in minutes.
     * Returns positive number or Infinity, in case there is no more tissues loading.
     * Usually at small depths (bellow 10 meters).
     */
    public noDecoLimit({ segments, gases, options }: AlgorithmParams): number {
        const depthConverter = new DepthConverterFactory(options).create();
        const context = new AlgorithmContext(gases, segments, options, depthConverter);
        return this.swimNoDecoLimit(segments, gases, context);
    }

    public decompression({ segments, gases, options }: AlgorithmParams): CalculatedProfile {
        const depthConverter = new DepthConverterFactory(options).create();
        const newSegments = segments.copy();
        const errors = this.validate(segments, gases);
        if (errors.length > 0) {
            const origProfile = newSegments.mergeFlat(segments.length);
            return CalculatedProfile.fromErrors(origProfile, errors);
        }

        const context = new AlgorithmContext(gases, newSegments, options, depthConverter);
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

        const merged = context.segments.mergeFlat(segments.length);
        return CalculatedProfile.fromProfile(merged, context.ceilings, context.tissues.finalState());
    }

    /**
     * @param current not empty collection of valid tissues ordered by compartment half time.
     * See Compartments class.
     * @param altitude in meters
     * @param surfaceInterval in seconds to align units with segments
     */
    public applySurfaceInterval(current: LoadedTissue[], altitude: number = 0, surfaceInterval: number = 0): LoadedTissue[] {
        if(!TissuesValidator.valid(current)) {
            throw Error('Provided tissues collection isn`t valid. It needs have valid items of 16 compartments ordered by halftime.');
        }

        if(altitude < 0) {
            throw Error('Altitude needs to be positive number or 0.');
        }

        if(surfaceInterval < 0) {
            throw Error('Surface interval needs to be positive number or 0.');
        }

        const tissues = Tissues.createLoaded(current);
        // at surface, there is no depth change, even we are at different elevation and we are always breathing air
        const segments = new Segments();
        const restingSegment = segments.addFlat(0, StandardGases.air, surfaceInterval);
        const gases = new Gases();
        gases.add(StandardGases.air);
        // the only option affecting depth converter is current altitude
        const options = new Options(1, 1, 1.6, 1.6, Salinity.salt);
        options.altitude = altitude;
        const depthConverter = new DepthConverterFactory(options).create();
        const context = new AlgorithmContext(gases, segments, options, depthConverter, tissues);
        this.swim(context, restingSegment);
        return context.tissues.finalState();
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
        const duration = durationFor(depthDifference, context.ascentSpeed);
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
