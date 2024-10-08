import {
    Segment, StandardGases
} from 'scuba-physics';
import { WayPointsService } from './waypoints.service';
import { UnitConversion } from './UnitConversion';
import { WayPoint } from './wayPoint';

export class TestBedExtensions {
    public static sampleWayPoints(): WayPoint[] {
        const segments: Segment[] = [
            new Segment(0,30, StandardGases.air, 102),
            new Segment(30,30, StandardGases.air, 618),
            new Segment(30,12, StandardGases.air, 120),
            new Segment(12,6, StandardGases.air, 60),
            new Segment(6,3, StandardGases.air, 60),
            new Segment(3,3, StandardGases.air, 180),
            new Segment(3,0, StandardGases.air, 60),
        ];
        const wayPoints = new WayPointsService(new UnitConversion());
        const result = wayPoints.calculateWayPoints(segments);
        return result;
    }
}
