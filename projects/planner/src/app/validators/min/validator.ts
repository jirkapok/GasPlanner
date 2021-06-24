import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../lang';

export const min = (value: number): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
    if (!isPresent(value)) {
        return null;
    }
    if (isPresent(Validators.required(control))) {
        return null;
    }

    const v: number = +control.value;
    return v >= +value ? null : { min: { value: value } };
};
