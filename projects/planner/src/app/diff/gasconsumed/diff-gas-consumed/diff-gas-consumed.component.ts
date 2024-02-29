import {Component} from '@angular/core';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';
import {IConsumedMix, StandardGases} from 'scuba-physics';

interface IMixedTanksForComparison {
    profileA: IConsumedMix;
    profileB: IConsumedMix;
}


@Component({
    selector: 'app-diff-gas-consumed',
    templateUrl: './diff-gas-consumed.component.html',
    styleUrls: ['./diff-gas-consumed.component.scss', '../../diff.component.scss']
})
export class GasConsumedDifferenceComponent {
    public icon = faSlidersH;

    constructor(public profileComparatorService: ProfileComparatorService) {
    }

    public get getMixedTanks(): IMixedTanksForComparison[] {
        const mixedTanks: IMixedTanksForComparison[] = [];

        const emptyTank: IConsumedMix = {
            gas: StandardGases.air.copy(),
            total: 0,
            consumed: 0,
            reserve: 0
        };

        for (const tankA of this.profileComparatorService.profileACombinedTanks) {
            const tankB: IConsumedMix | undefined = this.profileComparatorService.profileBCombinedTanks
                .find(t => t.gas.contentCode() === tankA.gas.contentCode());
            if (tankB === undefined) {
                emptyTank.gas = tankA.gas.copy();
            }
            mixedTanks.push({ profileA: tankA, profileB: tankB ?? emptyTank });
        }

        for (const tankB of this.profileComparatorService.profileBCombinedTanks) {
            if (!mixedTanks.find(mt => mt.profileB?.gas.contentCode() === tankB.gas.contentCode()
            )){
                emptyTank.gas = tankB.gas.copy();
                mixedTanks.push({ profileA: emptyTank, profileB: tankB });
            }
        }

        return mixedTanks;
    }
}
