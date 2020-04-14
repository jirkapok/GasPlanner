import { WayPoint, Plan, Diver, SafetyStop, Gas } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options, Gases, Segments, Segment, CalculatedProfile } from 'scuba-physics';
import { Ceiling } from 'scuba-physics';

export class Profile {
    public wayPoints: WayPoint[];
    public ceilings: Ceiling[];
}

export class WayPointsService {
    public static calculateWayPoints(plan: Plan, gas: Gas, options: Options): Profile {
        const wayPoints = [];
        const descent = this.createDescent(plan);
        const finalSegments = this.calculateDecompression(plan, gas, options, descent);

        let lastWayPoint = descent;
        wayPoints.push(descent);
        const exceptDescend = finalSegments.segments.slice(1);

        exceptDescend.forEach((segment, index, source) => {
            const waypoint = lastWayPoint.toLevel(segment.duration, segment.endDepth);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return {
            wayPoints: wayPoints,
            ceilings: finalSegments.ceilings
        };
    }

    private static calculateDecompression(plan: Plan, gas: Gas, options: Options, descent: WayPoint): CalculatedProfile {
        const bGas = gas.toGas();
        const gases = new Gases();
        gases.addBottomGas(bGas);

        const segments = new Segments();
        segments.add(0, plan.depth, bGas, descent.duration);
        const bottomTime = plan.duration - descent.duration;
        segments.addFlat(plan.depth, bGas, bottomTime);

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
