import { WayPoint, Plan, Gas } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options, Gases,
     Segments, Event, CalculatedProfile, Segment, EventType } from 'scuba-physics';
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

        if (profile.errorMessages.length > 0) {
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
            const waypoint = this.toWayPoint(segment, lastWayPoint, profile.events);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return {
            wayPoints: wayPoints,
            ceilings: profile.ceilings,
            events: profile.events
        };
    }

    private static toWayPoint(segment: Segment, lastWayPoint: WayPoint, events: Event[]): WayPoint {
        const waypoint = lastWayPoint.toLevel(segment.duration, segment.endDepth);
        const hasSwitch = events.find(x => x.type === EventType.gasSwitch && waypoint.fits(x.timeStamp));

        if (hasSwitch) {
            waypoint.asGasSwitch();
        }

        return waypoint;
    }

    private static calculateDecompression(plan: Plan, gases: Gas[], options: Options): CalculatedProfile {
        const bGases = new Gases();
        const bGas = gases[0].toGas();
        bGases.addBottomGas(bGas);

        // everything except first gas is considered as deco gas
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
