import { Ceiling, Event, EventType } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import {
    ComputerData, ComputerEvent, ComputerEventType,
    GasSwitchEvent, RunTimePoint, StopEvent
} from './ComputerData';

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
interface TimedSegment {
    segment: Segment;
    startTime: number;
    endTime: number;
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

            const timed = segments[segmentIndex];
            // zero duration segment has no speed, so it stays at its end depth
            const depth = timed.segment.duration > 0 ? timed.segment.depthAt(runTime - timed.startTime) : timed.segment.endDepth;
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
        const events = [...ComputerProfile.eventsFrom(source.events), ...stops]
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
            const endTime = startTime + segment.duration;
            const timed: TimedSegment = { segment: segment, startTime: startTime, endTime: endTime };
            startTime = endTime;
            return timed;
        });
    }

    /**
     * Flat segments, user defined or calculated (gas switch included), where at any moment of the segment
     * the ceiling comes closer to the depth than the stop distance. E.g. bottom with ceiling far above isn't a stop.
     */
    private static stopsFrom(segments: TimedSegment[], profile: RunTimePoint[], stopDistance: number): StopEvent[] {
        const stops: StopEvent[] = [];

        segments.forEach((timed) => {
            const segment = timed.segment;

            if (segment.isFlat && segment.duration > 0 && ComputerProfile.hasCloseCeiling(timed, profile, stopDistance)) {
                stops.push({
                    type: ComputerEventType.stop,
                    runTime: timed.startTime,
                    depth: segment.endDepth,
                    duration: segment.duration
                });
            }
        });

        return stops;
    }

    /** True, if at any moment of the segment the ceiling isn't at surface and is closer to the segment depth than the stop distance */
    private static hasCloseCeiling(timed: TimedSegment, profile: RunTimePoint[], stopDistance: number): boolean {
        const depth = timed.segment.endDepth;

        for (let runTime = Math.floor(timed.startTime); runTime < timed.endTime && runTime < profile.length; runTime++) {
            const ceiling = profile[runTime].ceiling;

            if (ceiling > 0 && depth - ceiling < stopDistance) {
                return true;
            }
        }

        return false;
    }

    private static assignNextStop(profile: RunTimePoint[], events: ComputerEvent[]): void {
        const stops = ComputerProfile.stopsToFollow(events);
        let stopIndex = 0;

        profile.forEach((point) => {
            while (stopIndex < stops.length && ComputerProfile.stopEnd(stops[stopIndex]) <= point.runTime) {
                stopIndex++;
            }

            point.nextStop = stops[stopIndex];
        });
    }

    /** Stops and safety stops sorted by time, safety stop overlapping any stop is replaced by the stop */
    private static stopsToFollow(events: ComputerEvent[]): StopEvent[] {
        const allStops = events.filter((e): e is StopEvent =>
            e.type === ComputerEventType.stop || e.type === ComputerEventType.safetyStop);
        const decoStops = allStops.filter(s => s.type === ComputerEventType.stop);

        return allStops.filter(s => s.type === ComputerEventType.stop ||
            !decoStops.some(decoStop => ComputerProfile.overlaps(decoStop, s)));
    }

    private static overlaps(first: StopEvent, second: StopEvent): boolean {
        return first.runTime < ComputerProfile.stopEnd(second) && second.runTime < ComputerProfile.stopEnd(first);
    }

    private static stopEnd(stop: StopEvent): number {
        return stop.runTime + stop.duration;
    }

    private static eventsFrom(source: Event[]): ComputerEvent[] {
        const events: ComputerEvent[] = [];

        source.forEach((event) => {
            const converted = ComputerProfile.toComputerEvent(event);

            if (converted) {
                events.push(converted);
            }
        });

        return events;
    }

    private static toComputerEvent(event: Event): ComputerEvent | undefined {
        const runTime = event.timeStamp;
        const depth = event.depth;

        switch (event.type) {
            case EventType.highPpO2:
                return { type: ComputerEventType.highPpO2, runTime: runTime, depth: depth };
            case EventType.lowPpO2:
                return { type: ComputerEventType.lowPpO2, runTime: runTime, depth: depth };
            case EventType.brokenCeiling:
                return { type: ComputerEventType.brokenCeiling, runTime: runTime, depth: depth };
            case EventType.gasSwitch: {
                const gasSwitch: GasSwitchEvent = {
                    type: ComputerEventType.gasSwitch,
                    runTime: runTime,
                    depth: depth,
                    gasName: event.gas?.name ?? ''
                };
                return gasSwitch;
            }
            case EventType.safetyStop: {
                const safetyStop: StopEvent = {
                    type: ComputerEventType.safetyStop, runTime: runTime, depth: depth, duration: Time.safetyStopDuration
                };
                return safetyStop;
            }
            default:
                return undefined;
        }
    }
}
