import { Injectable } from '@angular/core';
import { DiveResults } from './diveresults';
import { DiveSchedules } from './dive.schedules';
import { WayPoint, SwimAction } from './wayPoint';

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

        const depths = this.schedules.selectedDepths;
        return allWayPoints.filter((item, index) =>
            index < depths.startAscentIndex ||     // all user defined waypoints
            index === allWayPoints.length - 1 ||   // ascent to surface
            (item.swimAction === SwimAction.hover || item.swimAction === SwimAction.switch)  // all stops
        );
    }

    private get dive(): DiveResults {
        return this.schedules.selectedResult;
    }

    public switchFilter(): void {
        this._stopsOnly = !this._stopsOnly;
    }
}
