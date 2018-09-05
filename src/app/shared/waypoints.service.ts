import { WayPoint, Plan } from './models';

export class WayPointsService {
    public static calculateWayPoints(plan: Plan): WayPoint[] {
        const wayPoints = [];
        const startPoint = new WayPoint(10, 30, 10 , 200);
        wayPoints.push(startPoint);
        const bottom = startPoint.toLevel(50, 200);
        wayPoints.push(bottom);

        return wayPoints;
    }
}
