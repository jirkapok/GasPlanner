import { WayPoint, Plan, Diver, SafetyStop, Gas } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options, Gases, Segments, Segment } from 'scuba-physics';

export class WayPointsService {
    public static calculateWayPoints(plan: Plan, gas: Gas): WayPoint[] {
        const wayPoints = [];
        const descent = this.createDescent(plan);
        const finalSegments = this.calculateDecompression(plan, gas, descent);

        let lastWayPoint = descent;
        wayPoints.push(descent);
        const exceptDescend = finalSegments.slice(1);

        exceptDescend.forEach((segment, index, source) => {
            const waypoint = lastWayPoint.toLevel(segment.time, segment.endDepth);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return wayPoints;
    }

    private static calculateDecompression(plan: Plan, gas: Gas, descent: WayPoint): Segment[] {
        const bGas = gas.toGas();
        const gases = new Gases();
        gases.addBottomGas(bGas);

        const segments = new Segments();
        segments.add(0, plan.depth, bGas, descent.duration);
        const bottomTime = plan.duration - descent.duration;
        segments.addFlat(plan.depth, bGas, bottomTime);

        const options = new Options(true, 0.2, 0.8, 1.6, 30, true);
        const algorithm = new BuhlmannAlgorithm();
        const finalSegments = algorithm.calculateDecompression(options, gases, segments);
        return finalSegments;
    }

    private static createDescent(plan: Plan): WayPoint {
        const endDescend = plan.depth / Diver.descSpeed;
        const endDepth = plan.depth;
        const startPoint = new WayPoint(endDescend, endDepth);
        return startPoint;
    }
}
