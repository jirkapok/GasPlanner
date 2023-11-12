import { Injectable } from '@angular/core';
import { SwimAction, WayPoint } from './models';
import { DiveResults } from './diveresults';
import { DiveSchedules } from './dive.schedules';

@Injectable()
export class StopsFilter {
    public _stopsOnly = false;

    constructor(private schedules: DiveSchedules) { }

    public get stopsOnly(): boolean {
        return this._stopsOnly;
    }

    public get totalDuration(): number {
        return this.dive.totalDuration;
    }

    public get profileCalculated(): boolean {
        return this.dive.profileCalculated;
    }
    public get wayPoints(): WayPoint[] {
        const allWayPoints = this.dive.wayPoints;

        if(!this.stopsOnly) {
            return allWayPoints;
        }

        const depths = this.schedules.selected.depths;
        return allWayPoints.filter((item, index) =>
            index < depths.startAscentIndex ||
            index === allWayPoints.length - 1 ||
            item.swimAction === SwimAction.hover
        );
    }

    private get dive(): DiveResults {
        return this.schedules.selected.diveResult;
    }

    public switchFilter(): void {
        this._stopsOnly = !this._stopsOnly;
    }
}
