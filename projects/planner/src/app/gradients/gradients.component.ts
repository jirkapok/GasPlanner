import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OptionDefaults } from 'scuba-physics';
import { StandardGradientsService } from '../shared/standard-gradients.service';

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
    public standards = new StandardGradientsService();
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
        return this.standards.labelFor(this.gfLow, this.gfHigh);
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
        this.applyStandards(this.standards.lowName);
    }

    public mediumConservatism(): void {
        this.applyStandards(this.standards.mediumName);
    }

    public highConservatism(): void {
        this.applyStandards(this.standards.highName);
    }

    private applyStandards(label: string): void  {
        const toApply = this.standards.get(label);
        this.gfLow = toApply.gfLow;
        this.gfHigh = toApply.gfHeigh;
    }
}
