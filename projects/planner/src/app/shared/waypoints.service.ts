import { WayPoint, Plan, Diver, SafetyStop, Gas } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options } from 'scuba-physics';

export class WayPointsService {
    public static calculateWayPoints(plan: Plan, gas: Gas): WayPoint[] {
        const wayPoints = [];
        const descent = this.createDescent(plan);
        const bottomTime = plan.duration - descent.duration;

        const algorithm = new BuhlmannAlgorithm();
        const o2 = gas.o2 / 100;
        const bGas = new BGas(o2, 0);
        algorithm.addBottomGas(bGas);
        algorithm.addDepthChange(0, plan.depth, bGas, descent.duration, true);
        algorithm.addFlat(plan.depth, bGas, bottomTime, true);
        const options = new Options(true, 0.2, 0.8, 1.6, 30, true);
        const segments = algorithm.calculateDecompression(options);

        let lastWayPoint = descent;
        wayPoints.push(descent);
        const exceptDescend = segments.slice(1);

        exceptDescend.forEach((segment, index, source) => {
            const waypoint = lastWayPoint.toLevel(segment.time, segment.endDepth);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return wayPoints;
    }

    private static createDescent(plan: Plan): WayPoint {
        const endDescend = plan.depth / Diver.descSpeed;
        const endDepth = plan.depth;
        const startPoint = new WayPoint(endDescend, endDepth);
        return startPoint;
    }
}
