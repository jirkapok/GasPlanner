import {WayPoint} from './models';
import {WaypointsComparisonTableRow} from './WaypointsComparisonTableRow';

// TODO: Rework into injectable service that gets data from services instead of constructor
export class WaypointsComparisonTableRowProvider {

    private wayPointsA: WayPoint[];
    private wayPointsB: WayPoint[];
    private _waypointRows: WaypointsComparisonTableRow[] = [];

    constructor(wayPointsA: WayPoint[], wayPointsB: WayPoint[]) {
        this.wayPointsA = wayPointsA;
        this.wayPointsB = wayPointsB;
    }

    public getRows(): WaypointsComparisonTableRow[] {
        const MAX_SAFETY_LIMIT = 65536; // 2**16
        let waypointA: WayPoint | undefined = this.wayPointsA.pop();
        let waypointB: WayPoint | undefined = this.wayPointsB.pop();

        for (let i = 0; i < MAX_SAFETY_LIMIT; i++) {
            let row: WaypointsComparisonTableRow;
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
                waypointA = this.wayPointsA.pop();
                this._waypointRows.unshift(row);
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
                waypointB = this.wayPointsB.pop();
                this._waypointRows.unshift(row);
                continue;
            }

            row = {
                runTime: waypointA!.endTime,
                durationA: waypointA?.duration,
                depthA: waypointA?.endDepth,
                durationB: waypointB?.duration,
                depthB: waypointB?.endDepth,
            };
            waypointA = this.wayPointsA.pop();
            waypointB = this.wayPointsB.pop();
            this._waypointRows.unshift(row);
        }
        return this._waypointRows;
    }
}
