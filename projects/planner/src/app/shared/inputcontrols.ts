import { AbstractControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable()
export class InputControls {

    constructor(private numberPipe: DecimalPipe) {}

    public controlInValid(control: AbstractControl | undefined): boolean {
        return !!control && control.invalid && (control.dirty || control.touched);
    }

    public formatNumber(value: number, decimals: number = 1): string | null {
        return this.numberPipe.transform(value, `1.0-${decimals}`);
    }
}
