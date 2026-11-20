import { AbstractControl } from '@angular/forms';
import { FieldState } from '@angular/forms/signals';

// A signal form field where we don't care about the value, only the state
type SignalFieldState =
    Pick<FieldState<unknown>, 'invalid' | 'dirty' | 'touched'>;

export class InputControls {
    /** For reactive forms */
    public static isControlInvalid(control: AbstractControl | null | undefined): boolean {
        return !!control && control.invalid && (control.dirty || control.touched);
    }

    /** For signal forms */
    public static isFieldInvalid(field: SignalFieldState | null | undefined): boolean {
        return !!field && field.invalid() && (field.dirty() || field.touched());
    }
}
