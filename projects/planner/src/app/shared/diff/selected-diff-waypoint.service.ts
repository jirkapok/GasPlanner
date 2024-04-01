import { EventEmitter, Injectable, Input, Output } from '@angular/core';
import { DateFormats } from '../formaters';
import { ComparedWaypoint } from './ComparedWaypoint';
import { ProfileComparatorService } from './profileComparatorService';

@Injectable()
export class SelectedDiffWaypoint {
    @Output() public selectedChanged = new EventEmitter<ComparedWaypoint>();
    private lastSelected: ComparedWaypoint | undefined;

    constructor(private profilesDiff: ProfileComparatorService) {
    }

    @Input()
    public set selectedTimeStamp(newValue: string) {
        let found: ComparedWaypoint | undefined;
        if (newValue) {
            const newTimeStamp = DateFormats.secondsFromDate(newValue);
            const wayPoints = this.profilesDiff.difference;
            found = wayPoints.find(p => p.fits(newTimeStamp));
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
