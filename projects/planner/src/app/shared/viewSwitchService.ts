import { Injectable } from '@angular/core';
import { DiveSchedules } from './dive.schedules';

@Injectable()
export class ViewSwitchService {
    private _isComplex = false;

    /** Consumed gas is shown grouped by gas in liters instead of per tank in bars */
    public consumptionInLiters = false;

    constructor(private schedules: DiveSchedules) {
    }

    public get isComplex(): boolean {
        return this._isComplex;
    }

    public set isComplex(newValue: boolean) {
        // not preventing repetitive updates, because it would block settings reload
        this._isComplex = newValue;
        if (!newValue) {
            this.schedules.setSimple();
        }
    }

    public switchConsumption(): void {
        this.consumptionInLiters = !this.consumptionInLiters;
    }
}
