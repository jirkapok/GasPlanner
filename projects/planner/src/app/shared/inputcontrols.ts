import { AbstractControl } from '@angular/forms';

export class InputControls {
    public static isControlInvalid(control: AbstractControl | null | undefined): boolean {
        return !!control && control.invalid && (control.dirty || control.touched);
    }
}
