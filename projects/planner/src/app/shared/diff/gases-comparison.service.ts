import { Injectable } from '@angular/core';
import { ProfileComparatorService } from './profileComparatorService';
import { Gas, IConsumedMix } from 'scuba-physics';
import { UnitConversion } from "../UnitConversion";

// TODO rebind to the respective units, currently all values are in liters

/** Everything in respective units */
export interface IConsumedByProfile {
    total: number;
    /**
     * Sum of all tanks consumed amount of gas in liters
     */
    consumed: number;
    /**
     * Sum of all tanks reserve amount of gas in liters
     */
    reserve: number;
}

export interface IConsumedGasDifference {
    gas: Gas;
    profileA: IConsumedByProfile;
    profileB: IConsumedByProfile;
}

// TODO merge GasesComparisonService to ProfileComparatorService
@Injectable()
export class GasesComparisonService {
    constructor(private units: UnitConversion, private profileDiff: ProfileComparatorService) {
    }

    public get gasesDifference(): IConsumedGasDifference[] {
        const mixedTanks: IConsumedGasDifference[] = [];

        const emptyConsumption: IConsumedByProfile = {
            total: 0,
            consumed: 0,
            reserve: 0
        };

        for (const consumedA of this.profileDiff.profileAConsumed) {
            const consumedB: IConsumedMix | undefined = this.profileDiff.profileBConsumed
                .find(t => t.gas.contentCode() === consumedA.gas.contentCode());

            const profileB = consumedB ? this.toProfileConsumed(consumedB) : emptyConsumption;
            const newGas = {
                gas: consumedA.gas,
                profileA: this.toProfileConsumed(consumedA),
                profileB: profileB
            };
            mixedTanks.push(newGas);
        }

        for (const consumedB of this.profileDiff.profileBConsumed) {
            if (!mixedTanks.find(mt => mt.gas.contentCode() === consumedB.gas.contentCode())) {
                const newGas = {
                    gas: consumedB.gas,
                    profileA: emptyConsumption,
                    profileB: this.toProfileConsumed(consumedB)
                };
                mixedTanks.push(newGas);
            }
        }

        return mixedTanks;
    }

    private toProfileConsumed(source: IConsumedMix): IConsumedByProfile {
        return {
            total: this.units.fromLiter(source.total),
            consumed: this.units.fromLiter(source.consumed),
            reserve: this.units.fromLiter(source.reserve)
        };
    }
}
