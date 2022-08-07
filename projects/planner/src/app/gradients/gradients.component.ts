import { Component, Input } from '@angular/core';
import { OptionDefaults } from 'scuba-physics';

@Component({
    selector: 'app-gradients',
    templateUrl: './gradients.component.html',
    styleUrls: ['./gradients.component.css']
})
export class GradientsComponent {
    @Input()
    public gfLow = OptionDefaults.gfLow;
    @Input()
    public gfHigh = OptionDefaults.gfHigh;
    @Input()
    public simple = false;

    public readonly lowName = 'Low (45/95)';
    public readonly mediumName = 'Medium (40/85)';
    public readonly highName = 'High (30/75)';
    public conservatism = this.mediumName;


    constructor() { }
    // TODO fix the string when GF values change outside of this component

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

    public lowConservatism(): void {
        this.conservatism = this.lowName;
        this.plannedGfLow = 45;
        this.plannedGfHigh = 95;
    }

    public mediumConservatism(): void {
        this.conservatism = this.mediumName;
        this.gfLow = OptionDefaults.gfLow;
        this.gfHigh = OptionDefaults.gfHigh;
    }

    public highConservatism(): void {
        this.conservatism = this.highName;
        this.plannedGfLow = 30;
        this.plannedGfHigh = 75;
    }
}
