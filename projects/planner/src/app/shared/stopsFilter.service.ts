import { Injectable } from '@angular/core';
import { SwimAction, WayPoint } from './models';
import { PlannerService } from './planner.service';
import { Plan } from './plan.service';

@Injectable()
export class StopsFilter {
    public _stopsOnly = false;

    constructor(private planner: PlannerService, private plan: Plan) { }

    public get stopsOnly(): boolean {
        return this._stopsOnly;
    }

    public get totalDuration(): number {
        return this.planner.dive.totalDuration;
    }

    public get profileCalculated(): boolean {
        return this.planner.dive.profileCalculated;
    }

    public get wayPoints(): WayPoint[] {
        const allWayPoints = this.planner.dive.wayPoints;

        if(!this.stopsOnly) {
            return allWayPoints;
        }

        return allWayPoints.filter((item, index) =>
            index < this.plan.startAscentIndex ||
            index === allWayPoints.length - 1 ||
            item.swimAction === SwimAction.hover
        );
    }

    public switchFilter(): void {
        this._stopsOnly = !this._stopsOnly;
    }
}
