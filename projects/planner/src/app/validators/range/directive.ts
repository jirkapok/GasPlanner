import { Directive, Input, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

import { range } from './validator';

const RANGE_VALIDATOR: any = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => RangeValidator),
    multi: true
};

@Directive({
    selector: '[range][formControlName],[range][formControl],[range][ngModel]',
    providers: [RANGE_VALIDATOR]
})
export class RangeValidator implements Validator, OnInit, OnChanges {
    @Input()
    range!: [number,number];

    private validator!: ValidatorFn;
    private onChange!: () => void;

    public ngOnInit(): void {
        this.validator = range(this.range);
    }

    public ngOnChanges(changes: SimpleChanges): void {
        for (const key in changes) {
            if (key === 'range') {
                this.validator = range(changes[key].currentValue);
                if (this.onChange) {
                    this.onChange();
                }
            }
        }
    }

    validate(c: AbstractControl): ValidationErrors | null {
        return this.validator(c);
    }

    registerOnValidatorChange(fn: () => void): void {
        this.onChange = fn;
    }
}
