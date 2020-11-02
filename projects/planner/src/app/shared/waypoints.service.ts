import { WayPoint, Plan, Diver, Gas } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options, Gases, Segments, Event, CalculatedProfile } from 'scuba-physics';
import { Ceiling, Time } from 'scuba-physics';

export class Profile {
    public wayPoints: WayPoint[];
    public ceilings: Ceiling[];
    public events: Event[];
}

export class WayPointsService {
    public static calculateWayPoints(plan: Plan, gases: Gas[], options: Options): Profile {
        const wayPoints = [];
        const profile = this.calculateDecompression(plan, gases, options);

        if (profile.errorMessages.length > 0){
            return {
                wayPoints: [],
                ceilings: [],
                events: []
            };
        }

        const descent = profile.segments[0];
        let lastWayPoint = new WayPoint(descent.duration, descent.endDepth);
        wayPoints.push(lastWayPoint);
        const exceptDescend = profile.segments.slice(1);

        exceptDescend.forEach((segment, index, source) => {
            const durationMinutes = segment.duration;
            const waypoint = lastWayPoint.toLevel(durationMinutes, segment.endDepth);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return {
            wayPoints: wayPoints,
            ceilings: profile.ceilings,
            events: profile.events
        };
    }

    private static calculateDecompression(plan: Plan, gases: Gas[], options: Options): CalculatedProfile {
        const bGas = gases[0].toGas();
        const bGases = new Gases();
        bGases.addBottomGas(bGas);

        gases.slice(1, gases.length).forEach((gas, index, items) => {
            const decoGas = gas.toGas();
            bGases.addDecoGas(decoGas);
        });

        const segments = new Segments();
        const descentDuration = Time.toSeconds(plan.depth / options.descentSpeed);
        segments.add(0, plan.depth, bGas, descentDuration);
        const bottomTime = Time.toSeconds(plan.duration) - descentDuration;
        segments.addFlat(plan.depth, bGas, bottomTime);

        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, bGases, segments);
        return profile;
    }
}
