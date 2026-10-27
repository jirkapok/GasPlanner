import { EventEmitter, Injectable, Input, Output, signal } from '@angular/core';
import { DiveSchedules } from './dive.schedules';
import { DateFormats } from './formaters';
import { WayPoint } from './wayPoint';

@Injectable()
export class SelectedWaypoint {
    @Output() public selectedChanged = new EventEmitter<WayPoint | undefined>();
    // selected by hovering the profile chart, while the way points table shows it
    private readonly _lastSelected = signal<WayPoint | undefined>(undefined);

    constructor(private schedules: DiveSchedules) {}

    @Input()
    public set selectedTimeStamp(newValue: string) {
        let found: WayPoint | undefined;
        if (newValue) {
            const newTimeStamp = DateFormats.secondsFromDate(newValue);
            const dive = this.schedules.selected.diveResult;
            found = dive.wayPoints.find(p => p.fits(newTimeStamp));
        }

        this.selected = found;
    }

    @Input()
    public set selected(point: WayPoint | undefined) {
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

    public isSelected(point: WayPoint): boolean {
        return this._lastSelected() === point;
    }
}
