import { Injectable } from '@angular/core';
import { ProfileComparatorService } from './profileComparatorService';
import { IConsumedMix, StandardGases } from 'scuba-physics';

// TODO rebind to the respective units, currently all values are in liters
export interface IMixedTanksForComparison {
    profileA: IConsumedMix;
    profileB: IConsumedMix;
}

@Injectable()
export class GasesComparisonService {
    constructor(private profileDiff: ProfileComparatorService) {
    }

    public get gasesDifference(): IMixedTanksForComparison[] {
        const mixedTanks: IMixedTanksForComparison[] = [];

        const emptyTank: IConsumedMix = {
            gas: StandardGases.air.copy(),
            total: 0,
            consumed: 0,
            reserve: 0
        };

        for (const tankA of this.profileDiff.profileACombinedTanks) {
            const tankB: IConsumedMix | undefined = this.profileDiff.profileBCombinedTanks
                .find(t => t.gas.contentCode() === tankA.gas.contentCode());
            if (tankB === undefined) {
                emptyTank.gas = tankA.gas.copy();
            }
            mixedTanks.push({profileA: tankA, profileB: tankB ?? emptyTank});
        }

        for (const tankB of this.profileDiff.profileBCombinedTanks) {
            if (!mixedTanks.find(mt => mt.profileB?.gas.contentCode() === tankB.gas.contentCode()
            )) {
                emptyTank.gas = tankB.gas.copy();
                mixedTanks.push({profileA: emptyTank, profileB: tankB});
            }
        }

        return mixedTanks;
    }
}
