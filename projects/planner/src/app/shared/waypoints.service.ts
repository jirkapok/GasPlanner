import { WayPoint, Plan, Diver, SafetyStop } from './models';

export class WayPointsService {
    public static calculateWayPoints(plan: Plan): WayPoint[] {
        const wayPoints = [];

        const descent = this.createDescent(plan);
        const bottomTime = plan.duration - descent.duration;
        const bottom = this.createLevel(descent, bottomTime);
        wayPoints.push(descent, bottom);
        this.createAscentPoints(plan, bottom, wayPoints);
        return wayPoints;
    }

    private static createAscentPoints(plan: Plan, bottom: WayPoint, current: WayPoint[]): void {
        if (plan.needsSafetyStop) {
            const asc1 = this.createAscent(bottom, SafetyStop.depth);
            const stop = this.createLevel(asc1, SafetyStop.duration);
            const asc2 = this.createAscent(stop, 0);
            current.push(asc1, stop, asc2);
        } else {
            const asc = this.createAscent(bottom, 0);
            current.push(asc);
        }
    }

    private static createDescent(plan: Plan): WayPoint {
        const endDescend = plan.depth / Diver.descSpeed;
        const endDepth = plan.depth;
        const startPoint = new WayPoint(endDescend, endDepth);
        return startPoint;
    }

    private static createLevel(previous: WayPoint, duration: number): WayPoint {
        const bottomDuration = duration; // including descent
        return previous.toLevel(bottomDuration, previous.endDepth);
    }

    private static createAscent(previous: WayPoint, nextDepth: number): WayPoint {
        const ascDuration = (previous.endDepth - nextDepth) / Diver.ascSpeed;
        return previous.toLevel(ascDuration, nextDepth);
    }
}
