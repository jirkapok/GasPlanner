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
export class WaypointsDifferenceComponent implements OnInit {
    @Input({required: true}) data!: TestData;
    public tasks = faTasks;
    public waypointRows: WaypointsTableRow[] = [];
    constructor(
        public units: UnitConversion
    ) {
    }

    ngOnInit(): void {
        const MAX_SAFETY_LIMIT = 65536; // 2**16
        let waypointA: WayPoint | undefined = this.data.profileA.wayPoints.pop();
        let waypointB: WayPoint | undefined = this.data.profileB.wayPoints.pop();

        for(let i = 0; i < MAX_SAFETY_LIMIT; i++) {
            let row: WaypointsTableRow;
            if(waypointA === undefined && waypointB === undefined){
                break;
            }

            if((waypointA?.endTime || -1) > (waypointB?.endTime || -1)){
                row = {
                    runTime: waypointA!.endTime,
                    durationA: waypointA?.duration,
                    depthA: waypointA?.endDepth,
                    durationB: undefined,
                    depthB: undefined
                };
                waypointA = this.data.profileA.wayPoints.pop();
                this.waypointRows.unshift(row);
                continue;
            }

            if((waypointA?.endTime || -1) < (waypointB?.endTime || -1)) {
                row = {
                    runTime: waypointB!.endTime,
                    durationA: undefined,
                    depthA: undefined,
                    durationB: waypointB?.duration,
                    depthB: waypointB?.endDepth
                };
                waypointB = this.data.profileB.wayPoints.pop();
                this.waypointRows.unshift(row);
                continue;
            }


            row = {
                runTime: waypointA!.endTime,
                durationA: waypointA?.duration,
                depthA: waypointA?.endDepth,
                durationB: waypointB?.duration,
                depthB: waypointB?.endDepth
            };
            waypointA = this.data.profileA.wayPoints.pop();
            waypointB = this.data.profileB.wayPoints.pop();
            this.waypointRows.unshift(row);
        }
        console.log(this.waypointRows);
    }

}

interface WaypointsTableRow {
    runTime: number;
    depthA: number | undefined;
    durationA: number | undefined;
    depthB: number | undefined;
    durationB: number | undefined;
}
