import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-altitude',
    templateUrl: './altitude.component.html',
    styleUrls: ['./altitude.component.css']
})
export class AltitudeComponent {
    @Output()
    public altitudeChange = new EventEmitter<number>();

    private _altitude = 0;

    constructor(public units: UnitConversion) { }

    @Input()
    public get altitude(): number {
        return this._altitude;
    }

    public set altitude(newValue: number) {
        this._altitude = newValue;
        this.altitudeChange.emit(this._altitude);
    }
}
