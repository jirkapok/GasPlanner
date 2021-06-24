import { MaxValidator } from './max/directive';
import { max } from './max/validator';
import { MinValidator } from './min/directive';
import { min } from './min/validator';
import { RangeValidator } from './range/directive';
import { range } from './range/validator';

import { NgModule } from '@angular/core';

export const CustomValidators = {
    max,
    min,
    range,
};

const CustomDirectives = [
    MaxValidator,
    MinValidator,
    RangeValidator,
];

@NgModule({
    declarations: [CustomDirectives],
    exports: [CustomDirectives]
})
export class CustomFormsModule { }
