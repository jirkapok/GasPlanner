import {Component, Input, OnInit} from '@angular/core';
import {TestData} from '../diff.component';
import {faTasks} from '@fortawesome/free-solid-svg-icons';
import {WayPoint} from '../../shared/models';
import {UnitConversion} from '../../shared/UnitConversion';

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss']
})
export class WaypointsDifferenceComponent {
    @Input({required: true}) data!: TestData;
    public tasks = faTasks;
    public waypointRows: WaypointsTableRow[] = [];
    constructor(
        public units: UnitConversion
    ) {
    }

    public wayPointsOfProfileA(): WayPoint[] {
        return this.data.profileA.wayPoints;
    }

    public wayPointsOfProfileB(): WayPoint[] {
        return this.data.profileB.wayPoints;
    }

    public lengthOfLargestProfile(): number[]  {
        if (this.wayPointsOfProfileA().length > this.wayPointsOfProfileB().length) {
            return Array.from({ length: this.wayPointsOfProfileA().length },
                (_, index) => index + 1);
        }

        return Array.from({ length: this.wayPointsOfProfileB().length },
            (_, index) => index + 1);
    }

}

interface WaypointsTableRow {
    runTime: number;
    depthA: number | undefined;
    durationA: number | undefined;
    depthB: number | undefined;
    durationB: number | undefined;
}
