import { Injectable, signal } from '@angular/core';
import { DiveSchedules } from './dive.schedules';

/** Switches are kept in signals, because components not hosting the switch show different content based on them */
@Injectable()
export class ViewSwitchService {
    private readonly _consumptionInLiters = signal(false);
    private readonly _isComplex = signal(false);
    private readonly _showBailoutProfile = signal(false);

    constructor(private schedules: DiveSchedules) {
    }

    /** Consumed gas is shown grouped by gas in liters instead of per tank in bars */
    public get consumptionInLiters(): boolean {
        return this._consumptionInLiters();
    }

    public get isComplex(): boolean {
        return this._isComplex();
    }

    /** Rebreather dives show the bailout profile (emergency ascent) instead of the dive profile */
    public get showBailoutProfile(): boolean {
        return this._showBailoutProfile();
    }

    public set showBailoutProfile(newValue: boolean) {
        this._showBailoutProfile.set(newValue);
    }

    public set consumptionInLiters(newValue: boolean) {
        this._consumptionInLiters.set(newValue);
    }

    public set isComplex(newValue: boolean) {
        // not preventing repetitive updates, because it would block settings reload
        this._isComplex.set(newValue);
        if (!newValue) {
            this.schedules.setSimple();
        }
    }

    public switchConsumption(): void {
        this.consumptionInLiters = !this.consumptionInLiters;
    }
}
