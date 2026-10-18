import { Ceiling, Event } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { ComputerData, ComputerEvent, ComputerEventType, RunTimePoint } from './ComputerData';
import { ComputerStop } from './ComputerStop';

/** Calculated dive data, from which the computer data are sampled */
export interface ComputerProfileSource {
    /** Complete profile: user defined segments followed by the calculated ascent */
    profile: Segment[];
    /** Ceilings of the profile, sampled every second */
    ceilings: Ceiling[];
    /** Events of the profile calculated by the algorithm */
    events: Event[];
    /**
     * Distance between decompression stops in meters, see Options.decoStopDistance.
     * Flat segment is a stop, when its ceiling comes closer than this distance.
     */
    stopDistance: number;
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
        const segments = ComputerProfile.timed(source.profile);

        if (segments.length === 0) {
            return ComputerProfile.empty();
        }

        const ceilings = source.ceilings;
        const duration = Math.floor(segments[segments.length - 1].endTime);
        const profile: RunTimePoint[] = [];
        let segmentIndex = 0;
        let ceilingIndex = 0;
        let ceiling = 0;
        let maxDepth = 0;
        let depthArea = 0; // meters * seconds
        let previousDepth = 0;

        for (let runTime = 0; runTime <= duration; runTime++) {
            while (segmentIndex < segments.length - 1 && segments[segmentIndex].endTime < runTime) {
                segmentIndex++;
            }

            while (ceilingIndex < ceilings.length && ceilings[ceilingIndex].time <= runTime) {
                ceiling = ceilings[ceilingIndex].depth;
                ceilingIndex++;
            }

            const depth = segments[segmentIndex].depthAt(runTime);
            maxDepth = Math.max(maxDepth, depth);

            if (runTime > 0) {
                // trapezoid of the last second, exact for linear depth change
                depthArea += (previousDepth + depth) / 2;
            }

            previousDepth = depth;

            profile.push({
                runTime: runTime,
                depth: depth,
                maxDepth: maxDepth,
                averageDepth: runTime > 0 ? depthArea / runTime : 0,
                ceiling: ceiling,
                ndl: 0,
                tts: 0
            });
        }

        const stops = ComputerProfile.stopsFrom(segments, profile, source.stopDistance);
        const events = [...ComputerStop.eventsFrom(source.events), ...stops]
            .sort((a, b) => a.runTime - b.runTime);
        ComputerProfile.assignNextStop(profile, events);

        return {
            profile: profile,
            events: events
        };
    }

    private static timed(profile: Segment[]): TimedSegment[] {
        let startTime = 0;

        return profile.map((segment) => {
            const timed = new TimedSegment(segment, startTime);
            startTime = timed.endTime;
            return timed;
        });
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

    /** Stops and safety stops sorted by time, safety stop overlapping any stop is replaced by the stop */
    private static stopsToFollow(events: ComputerEvent[]): ComputerStop[] {
        const allStops = events.filter((e): e is ComputerStop => e instanceof ComputerStop);
        const decoStops = allStops.filter(s => s.type === ComputerEventType.stop);

        return allStops.filter(s => s.type === ComputerEventType.stop ||
            !decoStops.some(decoStop => decoStop.overlaps(s)));
    }
}
