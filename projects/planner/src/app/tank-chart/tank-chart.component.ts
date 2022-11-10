import { Component, Input } from '@angular/core';
import { Tank } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-tankchart',
    templateUrl: './tank-chart.component.html',
    styleUrls: ['./tank-chart.component.css']
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
