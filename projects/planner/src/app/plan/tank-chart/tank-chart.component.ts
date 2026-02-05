import { Component, Input } from '@angular/core';
import { Tank, GasToxicity } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
import { NgClass, DecimalPipe } from '@angular/common';
import { GaslabelComponent } from '../../controls/gaslabel/gaslabel.component';

@Component({
    selector: 'app-tankchart',
    templateUrl: './tank-chart.component.html',
    styleUrls: ['./tank-chart.component.scss'],
    imports: [GaslabelComponent, NgClass, DecimalPipe]
})
export class TankChartComponent {
    @Input()
    public tank: Tank = Tank.createDefault();
    @Input()
    public toxicity = new GasToxicity();
    @Input()
    public showId = false;

    constructor(public units: UnitConversion) {}

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
