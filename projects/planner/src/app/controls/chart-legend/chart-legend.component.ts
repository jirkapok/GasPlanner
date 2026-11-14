import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DurationPipe } from '../../pipes/duration.pipe';
import { UnitConversion } from '../../shared/UnitConversion';
import { ChartLegendValues } from '../../shared/chartLegendValues';
import { ChartLegendColors } from '../../shared/chartPlotter';

/** One line of profile chart values at the hovered time, with samples of the chart lines like in a legend */
@Component({
    selector: 'app-chart-legend',
    templateUrl: './chart-legend.component.html',
    styleUrls: ['./chart-legend.component.scss'],
    imports: [TranslatePipe, DecimalPipe, DurationPipe]
})
export class ChartLegendComponent {
    /** Nothing is shown, but the line keeps its height, if undefined */
    @Input() public values: ChartLegendValues | undefined;
    @Input({ required: true }) public colors!: ChartLegendColors;
    /** Translation key of the profile name shown in front of the values */
    @Input() public labelKey: string | undefined;
    @Input() public showTime = true;

    constructor(private units: UnitConversion) {
    }

    public get lengthUnit(): string {
        return this.units.length;
    }

    public get events(): string {
        return this.values?.events.join(', ') ?? '';
    }
}
