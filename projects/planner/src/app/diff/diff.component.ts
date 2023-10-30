import { Component } from '@angular/core';
import { WayPointsService } from '../shared/waypoints.service';
import { UnitConversion } from '../shared/UnitConversion';
import {
    Ceiling, Segments, StandardGases,
    Tank, Time, Event
} from 'scuba-physics';
import { WayPoint } from '../shared/models';
import { ViewSwitchService } from '../shared/viewSwitchService';


class TestData {
    public readonly profileA: WayPoint[];
    public readonly tanksA: Tank[];

    public readonly profileB: WayPoint[];
    public readonly tanksB: Tank[];

    constructor() {
        const units = new UnitConversion();
        const waypointService = new WayPointsService(units);

        this.tanksA = [
            new Tank(24, 200, 21),
            new Tank(11, 200, 50),
            new Tank(11, 150, 100),
        ];
        this.tanksA[0].consumed = 120;
        this.tanksA[1].consumed = 80;
        this.tanksA[2].consumed = 60;

        const segmentsA = new Segments();
        segmentsA.add(0, 40, StandardGases.air, Time.oneMinute * 2);
        segmentsA.add(40, 40, StandardGases.air, Time.oneMinute * 10);
        segmentsA.add(40, 21, StandardGases.air, Time.oneMinute * 2);
        segmentsA.add(21, 21, StandardGases.ean50, Time.oneMinute);
        segmentsA.add(21, 3, StandardGases.ean50, Time.oneMinute * 3);
        segmentsA.add(3, 3, StandardGases.oxygen, Time.oneMinute * 6);
        segmentsA.add(3, 0, StandardGases.oxygen, Time.oneMinute);
        this.profileA = waypointService.calculateWayPoints(segmentsA.items);

        this.tanksB = [
            new Tank(24, 200, 21),
            new Tank(11, 200, 50)
        ];
        this.tanksB[0].consumed = 90;
        this.tanksB[1].consumed = 40;

        const segmentsB = new Segments();
        segmentsB.add(0, 30, StandardGases.air, Time.oneMinute * 4);
        segmentsB.add(30, 30, StandardGases.air, Time.oneMinute * 10);
        segmentsB.add(30, 15, StandardGases.air, Time.oneMinute * 3);
        segmentsB.add(15, 15, StandardGases.ean50, Time.oneMinute);
        segmentsB.add(15, 0, StandardGases.ean50, Time.oneMinute * 2);
        this.profileB = waypointService.calculateWayPoints(segmentsB.items);
    }
}

@Component({
    selector: 'app-diff',
    templateUrl: './diff.component.html',
    styleUrls: ['./diff.component.scss']
})
export class DiffComponent {
    public data = new TestData();
}
