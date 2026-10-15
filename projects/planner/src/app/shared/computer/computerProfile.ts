import { DiveResults } from '../diveresults';
import { WayPoint } from '../wayPoint';
import { ComputerData, RunTimePoint } from './computer.model';

/** Samples calculated dive results for every second of the dive. */
export class ComputerProfile {
    public static empty(): ComputerData {
        return {
            profile: [],
            events: []
        };
    }

    public static calculate(dive: DiveResults): ComputerData {
        const wayPoints = dive.wayPoints;

        if (wayPoints.length === 0) {
            return ComputerProfile.empty();
        }

        const ceilings = dive.ceilings;
        const duration = Math.floor(wayPoints[wayPoints.length - 1].endTime);
        const profile: RunTimePoint[] = [];
        let wayPointIndex = 0;
        let ceilingIndex = 0;
        let ceiling = 0;

        for (let runTime = 0; runTime <= duration; runTime++) {
            while (wayPointIndex < wayPoints.length - 1 && wayPoints[wayPointIndex].endTime < runTime) {
                wayPointIndex++;
            }

            while (ceilingIndex < ceilings.length && ceilings[ceilingIndex].time <= runTime) {
                ceiling = ceilings[ceilingIndex].depth;
                ceilingIndex++;
            }

            profile.push({
                runTime: runTime,
                depth: ComputerProfile.depthAt(wayPoints[wayPointIndex], runTime),
                ceiling: ceiling,
                ndl: 0,
                tts: 0
            });
        }

        return {
            profile: profile,
            events: []
        };
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
