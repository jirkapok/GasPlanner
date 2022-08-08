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

    private _gfLow = OptionDefaults.gfLow;
    private _gfHigh = OptionDefaults.gfHigh;

    // TODO move to Options service
    private gfMap = new Map<string, [number, number]>();

    constructor() {
        this.gfMap.set(this.lowName, [0.45, 0.95]);
        this.gfMap.set(this.mediumName, [OptionDefaults.gfLow, OptionDefaults.gfHigh]);
        this.gfMap.set(this.highName, [0.30, 0.75]);
    }

    @Input()
    public get gfLow(): number {
        return this._gfLow;
    }

    @Input()
    public get gfHigh(): number {
        return this._gfHigh;
    }

    public get conservatism(): string {
        for (const key of this.gfMap.keys()) {
            const entry = this.gfMap.get(key) || [0,0];
            if(entry[0] === this.gfLow && entry[1] === this.gfHigh) {
                return key;
            }
        }

        return `${this.gfLow}/${this.gfHigh}`;
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
        this.gfLow = 0.45;
        this.gfHigh = 0.95;
    }

    public mediumConservatism(): void {
        this.gfLow = OptionDefaults.gfLow;
        this.gfHigh = OptionDefaults.gfHigh;
    }

    public highConservatism(): void {
        this.gfLow = 0.30;
        this.gfHigh = 0.75;
    }
}
