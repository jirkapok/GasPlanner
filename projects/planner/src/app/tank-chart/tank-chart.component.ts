import { Component, Input } from '@angular/core';
import { Tank } from 'scuba-physics';
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
    public showId = false;

    constructor(public units: UnitConversion) { }
}
