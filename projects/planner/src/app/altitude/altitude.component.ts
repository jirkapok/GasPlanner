import { Component, Input } from '@angular/core';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-altitude',
    templateUrl: './altitude.component.html',
    styleUrls: ['./altitude.component.css']
})
export class AltitudeComponent {
    @Input()
    public plannedAltitude = 0;

    constructor(public units: UnitConversion) { }
}
