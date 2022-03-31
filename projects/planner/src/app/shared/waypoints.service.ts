import { WayPoint, Plan } from './models';
import {
    BuhlmannAlgorithm, Options, Gases,
    Segments, Segment, Event, CalculatedProfile,
    EventType, ProfileEvents, Ceiling, Tank
} from 'scuba-physics';

export class Profile {
    constructor(
        public origin: Segment[],
        public wayPoints: WayPoint[],
        public ceilings: Ceiling[],
        public events: Event[]
    ) { }

    public static newEmpty(errors: Event[]): Profile {
        return new Profile([], [], [], errors);
    }

    public get endsOnSurface(): boolean {
        const count = this.wayPoints.length;
        return count > 0 && this.wayPoints[count - 1].endDepth === 0;
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

        const startAscentIndex = plan.startAscentIndex;
        const events = ProfileEvents.fromProfile(startAscentIndex, profile.segments, profile.ceilings, options);
        const descent = profile.segments[0];
        let lastWayPoint = WayPoint.fromSegment(descent);
        wayPoints.push(lastWayPoint);
        const exceptDescend = profile.segments.slice(1);

        exceptDescend.forEach((segment) => {
            const waypoint = this.toWayPoint(segment, lastWayPoint, events.items);
            lastWayPoint = waypoint;
            wayPoints.push(waypoint);
        });

        return new Profile(profile.segments, wayPoints, profile.ceilings, events.items);
    }

    private static toWayPoint(segment: Segment, lastWayPoint: WayPoint, events: Event[]): WayPoint {
        const waypoint = lastWayPoint.toLevel(segment);
        const hasSwitch = events.find(x => x.type === EventType.gasSwitch && waypoint.fits(x.timeStamp));

        if (hasSwitch) {
            waypoint.asGasSwitch();
        }

        return waypoint;
    }


    private static calculateDecompression(plan: Plan, tanks: Tank[], options: Options): CalculatedProfile {
        const gases = Gases.fromTanks(tanks);

        const segments: Segments = plan.copySegments();
        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, gases, segments);
        return profile;
    }
}

