import { Component } from '@angular/core';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { GasesComparisonService, IMixedTanksForComparison } from '../../../shared/gases-comparison.service';

@Component({
    selector: 'app-diff-gas-consumed',
    templateUrl: './diff-gas-consumed.component.html',
    styleUrls: ['./diff-gas-consumed.component.scss', '../../diff.component.scss']
})
export class GasConsumedDifferenceComponent {
    public icon = faSlidersH;

    constructor(public gasesDiff: GasesComparisonService) {
    }

    public get gasesDifference(): IMixedTanksForComparison[] {
        return this.gasesDiff.gasesDifference;
    }
}
