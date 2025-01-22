import {
    LoadSegment, TissuesValidator, Tissues
} from './Tissues';
import { Gas, Gases, GasesValidator } from './Gases';
import { Segment, Segments, SegmentsValidator } from './Segments';
import { DepthConverter, DepthConverterFactory } from './depth-converter';
import { Time } from './Time';
import { CalculatedProfile, Ceiling, Event } from './CalculatedProfile';
import { Options } from './Options';
import { Precision } from './precision';
import { BinaryIntervalSearch, SearchContext } from './BinaryIntervalSearch';
import { Salinity } from './pressure-converter';
import { AirBreakContext, AlgorithmContext, ContextMemento } from './AlgorithmContext';
import { StandardGases } from './StandardGases';
import { LoadedTissues, TissueOverPressures } from "./Tissues.api";

// Speed in meters / min.
const durationFor = (depthDifference: number, speed: number): number => {
    const meterPerSec = Time.toMinutes(speed);
    return depthDifference / meterPerSec;
};

type CreateAlgorithmContext = (gases: Gases, segments: Segments, options: Options, depthConverter: DepthConverter, previousTissues: LoadedTissues) => AlgorithmContext;

export interface SurfaceIntervalApplied {
    /** Snapshot of the tissues at end of the applied surface interval */
    finalTissues: LoadedTissues;
}

/** Extends surface interval result by providing tissues statistics collected while resting at surface. */
export interface SurfaceIntervalAppliedStatistics extends SurfaceIntervalApplied {
    /** Only the over pressures collected when applying the surface interval. One sample per second. */
    tissueOverPressures: TissueOverPressures[];
}

/** Represents surface interval between two dives */
export class RestingParameters {
    /**
     * Creates new instance of algorithm parameters representing surface interval between two dives.
     * Used as input for repetitive dives.
     * @param current Not empty collection of tissues at end of previous dive (when surfacing).
     * If no tissues are provided, default (first dive) are created and surfaceInterval has no effect.
     * @param surfaceInterval Duration of diver rest between two dives in seconds.
     */
    constructor(public current: LoadedTissues, public surfaceInterval: number) {
    }
}

/** Parameters to request application of surface interval */
export class SurfaceIntervalParameters {
    /**
     * Creates new instance of algorithm parameters representing surface interval between two dives.
     * Used as input for repetitive dives.
     * @param previousTissues Not empty collection of tissues at end of previous dive (when surfacing).
     * @param altitude Altitude at which the surface interval (resting) happened in m.a.s.l.
     * Usually altitude of the following dive.
     * @param surfaceInterval Duration of diver rest between two dives in seconds.
     */
    constructor(public previousTissues: LoadedTissues, public altitude: number, public surfaceInterval: number) {
    }
}

export class AlgorithmParams {
    private readonly _surface: RestingParameters;
    private constructor(
        private _segments: Segments,
        private _gases: Gases,
        private _options: Options,
        /** If no valid tissues are provided from previous dive,
         * then first dive default tissues are created, ignoring surface interval.
         **/
        surface?: RestingParameters
    ) {
        this._surface = this.resolveSurfaceParameters(surface);
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

    public get surfaceInterval(): SurfaceIntervalParameters {
        return new SurfaceIntervalParameters(this._surface.current, this.options.altitude, this._surface.surfaceInterval);
    }

    /**
     * Creates not null new instance of parameters.
     * @param depth depth below surface in meters
     * @param gas gas to use as the only one during the plan
     * @param options conservatism options to be used
     * @param surface Surface resting definition, in case on repetitive dives. Undefined for first dive.
     */
    public static forSimpleDive(depth: number, gas: Gas, options: Options, surface?: RestingParameters): AlgorithmParams {
        const gases = new Gases();
        gases.add(gas);

        const segments = new Segments();
        const duration = durationFor(depth, options.descentSpeed);
        segments.add(depth, gas, duration);

        return new AlgorithmParams(segments, gases, options, surface);
    }

    /**
     * Creates not null new instance of parameters.
     * @param segments Already realized part of the dive
     * @param gases Gases used during the dive + additional gases to be considered during decompression ascent.
     * For nodeco limit only need to contain gases used in segments.
     * @param options conservatism options to be used
     * @param surface Surface resting definition, in case on repetitive dives. Undefined for first dive.
     */
    public static forMultilevelDive(segments: Segments, gases: Gases, options: Options, surface?: RestingParameters): AlgorithmParams {
        return new AlgorithmParams(segments, gases, options, surface);
    }

    private resolveSurfaceParameters(provided?: RestingParameters): RestingParameters {
        // helps calculator to don't generate tissues for first dive
        if(provided && TissuesValidator.validCount(provided?.current)) {
            return provided;
        }

        const tissues = Tissues.createLoadedAt(this.options.altitude);
        return new RestingParameters(tissues, Number.POSITIVE_INFINITY);
    }
}

export class BuhlmannAlgorithm {
    /**
     * Calculates no decompression limit in minutes.
     * Returns positive number or Infinity, in case there is no more tissues loading
     * usually at small depths (bellow 10 meters).
     */
    public noDecoLimit({ segments, gases, options, surfaceInterval }: AlgorithmParams): number {
        const depthConverter = new DepthConverterFactory(options).create();
        const rested = this.applySurfaceInterval(surfaceInterval);
        const context = AlgorithmContext.createForCeilings(gases, segments, options, depthConverter, rested.finalTissues);
        return this.swimNoDecoLimit(segments, gases, context);
    }

    /**
     * Calculates decompression: generating missing ascent for the planned profile,
     * ceilings during the dive and tissues at end of the dive.
     * @param segments Not empty planned depths collection
     * @param gases Not empty gases used during the plan
     * @param options Customization of the required profile
     * @param surfaceInterval Rested tissues after surface interval from previous dive
     */
    public decompression({ segments, gases, options, surfaceInterval }: AlgorithmParams): CalculatedProfile {
        const depthConverter = new DepthConverterFactory(options).create();
        const newSegments = segments.copy();
        const errors = this.validate(segments, gases);
        if (errors.length > 0) {
            const origProfile = newSegments.mergeFlat(segments.length);
            return CalculatedProfile.fromErrors(origProfile, errors);
        }

        const rested = this.applySurfaceInterval(surfaceInterval);
        const context = AlgorithmContext.createForFullStatistics(gases, newSegments, options, depthConverter, rested.finalTissues);
        this.swimPlan(context);
        context.markAverageDepth();
        let nextStop = context.nextStop(context.currentDepth);

        // for performance reasons we don't want to iterate each second, instead we iterate by 3m steps where the changes happen.
        while (nextStop >= 0 && !context.isAtSurface) {
            // Next steps need to be in this order
            this.tryGasSwitch(context); // multiple gas switches may happen before first deco stop
            this.stayAtDecoStop(context, nextStop);
            this.stayAtSafetyStop(context);
            this.ascentToNextStop(context, nextStop);
            nextStop = context.nextStop(nextStop);
        }

        const merged = context.segments.mergeFlat(segments.length);
        return CalculatedProfile.fromProfile(merged, context.ceilings, context.tissueOverPressures, context.tissuesHistory);
    }

    /**
     * Takes current tissues (usually at end of the dive) and applies required surface interval.
     * This simulates diver resting at surface and breathing air for required time.
     * @param current not empty collection of valid tissues ordered by compartment half time. See Compartments class.
     * @param altitude in meters
     * @param surfaceInterval in seconds to align units with segments
     * @returns tissues at end of the surface interval.
     */
    public applySurfaceInterval(surfaceInterval: SurfaceIntervalParameters): SurfaceIntervalApplied {
        const context = this.applySurfaceIntervalInternal(surfaceInterval, AlgorithmContext.createWithoutStatistics);

        if (!context) {
            return {
                finalTissues: Tissues.createLoadedAt(surfaceInterval.altitude),
            };
        }

        return {
            finalTissues: context.finalTissues,
        };
    }

    /**
     * Takes current tissues (usually at end of the dive) and applies required surface interval.
     * This simulates diver resting at surface and breathing air for required time.
     * Collects statistics during the surface interval.
     * @param current not empty collection of valid tissues ordered by compartment half time. See Compartments class.
     * @param altitude in meters
     * @param surfaceInterval in seconds to align units with segments
     * @returns tissues at end of the surface interval.
     */
    public applySurfaceIntervalStatistics(surfaceInterval: SurfaceIntervalParameters): SurfaceIntervalAppliedStatistics {
        const context = this.applySurfaceIntervalInternal(surfaceInterval, AlgorithmContext.createForFullStatistics);

        if (!context) {
            return {
                finalTissues: Tissues.createLoadedAt(surfaceInterval.altitude),
                tissueOverPressures: []
            };
        }

        return {
            finalTissues: context.finalTissues,
            tissueOverPressures: context.tissueOverPressures
        };
    }

    private applySurfaceIntervalInternal(
        { previousTissues, altitude, surfaceInterval }: SurfaceIntervalParameters,
         createContext: CreateAlgorithmContext
    ): AlgorithmContext | null {
        if(!TissuesValidator.valid(previousTissues)) {
            throw Error('Provided tissues collection isn`t valid. It needs have valid items of 16 compartments ordered by halftime.');
        }

        if(altitude < 0) {
            throw Error('Altitude needs to be positive number or 0.');
        }

        if(surfaceInterval < 0) {
            throw Error('Surface interval needs to be positive number or 0.');
        }

        if(surfaceInterval === Number.POSITIVE_INFINITY) {
            return null;
        }

        // at surface, there is no depth change, even we are at different elevation and we are always breathing air
        const segments = new Segments();
        const restingSegment = segments.addFlat(StandardGases.air, surfaceInterval);
        const gases = new Gases();
        gases.add(StandardGases.air);
        // the only option affecting depth converter is current altitude
        const options = new Options(1, 1, 1.6, 1.6, Salinity.salt);
        options.altitude = altitude;
        const depthConverter = new DepthConverterFactory(options).create();
        const context = createContext(gases, segments, options, depthConverter, previousTissues);
        this.swim(context, restingSegment);
        // we don't have here the saturation from the dive, so we can return only the surface changes
        return context;
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
        }
    }

    private swimDecoStop(context: AlgorithmContext, memento: ContextMemento, stopDuration: number): void {
        context.restore(memento);

        // Air breaks prolong the deco, so we need to count with them also in stop estimation
        this.stayAtStop(context, stopDuration);
    }

    private stayAtSafetyStop(context: AlgorithmContext): void {
        if (context.addSafetyStop) {
            this.stayAtStop(context, Time.safetyStopDuration);
        }
    }

    private stayAtStop(context: AlgorithmContext, stopDuration: number): void {
        if (context.shouldAddAirBreaks) {
            this.swimOxygenStop(context, stopDuration);
        } else {
            this.swimStopDuration(context, stopDuration);
        }
    }

    /**
     *  Air break process:
     *  1. stay on oxygen up to max O2 time
     *  2. switch to back gas for the break time
     *  3. repeat until there is no more deco time
     **/
    private swimOxygenStop(context: AlgorithmContext, totalStopDuration: number): void {
        const airBreak = new AirBreakContext(context, totalStopDuration);

        while(airBreak.needsStop) {
            // here we don't count with gas switch duration (it is part of the stop)
            airBreak.switchStopGas();
            this.swimStopDuration(context, airBreak.stopDuration);
            airBreak.subtractStopDuration();
        }

        // consider stay with last used gas, if breathable during ascent
        // we started on oxygen, so we should switch back to breathable gas during ascent
        context.currentGas = StandardGases.oxygen;
    }

    private swimStopDuration(context: AlgorithmContext, stopDuration: number): void {
        const decoStop = context.addStopSegment(stopDuration);
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
        const segments = context.segments.items;
        // initial ceiling doesn't have to be 0m, because of previous tissues loading.
        context.addStatistics(segments[0].startDepth);

        segments.forEach(segment => {
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
        context.loadTissues(loadSegment, segment.gas);
        context.runTime += segment.duration;
        context.addStatistics(segment.averageDepth);
    }

    /**
     * Simply continue from currently planned segments, expecting diver stays in the same depth breathing the same gas.
     */
    private swimNoDecoLimit(segments: Segments, gases: Gases, context: AlgorithmContext): number {
        const errorMessages = this.validate(segments, gases);
        if (errorMessages.length > 0) {
            return 0;
        }

        // possible performance optimization: don't swim the whole profile, only till we reach NDL
        this.swimPlan(context);
        // We may already passed the Ndl during descent or user defined profile

        const currentNdl = this.currentNdl(context.ceilings);
        if (currentNdl !== Number.POSITIVE_INFINITY) {
            return currentNdl;
        }

        context = context.withoutStatistics();
        return this.predictNoDecoLimit(segments, context);
    }

    private predictNoDecoLimit(segments: Segments, context: AlgorithmContext): number {
        const last = segments.last();
        const depth = last.endDepth;
        const hover = new Segment(depth, depth, last.gas, Time.oneMinute);
        const hoverLoad = this.toLoadSegment(context.depthConverter, hover);
        let change = 1;

        while (context.ceiling() <= 0 && change > 0) {
            change = context.loadTissues(hoverLoad, last.gas);
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
