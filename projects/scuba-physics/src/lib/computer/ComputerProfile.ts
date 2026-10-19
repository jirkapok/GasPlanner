import { Ceiling, Event } from '../algorithm/CalculatedProfile';
import { LoadedTissues } from '../algorithm/Tissues.api';
import { AverageDepth } from '../depths/AverageDepth';
import { Segment } from '../depths/Segments';
import { ComputerData, ComputerEvent, ComputerEventType, RunTimePoint } from './ComputerData';
import { ComputerStop } from './ComputerStop';
import { TissuesLoading } from './TissuesLoading';

/** Calculated dive data, from which the computer data are sampled */
export interface ComputerProfileSource {
    /** Complete profile: user defined segments followed by the calculated ascent */
    profile: Segment[];
    /** Ceilings of the profile, sampled every second */
    ceilings: Ceiling[];
    /** Tissues history of the profile, sampled every second at the same times as the ceilings */
    tissues: LoadedTissues[];
    /** Events of the profile calculated by the algorithm */
    events: Event[];
    /**
     * Distance between decompression stops in meters, see Options.decoStopDistance.
     * Flat segment is a stop, when its ceiling comes closer than this distance.
     */
    stopDistance: number;
    /** in bars, see DepthConverter.surfacePressure */
    surfacePressure: number;
    /** Gradient factor high in range 0-1, see Options.gfHigh */
    gfHigh: number;
}

/** Segment with its position in the profile, in seconds since start of the dive */
class TimedSegment {
    private readonly _endTime: number;

    constructor(public readonly segment: Segment, public readonly startTime: number) {
        this._endTime = startTime + segment.duration;
    }

    public get endTime(): number {
        return this._endTime;
    }

    /** in meters per second, positive number for ascent, 0 for flat, descending or zero duration segment */
    public get ascentSpeed(): number {
        const speed = this.segment.speed;
        return this.segment.duration > 0 && speed < 0 ? -speed : 0;
    }

    public static fromSegments(profile: Segment[]): TimedSegment[] {
        let startTime = 0;

        return profile.map((segment) => {
            const timed = new TimedSegment(segment, startTime);
            startTime = timed.endTime;
            return timed;
        });
    }

    /** Depth in meters at the given run time (seconds since start of the dive) within this segment */
    public depthAt(runTime: number): number {
        // zero duration segment has no speed, so it stays at its end depth
        return this.segment.duration > 0 ? this.segment.depthAt(runTime - this.startTime) : this.segment.endDepth;
    }

    /**
     * True, if at any moment of the segment the ceiling isn't at surface and is closer to the segment depth than the stop distance
     * @param profile sampled points of the whole dive, one for every second
     * @param stopDistance distance between decompression stops in meters
     */
    public hasCloseCeiling(profile: RunTimePoint[], stopDistance: number): boolean {
        if (this.segment.isFlat && this.segment.duration > 0) {
            for (let runTime = Math.floor(this.startTime); runTime < this.endTime && runTime < profile.length; runTime++) {
                const ceiling = profile[runTime].ceiling;

                if (ceiling > 0 && this.depthAt(runTime) - ceiling < stopDistance) {
                    return true;
                }
            }
        }

        return false;
    }
}

/** State of the sampling, moves through the dive second by second */
class ComputerProfileContext {
    private segmentIndex = 0;
    private ceilingIndex = 0;
    private _runTime = 0;
    private _depth = 0;
    private _ceiling = 0;
    private _maxDepth = 0;
    private _averageDepth = 0;
    private readonly averageDepths = new AverageDepth();

    constructor(
        private readonly segments: TimedSegment[],
        private readonly ceilings: Ceiling[],
        private readonly tissues: LoadedTissues[]
    ) {
    }

    /** Last whole second of the dive */
    public get duration(): number {
        return Math.floor(this.diveEnd);
    }

    /** in meters at current moment */
    public get depth(): number {
        return this._depth;
    }

    /** in meters, the deepest depth reached so far */
    public get maxDepth(): number {
        return this._maxDepth;
    }

    /** in meters, time weighted from start of the dive to current moment */
    public get averageDepth(): number {
        return this._averageDepth;
    }

    /**
     * Tissues sampled at the same time as the current ceiling, the first sample before any ceiling was sampled
     * and the last sample, when there are less tissues samples than ceilings. Undefined for empty tissues history.
     */
    public get currentTissues(): LoadedTissues | undefined {
        const index = Math.min(Math.max(this.ceilingIndex - 1, 0), this.tissues.length - 1);
        return this.tissues[index];
    }

    /** in meters at current moment */
    public get ceiling(): number {
        return this._ceiling;
    }

    /** in meters per second at current moment, see TimedSegment.ascentSpeed */
    public get ascentSpeed(): number {
        return this.segment.ascentSpeed;
    }

    /** remaining seconds from current moment to the end of the dive */
    public get timeToSurface(): number {
        return this.diveEnd - this._runTime;
    }

    /** Segment at current moment */
    private get segment(): TimedSegment {
        return this.segments[this.segmentIndex];
    }

    private get hasNextSegment(): boolean {
        return this.segmentIndex < this.segments.length - 1;
    }

    private get nextCeiling(): Ceiling {
        return this.ceilings[this.ceilingIndex];
    }

    private get hasNextCeiling(): boolean {
        return this.ceilingIndex < this.ceilings.length;
    }

    /** in seconds since start of the dive */
    private get diveEnd(): number {
        return this.segments[this.segments.length - 1].endTime;
    }

    /** Moves to the given second of the dive, expecting it follows the current one */
    public moveTo(runTime: number): void {
        while (this.hasNextSegment && this.segment.endTime < runTime) {
            this.segmentIndex++;
        }

        while (this.hasNextCeiling && this.nextCeiling.time <= runTime) {
            this._ceiling = this.nextCeiling.depth;
            this.ceilingIndex++;
        }

        const depth = this.segment.depthAt(runTime);
        this._maxDepth = Math.max(this._maxDepth, depth);
        this._averageDepth = this.averageDepths.add(depth);
        this._depth = depth;
        this._runTime = runTime;
    }
}

/** Samples calculated dive for every second of the dive. */
export class ComputerProfile {
    public static empty(): ComputerData {
        return {
            profile: [],
            events: []
        };
    }

    /**
     * Samples the calculated dive for every second of the dive.
     * The no decompression limit isn't sampled (0 in every point), see DiveComputer.
     */
    public static sample(source: ComputerProfileSource): ComputerData {
        const segments = TimedSegment.fromSegments(source.profile);

        if (segments.length === 0) {
            return ComputerProfile.empty();
        }

        const context = new ComputerProfileContext(segments, source.ceilings, source.tissues);
        const profile: RunTimePoint[] = [];

        for (let runTime = 0; runTime <= context.duration; runTime++) {
            context.moveTo(runTime);

            profile.push({
                runTime: runTime,
                depth: context.depth,
                maxDepth: context.maxDepth,
                averageDepth: context.averageDepth,
                ceiling: context.ceiling,
                ascentSpeed: context.ascentSpeed,
                tissuesLoading: ComputerProfile.tissuesLoading(context, source),
                ndl: 0,
                tts: context.timeToSurface
            });
        }

        const algorithmEvents = ComputerStop.eventsFrom(source.events);
        const stops = ComputerProfile.stopsFrom(segments, profile, source.stopDistance);
        const events = [...algorithmEvents, ...ComputerProfile.endBeforeSafetyStops(stops, algorithmEvents)]
            .sort((a, b) => a.runTime - b.runTime);
        ComputerProfile.assignNextStop(profile, events);

        return {
            profile: profile,
            events: events
        };
    }

    /** Loading of the tissues at current moment, 0 without tissues history */
    private static tissuesLoading(context: ComputerProfileContext, source: ComputerProfileSource): number {
        const tissues = context.currentTissues;
        return tissues ? TissuesLoading.percents(tissues, context.ceiling, source.surfacePressure, source.gfHigh) : 0;
    }

    /**
     * Flat segments, user defined or calculated (gas switch included), where at any moment of the segment
     * the ceiling comes closer to the depth than the stop distance. E.g. bottom with ceiling far above isn't a stop.
     */
    private static stopsFrom(segments: TimedSegment[], profile: RunTimePoint[], stopDistance: number): ComputerStop[] {
        const stops: ComputerStop[] = [];

        segments.forEach((timed) => {
            if (timed.hasCloseCeiling(profile, stopDistance)) {
                stops.push(new ComputerStop(ComputerEventType.stop, timed.startTime, timed.segment.endDepth, timed.segment.duration));
            }
        });

        return stops;
    }

    private static assignNextStop(profile: RunTimePoint[], events: ComputerEvent[]): void {
        const stops = ComputerProfile.stopsToFollow(events);
        let stopIndex = 0;

        profile.forEach((point) => {
            while (stopIndex < stops.length && stops[stopIndex].stopEnd <= point.runTime) {
                stopIndex++;
            }

            point.nextStop = stops[stopIndex];
        });
    }

    /**
     * Safety stop always follows the mandatory stop, they may be part of the same segment.
     * So the mandatory stop ends, where the overlapping safety stop starts.
     * Stop completely covered by the safety stop is removed.
     */
    private static endBeforeSafetyStops(stops: ComputerStop[], events: ComputerEvent[]): ComputerStop[] {
        const safetyStops = events.filter((e): e is ComputerStop => e instanceof ComputerStop && e.type === ComputerEventType.safetyStop);

        return stops
            .map((stop) => {
                const safetyStop = safetyStops.find(s => stop.overlaps(s));
                return safetyStop ? stop.endAt(safetyStop.runTime) : stop;
            })
            .filter(stop => stop.duration > 0);
    }

    /** Stops and safety stops sorted by time, they don't overlap */
    private static stopsToFollow(events: ComputerEvent[]): ComputerStop[] {
        return events.filter((e): e is ComputerStop => e instanceof ComputerStop);
    }
}
