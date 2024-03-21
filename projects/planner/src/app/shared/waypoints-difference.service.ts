import { WayPoint } from './models';
import { WaypointsComparisonTableRow } from './WaypointsComparisonTableRow';
import { Injectable } from '@angular/core';
import { ProfileComparatorService } from './profileComparatorService';

class WaypointsDiffContext {
    public waypointA: WayPoint | undefined;
    public waypointB: WayPoint | undefined;
    private readonly defaultTime = -1;
    private _endTimeA = this.defaultTime;
    private _endTimeB = this.defaultTime;

    constructor(private wayPointsA: WayPoint[], private wayPointsB: WayPoint[]) {
        this.updateA();
        this.updateB();
    }

    public get hasNext(): boolean {
        return !!(this.waypointA || this.waypointB);
    }

    private get dominantA(): boolean {
        return this._endTimeA > this._endTimeB;
    }

    private get dominantB(): boolean {
        return this._endTimeB > this._endTimeA;
    }

    public next(): void {
        if (this.dominantA) {
            this.updateA();
        } else if (this.dominantB) {
            this.updateB();
        } else {
            this.updateA();
            this.updateB();
        }
    }

    public toRow(): WaypointsComparisonTableRow {
        const runtime = this.dominantA ? this._endTimeA : this._endTimeB;
        const row: WaypointsComparisonTableRow = {
            runTime: runtime,
            durationA: this.waypointA?.duration,
            depthA: this.waypointA?.endDepth,
            durationB: this.waypointB?.duration,
            depthB: this.waypointB?.endDepth,
        };

        if (this.dominantA) {
            row.durationB = undefined;
            row.depthB = undefined;
        } else if (this.dominantB) {
            row.durationA = undefined;
            row.depthA = undefined;
        }

        return row;
    }

    private updateA(): void {
        this.waypointA = this.wayPointsA.pop();
        this._endTimeA = this.waypointA?.endTime ?? this.defaultTime;
    }

    private updateB(): void {
        this.waypointB = this.wayPointsB.pop();
        this._endTimeB = this.waypointB?.endTime ?? this.defaultTime;
    }
}

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

        const context = new WaypointsDiffContext([...this.wayPointsA], [...this.wayPointsB]);
        const waypointRows = [];

        while(context.hasNext) {
            const row = context.toRow();
            waypointRows.unshift(row);
            context.next();
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
