import { WayPoint, Plan } from './models';
import { BuhlmannAlgorithm, Gas as BGas, Options, Gases,
     Segments, Event, CalculatedProfile, Segment, EventType, ProfileEvents,
     Ceiling, Time, Tank } from 'scuba-physics';

export class Profile {
    constructor(
        public wayPoints: WayPoint[],
        public ceilings: Ceiling[],
        public events: Event[]
        ) {}

    public static newEmpty(errors: Event[]): Profile {
        return new Profile([], [], errors);
    }
}

export class WayPointsService {
    public static calculateWayPoints(plan: Plan, gases: Tank[], options: Options): Profile {
        const wayPoints = [];
        const profile = this.calculateDecompression(plan, gases, options);

        // not propagated to the UI
        if (profile.errors.length > 0) {
            return Profile.newEmpty(profile.errors);
        }

        const events = ProfileEvents.fromProfile(profile.segments, options);

        const descent = profile.segments[0];
        let lastWayPoint = WayPoint.fromSegment(descent);
        wayPoints.push(lastWayPoint);
        const exceptDescend = profile.segments.slice(1);

        exceptDescend.forEach((segment, index, source) => {
            const waypoint = this.toWayPoint(segment, lastWayPoint, events.items);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return new Profile(wayPoints, profile.ceilings, events.items);
    }

    private static toWayPoint(segment: Segment, lastWayPoint: WayPoint, events: Event[]): WayPoint {
        const waypoint = lastWayPoint.toLevel(segment);
        const hasSwitch = events.find(x => x.type === EventType.gasSwitch && waypoint.fits(x.timeStamp));

        if (hasSwitch) {
            waypoint.asGasSwitch();
        }

        return waypoint;
    }

    private static calculateDecompression(plan: Plan, gases: Tank[], options: Options): CalculatedProfile {
        const bGases = new Gases();
        const bGas = gases[0].gas;
        bGases.addBottomGas(bGas);

        // everything except first gas is considered as deco gas
        gases.slice(1, gases.length).forEach((gas, index, items) => {
            const decoGas = gas.gas;
            bGases.addDecoGas(decoGas);
        });

        const segments = new Segments();
        const descentDuration = WayPointsService.descentDuration(plan, options);
        segments.add(0, plan.depth, bGas, descentDuration);
        let bottomTime = Time.toSeconds(plan.duration) - descentDuration;
        // not enough time to descent
        bottomTime = bottomTime < 0 ? 0 : bottomTime;
        segments.addFlat(plan.depth, bGas, bottomTime);

        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, bGases, segments);
        return profile;
    }

    // TODO multilevel diving: fix minimum duration based on required descent/ascent time
    public static descentDuration(plan: Plan, options: Options) {
        return Time.toSeconds(plan.depth / options.descentSpeed);
    }
}
