import {Component, Input} from '@angular/core';
import {DecimalPipe, NgIf} from '@angular/common';
import {GasToxicity, Tank} from 'scuba-physics';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import {UnitConversion} from '../../../../shared/UnitConversion';

@Component({
    selector: 'app-diff-gas-consumed-tank-chart',
    templateUrl: './diff-gas-consumed-tank-chart.component.html',
    styleUrl: './diff-gas-consumed-tank-chart.component.scss'
})
export class GasConsumedDifferenceTankComponent {
    @Input()
    public tank: Tank = Tank.createDefault();
    @Input()
    public toxicity = new GasToxicity();
    @Input()
    public collapsed = false;

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
