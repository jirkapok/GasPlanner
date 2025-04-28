import { Component, Input } from '@angular/core';
import { UnitConversion } from '../../../../shared/UnitConversion';
import { StandardGases } from 'scuba-physics';
import { faArrowLeft, faArrowRight, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ProfileComparatorService } from '../../../../shared/diff/profileComparatorService';
import { ConsumedGasDifference } from '../../../../shared/diff/gases-comparison.service';

@Component({
    selector: 'app-diff-gas-consumed-tank-chart',
    templateUrl: './diff-gas-consumed-tank-chart.component.html',
    styleUrl: './diff-gas-consumed-tank-chart.component.scss',
    standalone: false
})
export class GasConsumedDifferenceTankComponent {
    @Input({required: true})
    public gasDiff = new ConsumedGasDifference(
            StandardGases.air.copy(),
            {
                total: 0,
                consumed: 0,
                reserve: 0
            },
            {
                total: 0,
                consumed: 0,
                reserve: 0
            });

    @Input()
    public collapsed = false;

    public faArrowLeft = faArrowLeft;
    public faArrowRight = faArrowRight;
    public faMinus = faMinus;

    constructor(public units: UnitConversion, public profileDiff: ProfileComparatorService) { }

    public get gasName(): string {
        return this.gasDiff.gas.name;
    }
    public get gasTotalProfileA(): number {
        return this.gasDiff.profileA.total;
    }

    public get gasTotalProfileB(): number {
        return this.gasDiff.profileB.total;
    }

    public get gasReserveProfileA(): number {
        return this.gasDiff.profileA.reserve;
    }

    public get gasReserveProfileB(): number {
        return this.gasDiff.profileB.reserve;
    }
}
