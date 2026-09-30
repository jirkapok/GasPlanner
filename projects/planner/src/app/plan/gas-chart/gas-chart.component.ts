import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ConsumedGas, StandardGases } from 'scuba-physics';
import { TranslatePipe } from '@ngx-translate/core';
import { UnitConversion } from '../../shared/UnitConversion';
import { LocaleNumberPipe } from '../../pipes/locale-number.pipe';

@Component({
    selector: 'app-gaschart',
    templateUrl: './gas-chart.component.html',
    styleUrls: ['../tank-chart/tank-chart.component.scss', './gas-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, LocaleNumberPipe, TranslatePipe]
})
export class GasChartComponent {
    @Input()
    public consumed = new ConsumedGas(StandardGases.air.copy(), 0, 0, 0);

    constructor(public units: UnitConversion) { }

    public get reserve(): number {
        return this.units.fromLiter(this.consumed.reserve);
    }

    public get consumedVolume(): number {
        return this.units.fromLiter(this.consumed.consumed);
    }

    public get available(): number {
        return this.units.fromLiter(this.consumed.total);
    }
}
