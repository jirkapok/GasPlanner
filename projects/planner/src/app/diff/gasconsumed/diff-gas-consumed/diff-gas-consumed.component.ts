import { Component, ChangeDetectionStrategy } from '@angular/core';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { GasesComparisonService, ConsumedGasDifference } from '../../../shared/diff/gases-comparison.service';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { GasConsumedDifferenceTankComponent } from './tank-chart/diff-gas-consumed-tank-chart.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-diff-gas-consumed',
    templateUrl: './diff-gas-consumed.component.html',
    styleUrls: ['./diff-gas-consumed.component.scss', '../../diff.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, GasConsumedDifferenceTankComponent, TranslatePipe]
})
export class GasConsumedDifferenceComponent {
    public icon = faSlidersH;

    constructor(public profileDif: ProfileComparatorService, public gasesDiff: GasesComparisonService) {
    }

    public get gasesDifference(): ConsumedGasDifference[] {
        return this.gasesDiff.gasesDifference;
    }
}
