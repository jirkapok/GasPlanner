import { WayPoint, Plan, Diver, Gas } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options, Gases, Segments, Segment, CalculatedProfile } from 'scuba-physics';
import { Ceiling, Time } from 'scuba-physics';

export class Profile {
    public wayPoints: WayPoint[];
    public ceilings: Ceiling[];
}

export class WayPointsService {
    public static calculateWayPoints(plan: Plan, gas: Gas, options: Options): Profile {
        const wayPoints = [];
        const finalSegments = this.calculateDecompression(plan, gas, options);

        const descent = finalSegments.segments[0];
        let lastWayPoint = new WayPoint(descent.duration, descent.endDepth);
        wayPoints.push(lastWayPoint);
        const exceptDescend = finalSegments.segments.slice(1);

        exceptDescend.forEach((segment, index, source) => {
            const durationMinutes = segment.duration;
            const waypoint = lastWayPoint.toLevel(durationMinutes, segment.endDepth);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return {
            wayPoints: wayPoints,
            ceilings: finalSegments.ceilings
        };
    }

    private static calculateDecompression(plan: Plan, gas: Gas, options: Options): CalculatedProfile {
        const bGas = gas.toGas();
        const gases = new Gases();
        gases.addBottomGas(bGas);

        const segments = new Segments();
        const descentDuration = Time.toSeconds(plan.depth / Diver.descSpeed);
        segments.add(0, plan.depth, bGas, descentDuration);
        const bottomTime = Time.toSeconds(plan.duration) - descentDuration;
        segments.addFlat(plan.depth, bGas, bottomTime);

        const algorithm = new BuhlmannAlgorithm();
        const finalSegments = algorithm.calculateDecompression(options, gases, segments);
        return finalSegments;
    }
}
