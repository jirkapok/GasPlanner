import { Injectable } from '@angular/core';
import { Validators, ValidatorFn } from '@angular/forms';
import { RangeConstants, UnitConversion } from './UnitConversion';

@Injectable({
    providedIn: 'root'
})
export class ValidatorGroups {
    constructor(private units: UnitConversion) {
    }

    public get nitroxOxygen(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.nitroxOxygen[0]), Validators.max(this.ranges.nitroxOxygen[1])];
    }

    public get ppO2(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.ppO2[0]), Validators.max(this.ranges.ppO2[1])];
    }

    public get depth(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])];
    }

    public get duration(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])];
    }

    public get tankPressure(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])];
    }

    public get diverRmv(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.diverRmv[0]), Validators.max(this.ranges.diverRmv[1])];
    }

    public get tankSize(): ValidatorFn[] {
        return [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])];
    }

    public get altitude(): ValidatorFn[] {
        return [Validators.required, Validators.min(ranges.altitude[0]), Validators.max(ranges.altitude[1])];
    }



    private get ranges(): RangeConstants {
        return this.units.ranges;
    }
}
