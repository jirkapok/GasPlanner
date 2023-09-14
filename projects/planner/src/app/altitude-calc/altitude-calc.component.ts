import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { UnitConversion } from '../shared/UnitConversion';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
@Component({
    selector: 'app-altitude-calc',
    templateUrl: './altitude-calc.component.html',
    styleUrls: ['./altitude-calc.component.scss']
})
export class AltitudeCalcComponent {
    public calcIcon = faCalculator;

    constructor(
        public units: UnitConversion,
        public location: Location) {}

    // TODO Implement altitude calculator
}
