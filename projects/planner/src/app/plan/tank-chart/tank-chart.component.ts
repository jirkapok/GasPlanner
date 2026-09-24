import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Tank, GasToxicity } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
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
    @Input()
    public tank: Tank = Tank.createDefault();
    @Input()
    public toxicity = new GasToxicity();
    @Input()
    public showId = false;

    constructor(public units: UnitConversion) { }

    // for the charts we don't need to convert the value
    // since they are used as percentage
    public get endPressure(): number {
        return this.units.fromBar(this.tank.endPressure);
    }

    public get startPressure(): number {
        return this.units.fromBar(this.tank.startPressure);
    }

    public get reserve(): number {
        return this.units.fromBar(this.tank.reserve);
    }
}
