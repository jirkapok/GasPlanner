import { Component } from '@angular/core';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { GasesComparisonService, ConsumedGasDifference } from '../../../shared/diff/gases-comparison.service';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { GasConsumedDifferenceTankComponent } from './tank-chart/diff-gas-consumed-tank-chart.component';

@Component({
    selector: 'app-diff-gas-consumed',
    templateUrl: './diff-gas-consumed.component.html',
    styleUrls: ['./diff-gas-consumed.component.scss', '../../diff.component.scss'],
    imports: [FaIconComponent, GasConsumedDifferenceTankComponent]
})
export class GasConsumedDifferenceComponent {
    public icon = faSlidersH;

    constructor(
        public profileDif: ProfileComparatorService,
        public gasesDiff: GasesComparisonService
    ) {}

    public get gasesDifference(): ConsumedGasDifference[] {
        return this.gasesDiff.gasesDifference;
    }
}
