import { EventEmitter, Injectable, Input, Output } from '@angular/core';
import { Time } from 'scuba-physics';
import { WayPoint } from './models';
import { PlannerService } from './planner.service';

@Injectable()
export class SelectedWaypoint {
    @Output() public selectedChanged = new EventEmitter<WayPoint>();
    private lastSelected: WayPoint | undefined;

    constructor(private plannerService: PlannerService) {}

    @Input()
    public set selectedTimeStamp(newValue: string) {
        let found: WayPoint | undefined;
        if (newValue) {
            const newTimeStamp = Time.secondsFromDate(newValue);
            found = this.plannerService.dive.wayPoints.find(p => p.fits(newTimeStamp));
        }

        this.selected = found;
    }

    @Input()
    public set selected(point: WayPoint | undefined) {
        if (this.lastSelected) {
            this.lastSelected.selected = false;
        }

        this.lastSelected = point;

        if (point) {
            if (this.lastSelected) {
                this.lastSelected.selected = true;
            }
        }

        this.selectedChanged.emit(this.lastSelected);
    }
}
