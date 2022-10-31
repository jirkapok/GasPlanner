import { AbstractControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

export class InputControls {
    public static controlInValid(control: AbstractControl): boolean {
        return control.invalid && (control.dirty || control.touched);
    }

    public static formatNumber(numberPipe: DecimalPipe, value: number): string | null {
        return numberPipe.transform(value, '1.0-1');
    }
}
