import {Component, Input, OnInit} from '@angular/core';
import {TestData} from '../diff.component';
import {faTasks} from '@fortawesome/free-solid-svg-icons';
import {WayPoint} from '../../shared/models';
import {UnitConversion} from '../../shared/UnitConversion';
import {WaypointsTableRow} from '../../shared/WaypointsTableRow';

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss'],
})
export class WaypointsDifferenceComponent implements OnInit {
    @Input({ required: true }) data!: TestData;
    public tasks = faTasks;
    public waypointRows: WaypointsTableRow[] = [];
    constructor(public units: UnitConversion) {}

    ngOnInit(): void {
        const MAX_SAFETY_LIMIT = 65536; // 2**16
        let waypointA: WayPoint | undefined = this.data.wayPointsA.pop();
        let waypointB: WayPoint | undefined = this.data.wayPointsB.pop();

        for (let i = 0; i < MAX_SAFETY_LIMIT; i++) {
            let row: WaypointsTableRow;
            if (waypointA === undefined && waypointB === undefined) {
                break;
            }

            if ((waypointA?.endTime || -1) > (waypointB?.endTime || -1)) {
                row = {
                    runTime: waypointA!.endTime,
                    durationA: waypointA?.duration,
                    depthA: waypointA?.endDepth,
                    durationB: undefined,
                    depthB: undefined,
                };
                waypointA = this.data.wayPointsA.pop();
                this.waypointRows.unshift(row);
                continue;
            }

            if ((waypointA?.endTime || -1) < (waypointB?.endTime || -1)) {
                row = {
                    runTime: waypointB!.endTime,
                    durationA: undefined,
                    depthA: undefined,
                    durationB: waypointB?.duration,
                    depthB: waypointB?.endDepth,
                };
                waypointB = this.data.wayPointsB.pop();
                this.waypointRows.unshift(row);
                continue;
            }

            row = {
                runTime: waypointA!.endTime,
                durationA: waypointA?.duration,
                depthA: waypointA?.endDepth,
                durationB: waypointB?.duration,
                depthB: waypointB?.endDepth,
            };
            waypointA = this.data.wayPointsA.pop();
            waypointB = this.data.wayPointsB.pop();
            this.waypointRows.unshift(row);
        }
    }
}
