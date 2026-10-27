import { EventEmitter, Injectable, Input, Output, signal } from '@angular/core';
import { DateFormats } from '../formaters';
import { ComparedWaypoint } from './ComparedWaypoint';
import { ProfileComparatorService } from './profileComparatorService';

@Injectable()
export class SelectedDiffWaypoint {
    @Output() public selectedChanged = new EventEmitter<ComparedWaypoint | undefined>();
    // selected by hovering the profile chart, while the way points table shows it
    private readonly _lastSelected = signal<ComparedWaypoint | undefined>(undefined);

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
        const lastSelected = this._lastSelected();
        if (lastSelected) {
            lastSelected.selected = false;
        }

        if (point) {
            point.selected = true;
        }

        this._lastSelected.set(point);
        this.selectedChanged.emit(point);
    }

    public isSelected(point: ComparedWaypoint): boolean {
        return this._lastSelected() === point;
    }
}
