import { Ceiling, EventType, Time } from 'scuba-physics';
import { BoundEvent } from '../models';
import { WayPoint } from '../wayPoint';
import {
    ComputerData, ComputerEvent, ComputerEventType,
    GasSwitchEvent, RunTimePoint, StopEvent
} from './computer.model';

/** Calculated dive data needed by the computer, the dive results are one of them */
export interface ComputerSource {
    readonly wayPoints: WayPoint[];
    readonly ceilings: Ceiling[];
    readonly events: BoundEvent[];
}

/** Dive specific values not available in the calculated dive data */
export interface ComputerProfileParameters {
    /** Count of user defined segments at the start of the profile, those are never stops */
    userSegments: number;
}

/** Samples calculated dive results for every second of the dive. */
export class ComputerProfile {
    public static empty(): ComputerData {
        return {
            profile: [],
            events: []
        };
    }

    /**
     * @param source calculated dive data
     * @param parameters needed to create stop events, no stops are created if not provided
     */
    public static calculate(source: ComputerSource, parameters?: ComputerProfileParameters): ComputerData {
        const wayPoints = source.wayPoints;

        if (wayPoints.length === 0) {
            return ComputerProfile.empty();
        }

        const ceilings = source.ceilings;
        const duration = Math.floor(wayPoints[wayPoints.length - 1].endTime);
        const profile: RunTimePoint[] = [];
        let wayPointIndex = 0;
        let ceilingIndex = 0;
        let ceiling = 0;

        let maxDepth = 0;
        let depthArea = 0; // meters * seconds
        let previousDepth = 0;

        for (let runTime = 0; runTime <= duration; runTime++) {
            while (wayPointIndex < wayPoints.length - 1 && wayPoints[wayPointIndex].endTime < runTime) {
                wayPointIndex++;
            }

            while (ceilingIndex < ceilings.length && ceilings[ceilingIndex].time <= runTime) {
                ceiling = ceilings[ceilingIndex].depth;
                ceilingIndex++;
            }

            const depth = ComputerProfile.depthAt(wayPoints[wayPointIndex], runTime);
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

        const stops = parameters ? ComputerProfile.stopsFrom(wayPoints, profile, parameters.userSegments) : [];
        const events = [...ComputerProfile.eventsFrom(source), ...stops]
            .sort((a, b) => a.runTime - b.runTime);
        ComputerProfile.assignNextStop(profile, events);

        return {
            profile: profile,
            events: events
        };
    }

    /**
     * Flat calculated segments during the ascent from the deepest point, where the ceiling is not zero.
     * Gas switch is the same as any other flat segment.
     */
    private static stopsFrom(wayPoints: WayPoint[], profile: RunTimePoint[], userSegments: number): StopEvent[] {
        const ascentStart = ComputerProfile.lastDeepestIndex(wayPoints) + 1;
        const firstCandidate = Math.max(ascentStart, userSegments);
        const stops: StopEvent[] = [];

        for (let index = firstCandidate; index < wayPoints.length; index++) {
            const wayPoint = wayPoints[index];
            const duration = wayPoint.endTime - wayPoint.startTime;
            const isFlat = wayPoint.startDepthMeters === wayPoint.endDepthMeters;
            const ceiling = profile[Math.floor(wayPoint.startTime)].ceiling;

            if (isFlat && duration > 0 && ceiling > 0) {
                stops.push({
                    type: ComputerEventType.stop,
                    runTime: wayPoint.startTime,
                    depth: wayPoint.endDepthMeters,
                    duration: duration
                });
            }
        }

        return stops;
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

    /** Index of the last way point which reaches the maximum depth */
    private static lastDeepestIndex(wayPoints: WayPoint[]): number {
        const maxDepth = Math.max(...wayPoints.map(w => w.endDepthMeters));
        let deepestIndex = 0;

        wayPoints.forEach((wayPoint, index) => {
            if (wayPoint.endDepthMeters === maxDepth) {
                deepestIndex = index;
            }
        });

        return deepestIndex;
    }

    private static eventsFrom(source: ComputerSource): ComputerEvent[] {
        const events: ComputerEvent[] = [];

        source.events.forEach((event) => {
            const converted = ComputerProfile.toComputerEvent(event);

            if (converted) {
                events.push(converted);
            }
        });

        return events;
    }

    private static toComputerEvent(event: BoundEvent): ComputerEvent | undefined {
        const runTime = event.timeStamp;
        const depth = event.depthMeters;

        switch (event.type) {
            case EventType.highPpO2:
                return { type: ComputerEventType.highPpO2, runTime: runTime, depth: depth };
            case EventType.lowPpO2:
                return { type: ComputerEventType.lowPpO2, runTime: runTime, depth: depth };
            case EventType.brokenCeiling:
                return { type: ComputerEventType.brokenCeiling, runTime: runTime, depth: depth };
            case EventType.gasSwitch: {
                const gasSwitch: GasSwitchEvent = {
                    type: ComputerEventType.gasSwitch, runTime: runTime, depth: depth, gasName: event.gasName
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

    /** Linear interpolation of the depth in meters within the way point */
    private static depthAt(wayPoint: WayPoint, runTime: number): number {
        const duration = wayPoint.endTime - wayPoint.startTime;

        if (duration <= 0) {
            return wayPoint.endDepthMeters;
        }

        const elapsed = Math.min(Math.max(runTime - wayPoint.startTime, 0), duration);
        const depthChange = wayPoint.endDepthMeters - wayPoint.startDepthMeters;
        return wayPoint.startDepthMeters + depthChange * elapsed / duration;
    }
}
