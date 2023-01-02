import { Injectable } from '@angular/core';
import { Validators, ValidatorFn } from '@angular/forms';
import { RangeConstants, UnitConversion } from './UnitConversion';

@Injectable({
    providedIn: 'root'
})
export class ValidatorGroups {
    constructor(private units: UnitConversion) {
    }

    public get oxygen(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.nitroxOxygen[0]), Validators.max(this.ranges.nitroxOxygen[1])];
    }

    public get ppO2(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.ppO2[0]), Validators.max(this.ranges.ppO2[1])];
    }

    public get depth(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])];
    }

    private get ranges(): RangeConstants {
        return this.units.ranges;
    }
}
