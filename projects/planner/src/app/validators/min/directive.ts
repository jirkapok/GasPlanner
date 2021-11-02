import { Directive, Input, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

import { min } from './validator';

const MIN_VALIDATOR: any = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => MinValidator),
    multi: true
};

@Directive({
    selector: '[minVal][formControlName],[minVal][formControl],[minVal][ngModel]',
    providers: [MIN_VALIDATOR]
})
export class MinValidator implements Validator, OnInit, OnChanges {
    @Input()
    minVal!: number;

    private validator!: ValidatorFn;
    private onChange!: () => void;

    public ngOnInit(): void {
        this.validator = min(this.minVal);
    }

    public ngOnChanges(changes: SimpleChanges): void {
        for (const key in changes) {
            if (key === 'minVal') {
                this.validator = min(changes[key].currentValue);
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
