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

    /** In m.a.s.l */
    @Input()
    public altitude = 0;

    private metricLevels = [0, 300, 800, 1500];
    private imperialLevels = [0, 1000, 2600, 5000];

    constructor(public units: UnitConversion) { }

    public get altitudeBound(): number {
        return this.units.fromMeters(this.altitude);
    }

    public get smallHill(): string  {
        return this.levelLabel(1);
    }

    public get mountains(): string  {
        return this.levelLabel(2);
    }

    public get highMountains(): string  {
        return this.levelLabel(3);
    }

    public set altitudeBound(newValue: number) {
        this.altitude = this.units.toMeters(newValue);
        this.altitudeChange.emit(this.altitude);
    }

    public seaLevel(): void {
        this.setLevel(0);
    }

    public setHill(): void {
        this.setLevel(1);
    }

    public setMountains(): void {
        this.setLevel(2);
    }

    // we don't change the values for imperial units here
    // simply lets fit closes rounded value
    public setHighMountains(): void {
        this.setLevel(3);
    }

    private setLevel(index: number): void {
        const level = this.selectLevels()[index];
        this.altitudeBound = level;
        this.inputChange.emit();
    }

    private levelLabel(index: number): string {
        const level = this.selectLevels()[index];
        return `${level} ${this.units.altitude}`;
    }

    private selectLevels(): number[] {
        if(this.units.imperialUnits) {
            return this.imperialLevels;
        }

        return this.metricLevels;
    }
}
