import { EventEmitter, Injectable, Input, Output } from '@angular/core';
import { DiveSchedules } from '../dive.schedules';
import { DateFormats } from '../formaters';
import { ComparedWaypoint } from './ComparedWaypoint';

@Injectable()
export class SelectedDiffWaypoint {
    @Output() public selectedChanged = new EventEmitter<ComparedWaypoint>();
    private lastSelected: ComparedWaypoint | undefined;

    constructor(private schedules: DiveSchedules) {
    }

    @Input()
    public set selectedTimeStamp(newValue: string) {
        let found: ComparedWaypoint | undefined;
        if (newValue) {
            const newTimeStamp = DateFormats.secondsFromDate(newValue);
            const dive = this.schedules.selected.diveResult;
            // found = dive.wayPoints.find(p => p.fits(newTimeStamp));
        }

        this.selected = found;
    }

    @Input()
    public set selected(point: ComparedWaypoint | undefined) {
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
