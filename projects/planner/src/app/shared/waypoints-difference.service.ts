import { WayPoint } from './models';
import { WaypointsComparisonTableRow } from './WaypointsComparisonTableRow';
import { Injectable } from '@angular/core';
import { ProfileComparatorService } from './profileComparatorService';

@Injectable()
export class WaypointsDifferenceService {
    public constructor(private profileComparatorService: ProfileComparatorService) {
    }

    public get isCalculated(): boolean {
        return this.profileComparatorService.bothResultsCalculated;
    }

    public get difference(): WaypointsComparisonTableRow[] {
        const MAX_SAFETY_LIMIT = 65536; // 2**16
        const waypointRows = [];

        if(!this.isCalculated){
            return [];
        }

        const wayPointsACopy = [...this.wayPointsA];
        const wayPointsBCopy = [...this.wayPointsB];
        let waypointA: WayPoint | undefined = wayPointsACopy.pop();
        let waypointB: WayPoint | undefined = wayPointsBCopy.pop();

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
                waypointA = wayPointsACopy.pop();
                waypointRows.unshift(row);
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
                waypointB = wayPointsBCopy.pop();
                waypointRows.unshift(row);
                continue;
            }

            row = {
                runTime: waypointA!.endTime,
                durationA: waypointA?.duration,
                depthA: waypointA?.endDepth,
                durationB: waypointB?.duration,
                depthB: waypointB?.endDepth,
            };
            waypointA = wayPointsACopy.pop();
            waypointB = wayPointsBCopy.pop();
            waypointRows.unshift(row);
        }
        return waypointRows;
    }

    private get wayPointsA(): WayPoint[]{
        return this.profileComparatorService.profileAResults.wayPoints;
    }

    private get wayPointsB(): WayPoint[]{
        return this.profileComparatorService.profileBResults.wayPoints;
    }
}
