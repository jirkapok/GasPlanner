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

/** Samples calculated dive results for every second of the dive. */
export class ComputerProfile {
    public static empty(): ComputerData {
        return {
            profile: [],
            events: []
        };
    }

    public static calculate(source: ComputerSource): ComputerData {
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

        return {
            profile: profile,
            events: ComputerProfile.eventsFrom(source)
        };
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
