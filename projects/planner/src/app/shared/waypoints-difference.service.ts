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
        if(!this.isCalculated){
            return [];
        }

        const wayPointsACopy = [...this.wayPointsA];
        const wayPointsBCopy = [...this.wayPointsB];
        let waypointA = wayPointsACopy.pop();
        let waypointB = wayPointsBCopy.pop();
        const waypointRows = [];

        while(waypointA || waypointB) {
            const endTimeA = waypointA?.endTime ?? -1;
            const endTimeB = waypointB?.endTime ?? -1;
            const runtime = endTimeA >= endTimeB ? endTimeA : endTimeB;

            const row: WaypointsComparisonTableRow = {
                runTime: runtime,
                durationA: waypointA?.duration,
                depthA: waypointA?.endDepth,
                durationB: waypointB?.duration,
                depthB: waypointB?.endDepth,
            };

            waypointRows.unshift(row);

            if (endTimeA > endTimeB) {
                row.durationB = undefined;
                row.depthB = undefined;
                waypointA = wayPointsACopy.pop();
            } else if (endTimeA < endTimeB) {
                row.durationA = undefined;
                row.depthA = undefined;
                waypointB = wayPointsBCopy.pop();
            } else {
                waypointA = wayPointsACopy.pop();
                waypointB = wayPointsBCopy.pop();
            }
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
