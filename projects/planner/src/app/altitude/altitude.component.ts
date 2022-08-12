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

    @Output()
    public inputChange = new EventEmitter();

    private _altitude = 0;

    constructor(public units: UnitConversion) { }

    @Input()
    public get altitude(): number {
        return this._altitude;
    }

    // TODO calculate by units
    public get smallHill(): string  {
        return '300 m.a.s.l';
    }

    public get mountains(): string  {
        return '800 m.a.s.l';
    }

    public get highMountains(): string  {
        return '1500 m.a.s.l';
    }

    public set altitude(newValue: number) {
        this._altitude = newValue;
        this.altitudeChange.emit(this._altitude);
    }

    public setHighMountains(): void {
        this.setLevel(1500);
    }

    public setMountains(): void {
        this.setLevel(800);
    }

    public setHill(): void {
        this.setLevel(300);
    }

    public seaLevel(): void {
        this.setLevel(0);
    }

    private setLevel(latitude: number): void {
        this.altitude = latitude;
        // TODO doesn't refresh the options before they are applied
    }
}
