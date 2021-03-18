import { Component, Input } from '@angular/core';
import { Tank } from 'scuba-physics';

@Component({
    selector: 'app-tankchart',
    templateUrl: './tank-chart.component.html',
    styleUrls: ['./tank-chart.component.css']
})
export class TankChartComponent {
    @Input()
    public tank: Tank = Tank.createDefault();

    constructor() { }
}
