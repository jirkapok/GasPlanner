import {Component, Input, OnInit} from '@angular/core';
import {TestData} from '../diff.component';
import {faTasks} from '@fortawesome/free-solid-svg-icons';
import {UnitConversion} from '../../shared/UnitConversion';
import {WaypointsComparisonTableRowProvider} from '../../shared/waypointsComparisonTableRowProvider';

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss'],
})
export class WaypointsDifferenceComponent implements OnInit {
    @Input({ required: true }) data!: TestData;
    public tasks = faTasks;
    public tableRowProvider: WaypointsComparisonTableRowProvider =
        new WaypointsComparisonTableRowProvider([], []);

    constructor(public units: UnitConversion) {
    }

    ngOnInit() {
        this.tableRowProvider = new WaypointsComparisonTableRowProvider(this.data.wayPointsA, this.data.wayPointsB);
    }
}
