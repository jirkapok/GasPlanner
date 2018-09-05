import { WayPoint, Plan } from './models';
import { PreferencesService } from './preferences.service';

export class WayPointsService {
    private static descSpeed = 20;
    private static ascSpeed = 10;

    public static calculateWayPoints(plan: Plan): WayPoint[] {
        const wayPoints = [];

        const descent = this.createDescent(plan);
        const bottomTime = plan.duration - descent.duration;
        const bottom = this.createLevel(descent, bottomTime);
        // TODO add mandatory stop
        const ascent = this.createAscent(bottom, 0);

        // TODO normalize coordinates to start point 10,30
        wayPoints.push(descent);
        wayPoints.push(bottom);
        wayPoints.push(ascent);

        return wayPoints;
    }

    private static createDescent(plan: Plan): WayPoint {
        const endDescend = plan.depth / this.descSpeed;
        const endDepth = plan.depth;
        const startPoint = new WayPoint(endDescend, endDepth);
        return startPoint;
    }

    private static createLevel(previous: WayPoint, duration: number): WayPoint {
        const bottomDuration = duration; // including descent
        return previous.toLevel(bottomDuration, previous.endDepth);
    }

    private static createAscent(previous: WayPoint, nextDepth: number): WayPoint {
        const ascDuration = (previous.endDepth - nextDepth) / this.ascSpeed;
        return previous.toLevel(ascDuration, nextDepth);
    }
}
