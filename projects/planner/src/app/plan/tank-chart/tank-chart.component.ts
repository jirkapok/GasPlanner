import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { GasToxicity } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
import { TankBound } from '../../shared/models';
import { NgClass } from '@angular/common';
import { LocaleNumberPipe } from '../../pipes/locale-number.pipe';
import { GaslabelComponent } from '../../controls/gaslabel/gaslabel.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-tankchart',
    templateUrl: './tank-chart.component.html',
    styleUrls: ['./tank-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [GaslabelComponent, NgClass, LocaleNumberPipe, TranslatePipe]
})
export class TankChartComponent {
    @Input({ required: true })
    public tank!: TankBound;
    @Input()
    public toxicity = new GasToxicity();
    @Input()
    public showId = false;

    constructor(public units: UnitConversion) { }

    public get endPressure(): number {
        return this.tank.endPressure;
    }

    public get startPressure(): number {
        return this.tank.startPressure;
    }

    public get reserve(): number {
        return this.tank.reserve;
    }
}
