import { Injectable } from '@angular/core';
import { SwimAction, WayPoint } from './models';
import { DiveResults } from './diveresults';
import {DepthsService} from './depths.service';

@Injectable()
export class StopsFilter {
    public _stopsOnly = false;

    constructor(private dive: DiveResults, private depths: DepthsService) { }

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

        return allWayPoints.filter((item, index) =>
            index < this.depths.startAscentIndex ||
            index === allWayPoints.length - 1 ||
            item.swimAction === SwimAction.hover
        );
    }

    public switchFilter(): void {
        this._stopsOnly = !this._stopsOnly;
    }
}
