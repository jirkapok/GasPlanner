import { WayPoint, Plan } from './models';
import {
    Segment, Event, CalculatedProfile,
    Ceiling, Events
} from 'scuba-physics';

export class Profile {
    constructor(
        public origin: Segment[],
        public wayPoints: WayPoint[],
        public ceilings: Ceiling[],
        public events: Event[]
    ) { }

    public get endsOnSurface(): boolean {
        const count = this.wayPoints.length;
        return count > 0 && this.wayPoints[count - 1].endDepth === 0;
    }

    public static newEmpty(errors: Event[]): Profile {
        return new Profile([], [], [], errors);
    }
}

export class WayPointsService {
    public static calculateWayPoints(profile: CalculatedProfile, events: Events): Profile {
        const wayPoints = [];
        // const profile: CalculatedProfile = this.calculateDecompression(segments, gases, options);

        // not propagated to the UI
        if (profile.errors.length > 0) {
            return Profile.newEmpty(profile.errors);
            console.table(profile.errors);
        }

        const descent = profile.segments[0];
        let lastWayPoint = WayPoint.fromSegment(descent);
        let lastSegment = descent;
        wayPoints.push(lastWayPoint);
        const exceptDescend = profile.segments.slice(1);

        exceptDescend.forEach((segment) => {
            const waypoint = this.toWayPoint(segment, lastWayPoint, lastSegment);
            lastWayPoint = waypoint;
            lastSegment = segment;
            wayPoints.push(waypoint);
        });

        return new Profile(profile.segments, wayPoints, profile.ceilings, events.items);
    }

    private static toWayPoint(segment: Segment, lastWayPoint: WayPoint, lastSegment: Segment): WayPoint {
        const waypoint = lastWayPoint.toLevel(segment);
        const hasSwitch = !segment.gas.compositionEquals(lastSegment.gas);

        if (hasSwitch) {
            waypoint.asGasSwitch();
        }

        return waypoint;
    }
}

