import {
    LoadSegment, TissuesValidator, Tissues
} from './Tissues';
import { Gas, Gases, GasesValidator } from '../gases/Gases';
import { Segment, Segments, SegmentsValidator } from '../depths/Segments';
import { DepthConverter, DepthConverterFactory } from '../physics/depth-converter';
import { Time } from '../physics/Time';
import {
    CalculatedProfile, CalculatedProfileStatistics, Ceiling, Event
} from './CalculatedProfile';
import { Options } from './Options';
import { Precision } from '../common/precision';
import { BinaryIntervalSearch, SearchContext } from '../common/BinaryIntervalSearch';
import { Salinity } from '../physics/pressure-converter';
import { AirBreakContext, AlgorithmContext, ContextMemento } from './AlgorithmContext';
import { StandardGases } from '../gases/StandardGases';
import { LoadedTissues } from "./Tissues.api";
import {
    AlgorithmParams,
    durationFor, SurfaceIntervalApplied,
    SurfaceIntervalAppliedStatistics,
    SurfaceIntervalParameters
} from "./BuhlmannAlgorithmParameters";

type CreateAlgorithmContext = (
    gases: Gases, segments: Segments, options: Options,
    depthConverter: DepthConverter, previousTissues: LoadedTissues
) => AlgorithmContext;

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
     * Calculates decompression: generating missing ascent for the planned profile.
     * For other profile data, like ceiling, Tissue loadings or saturation overpressures history use decompressionStatistics method.
     * This method is faster then the statistics methods.
     * @param algorithmParams Not null dive definition all parameters see container definition.
     */
    public decompression(algorithmParams: AlgorithmParams): CalculatedProfile {
        const result = this.decompressionInternal(algorithmParams,
             AlgorithmContext.createWithoutStatistics,
             this.toSimpleProfile,
             (p, e)  => CalculatedProfile.fromErrors(p, e));
        return result;
    }

    /**
     * Calculates decompression: generating missing ascent for the planned profile,
     * and collects dive statistics like ceilings, tissues overpressures or Tissues loading.
     * This method is slow, if you dont need the statistics use "decompression" method.
     * @param algorithmParams Not null dive definition all parameters see container definition.
     */
    public decompressionStatistics(algorithmParams: AlgorithmParams): CalculatedProfileStatistics {
        const result = this.decompressionInternal(algorithmParams,
            AlgorithmContext.createForFullStatistics,
            this.toFullProfile,
            (p, e) => CalculatedProfileStatistics.fromStatisticsErrors(p, e)
        );
        return result;
    }

    /**
     * Takes current tissues (usually at end of the dive) and applies required surface interval.
     * This simulates diver resting at surface and breathing air for required time.
     * This method is faster then the statistics method.
     * @param surfaceInterval Not null surface interval definition.
     * @returns tissues at end of the surface interval.
     */
    public applySurfaceInterval(surfaceInterval: SurfaceIntervalParameters): SurfaceIntervalApplied {
        const result = this.applySurfaceIntervalInternal(
            surfaceInterval,
            AlgorithmContext.createWithoutStatistics,
            () => {
                return {
                    finalTissues: Tissues.createLoadedAt(surfaceInterval.altitude)
                };
            },
            (context) => {
                return {
                    finalTissues: context.finalTissues
                };
            }
        );

        return result as SurfaceIntervalApplied;
    }

    /**
     * Takes current tissues (usually at end of the dive) and applies required surface interval.
     * This simulates diver resting at surface and breathing air for required time.
     * Collects statistics during the surface interval. It is slow, use only to collect statistics.
     * @param surfaceInterval Not null surface interval definition.
     * @returns tissues, Tissues loading, Tissues Overpressures of the surface interval.
     */
    public applySurfaceIntervalStatistics(surfaceInterval: SurfaceIntervalParameters): SurfaceIntervalAppliedStatistics {
        const result = this.applySurfaceIntervalInternal(
            surfaceInterval,
            AlgorithmContext.createForFullStatistics,
            () => {
                return {
                    finalTissues: Tissues.createLoadedAt(surfaceInterval.altitude),
                    tissueOverPressures: []
                };
            },
            (context) => {
                return {
                    finalTissues: context.finalTissues,
                    tissueOverPressures: context.tissueOverPressures
                };
            }
        );

        return result as SurfaceIntervalAppliedStatistics;
    }

    private decompressionInternal<TResult extends CalculatedProfile>(
        algorithmParams: AlgorithmParams,
        createContext: CreateAlgorithmContext,
        toResult: (c: AlgorithmContext, a: AlgorithmParams) => TResult,
        toErrorResult: (segments: Segment[], errors: Event[]) => TResult
    ): TResult {
        const { segments, gases, options, surfaceInterval } = algorithmParams;
        const newSegments = segments.copy();
        const errors = this.validate(segments, gases);
        if (errors.length > 0) {
            const origProfile = newSegments.mergeFlat(segments.length);
            return toErrorResult(origProfile, errors);
        }

        const rested = this.applySurfaceInterval(surfaceInterval);
        const depthConverter = new DepthConverterFactory(options).create();
        const context = createContext(gases, newSegments, options, depthConverter, rested.finalTissues);
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

        return toResult(context, algorithmParams);
    }

    private toFullProfile(context: AlgorithmContext, algorithmParams: AlgorithmParams): CalculatedProfileStatistics {
       const merged = context.segments.mergeFlat(algorithmParams.segments.length);
       return CalculatedProfileStatistics.fromStatisticsProfile(merged, context.ceilings, context.tissueOverPressures, context.finalTissues, context.tissuesHistory);
    }

    private toSimpleProfile(context: AlgorithmContext, algorithmParams: AlgorithmParams): CalculatedProfile {
        const merged = context.segments.mergeFlat(algorithmParams.segments.length);
        return CalculatedProfile.fromProfile(merged, context.finalTissues);
    }

    private applySurfaceIntervalInternal<TResult extends SurfaceIntervalApplied>(
        { previousTissues, altitude, surfaceInterval }: SurfaceIntervalParameters,
        createContext: CreateAlgorithmContext,
        toErrorResult: () => TResult,
        toValidResult: (c: AlgorithmContext) => TResult
    ): TResult {
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
            return toErrorResult();
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
        return toValidResult(context);
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
            let rounded = Precision.ceilDistance(stopDuration, context.decoStopDuration);
            if (context.options.roundRuntimesToMinutes){
                context.restore(memento);
                const secondsDeco = (context.runTime + rounded - 1) % 60;
                if (secondsDeco !== 1){
                    rounded += 60 - secondsDeco;
                }
            }
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
