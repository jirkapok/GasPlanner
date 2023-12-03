import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DiveSchedules } from './dive.schedules';

@Injectable()
export class ViewSwitchService {
    private _isComplex = false;

    constructor(private schedules: DiveSchedules) {
    }

    public get isComplex(): boolean {
        return this._isComplex;
    }

    public set isComplex(newValue: boolean) {
        // not preventing repetitive updates, because it would block settings reload
        this._isComplex = newValue;
        if (!newValue) {
            this.resetToSimple();
        }
    }

    /* reset only gas and depths to values valid for simple view. */
    private resetToSimple(): void {
        // TODO since the switch is global, we need to switch all dives => and also recalculate all
        const selectedDive = this.schedules.selected;
        selectedDive.optionsService.resetToSimple();
        selectedDive.tanksService.resetToSimple();
        selectedDive.depths.setSimple();
    }
}
