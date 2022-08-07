import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OptionDefaults } from 'scuba-physics';

@Component({
    selector: 'app-gradients',
    templateUrl: './gradients.component.html',
    styleUrls: ['./gradients.component.css']
})
export class GradientsComponent {
    @Input()
    public simple = false;
    @Output()
    public gfLowChange = new EventEmitter<number>();
    @Output()
    public gfHighChange = new EventEmitter<number>();

    public readonly lowName = 'Low (45/95)';
    public readonly mediumName = 'Medium (40/85)';
    public readonly highName = 'High (30/75)';
    // The string is changed only inside of this component
    public _conservatism = this.mediumName;

    private _gfLow = OptionDefaults.gfLow;
    private _gfHigh = OptionDefaults.gfHigh;

    @Input()
    public get gfLow(): number {
        return this._gfLow;
    }

    @Input()
    public get gfHigh(): number {
        return this._gfHigh;
    }

    public get conservatism(): string {
        return this._conservatism;
    }

    public get plannedGfHigh(): number {
        return this.gfHigh * 100;
    }

    public get plannedGfLow(): number {
        return this.gfLow * 100;
    }

    public set plannedGfHigh(newValue: number) {
        this.gfHigh = newValue / 100;
    }

    public set plannedGfLow(newValue: number) {
        this.gfLow = newValue / 100;
    }

    public set gfHigh(newValue: number) {
        this._gfHigh = newValue;
        this.gfHighChange.emit(this._gfHigh);
    }

    public set gfLow(newValue: number) {
        this._gfLow = newValue;
        this.gfLowChange.emit(this._gfLow);
    }

    public lowConservatism(): void {
        this._conservatism = this.lowName;
        this.gfLow = 0.45;
        this.gfHigh = 0.95;
    }

    public mediumConservatism(): void {
        this._conservatism = this.mediumName;
        this.gfLow = OptionDefaults.gfLow;
        this.gfHigh = OptionDefaults.gfHigh;
    }

    public highConservatism(): void {
        this._conservatism = this.highName;
        this.gfLow = 0.30;
        this.gfHigh = 0.75;
    }
}
