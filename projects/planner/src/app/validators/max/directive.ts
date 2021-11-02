import { Directive, Input, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

import { max } from './validator';

const MAX_VALIDATOR: any = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => MaxValidator),
    multi: true
};

@Directive({
    selector: '[maxVal][formControlName],[maxVal][formControl],[maxVal][ngModel]',
    providers: [MAX_VALIDATOR]
})
export class MaxValidator implements Validator, OnInit, OnChanges {
    @Input()
    maxVal!: number;

    private validator!: ValidatorFn;
    private onChange!: () => void;

    public ngOnInit(): void {
        this.validator = max(this.maxVal);
    }

    public ngOnChanges(changes: SimpleChanges): void {
        for (const key in changes) {
            if (key === 'max') {
                this.validator = max(changes[key].currentValue);
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
