import { Injectable } from '@angular/core';
import { Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { RangeConstants, UnitConversion } from './UnitConversion';

@Injectable()
export class ValidatorGroups {
    constructor(private units: UnitConversion) {
    }

    public get nitroxOxygen(): ValidatorFn[] {
        return this.rangeFor(this.ranges.nitroxOxygen);
    }

    public get trimixOxygen(): ValidatorFn[] {
        return this.rangeFor(this.ranges.trimixOxygen);
    }

    public get trimixHe(): ValidatorFn[] {
        return this.rangeFor(this.ranges.tankHe);
    }

    public get ppO2(): ValidatorFn[] {
        return this.rangeFor(this.ranges.ppO2);
    }

    public get depth(): ValidatorFn[] {
        return this.rangeFor(this.ranges.depth);
    }

    public get duration(): ValidatorFn[] {
        return this.rangeFor(this.ranges.duration);
    }

    public get tankPressure(): ValidatorFn[] {
        return this.rangeFor(this.ranges.tankPressure);
    }

    public get tankSize(): ValidatorFn[] {
        return this.rangeFor(this.ranges.tankSize);
    }

    public get altitude(): ValidatorFn[] {
        return this.rangeFor(this.ranges.altitude);
    }

    public get gradients(): ValidatorFn[] {
        return this.rangeFor([10,100]);
    }

    public get speed(): ValidatorFn[] {
        return this.rangeFor(this.ranges.speed);
    }

    public get lastStopDepth(): ValidatorFn[] {
        return this.rangeFor(this.ranges.lastStopDepth);
    }

    public get gasSwitchDuration(): ValidatorFn[] {
        return this.rangeFor([1,100]);
    }

    public get problemSolvingDuration(): ValidatorFn[] {
        return this.rangeFor([1,100]);
    }

    public get maxEnd(): ValidatorFn[] {
        return this.rangeFor(this.ranges.narcoticDepth);
    }

    public get diverRmv(): ValidatorFn[] {
        return [Validators.required, this.validateMinRmv, this.validateMaxRmv];
    }

    private get ranges(): RangeConstants {
        return this.units.ranges;
    }

    // only these RMV methods needs direct access to the range without component reload
    private validateMinRmv(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.min(this.ranges.diverRmv[0])(control);
    }

    private validateMaxRmv(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.max(this.ranges.diverRmv[1])(control);
    }

    private rangeFor(range: [number, number]): ValidatorFn[] {
        return [Validators.required, Validators.min(range[0]), Validators.max(range[1])];
    }
}
