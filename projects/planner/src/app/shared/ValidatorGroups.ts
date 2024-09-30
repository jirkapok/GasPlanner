import { Injectable } from '@angular/core';
import { Validators, ValidatorFn, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { RangeConstants, UnitConversion } from './UnitConversion';
import { DateFormats } from './formaters';

@Injectable()
export class ValidatorGroups {
    public static readonly minGradient = 10;
    public static readonly maxGradient = 120;

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

    /**
     * Special use case in complex view, where makes sense allow 0 m or 0 ft as minimum depth
     * to allow user custom ascent to the surface.
     */
    public get depthFromSurface(): ValidatorFn[] {
        return this.rangeFor([0, this.ranges.depth[1]]);
    }

    public get duration(): ValidatorFn[] {
        return this.rangeFor(this.ranges.duration);
    }

    public get tankConsumed(): ValidatorFn[] {
        return this.rangeFor(this.ranges.consumed);
    }

    public get tankSize(): ValidatorFn[] {
        return this.rangeFor(this.ranges.tankSize);
    }

    public get altitude(): ValidatorFn[] {
        return this.rangeFor(this.ranges.altitude);
    }

    public get gradients(): ValidatorFn[] {
        return this.rangeFor([ValidatorGroups.minGradient,ValidatorGroups.maxGradient]);
    }

    public get speed(): ValidatorFn[] {
        return this.rangeFor(this.ranges.speed);
    }

    public get lastStopDepth(): ValidatorFn[] {
        return this.rangeFor(this.ranges.lastStopDepth);
    }

    /** Duration in minutes 1-100 */
    public get duration100(): ValidatorFn[] {
        return this.rangeFor([1,100]);
    }

    public get maxEnd(): ValidatorFn[] {
        return this.rangeFor(this.ranges.narcoticDepth);
    }

    // dynamic validation
    public get diverRmv(): ValidatorFn[] {
        return [Validators.required, this.validateMinRmv, this.validateMaxRmv];
    }

    // dynamic validation
    public get maxDensity(): ValidatorFn[] {
        return [Validators.required, this.validateMinDensity, this.validateMaxDensity];
    }

    // dynamic validation
    public get tankPressure(): ValidatorFn[] {
        return [Validators.required, this.validateMinPressure, this.validateMaxPressure];
    }

    private get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public rangeFor(range: [number, number]): ValidatorFn[] {
        return [Validators.required, Validators.min(range[0]), Validators.max(range[1])];
    }

    public surfaceInterval(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const field = control as FormControl<string | null>;
            const value = field?.value;
            const parsed = DateFormats.parseToShortTime(value);

            if(value !== null && (value.length === 0 || !parsed)) {
                return {
                    surfaceInterval: true
                };
            }

            return null;
        };
    }

    // only these methods needs direct access to the range without component reload
    private validateMinRmv(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.min(this.ranges.diverRmv[0])(control);
    }

    private validateMaxRmv(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.max(this.ranges.diverRmv[1])(control);
    }

    private validateMinDensity(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.min(this.ranges.maxDensity[0])(control);
    }

    private validateMaxDensity(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.max(this.ranges.maxDensity[1])(control);
    }

    private validateMinPressure(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.min(this.ranges.tankPressure[0])(control);
    }

    private validateMaxPressure(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => Validators.max(this.ranges.tankPressure[1])(control);
    }
}
