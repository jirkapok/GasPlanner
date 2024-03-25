import { Injectable } from '@angular/core';
import { ProfileComparatorService } from './profileComparatorService';
import { Gas, IConsumedMix } from 'scuba-physics';
import { UnitConversion } from '../UnitConversion';

/** Everything in respective units */
export interface IConsumedByProfile {
    /**
     * Sum of all tanks total amount of gas in respective units
     */
    total: number;
    /**
     * Sum of all tanks consumed amount of gas in respective units
     */
    consumed: number;
    /**
     * Sum of all tanks reserve amount of gas in respective units
     */
    reserve: number;
}

export class ConsumedGasDifference {
    /** half into middle */
    private fiftyPercent = 50;

    constructor(
        public gas: Gas,
        public profileA: IConsumedByProfile,
        public profileB: IConsumedByProfile) {
    }

    public get remainingProfileA(): number {
        return  this.profileA.total - this.profileA.consumed;
    }

    public get remainingProfileB(): number {
        return  this.profileB.total - this.profileB.consumed;
    }

    public get gasRemainingDifference(): number {
        return this.remainingProfileA - this.remainingProfileB;
    }

    public get absoluteRemainingDifference(): number {
        return Math.abs(this.gasRemainingDifference);
    }

    public get gasReserveDifference(): number {
        return this.profileA.reserve - this.profileB.reserve;
    }

    public get absoluteReserveDifference(): number {
        return Math.abs(this.gasReserveDifference);
    }

    public get reserveRight(): boolean {
        return this.gasReserveDifference > 0;
    }

    public get remainingRight(): boolean {
        return this.gasRemainingDifference > 0;
    }

    public get gasRemainingPercentageDifference(): number {
        const totalGasRemaining = this.remainingProfileA + this.remainingProfileB;

        if (totalGasRemaining === 0) {
            return 0;
        }

        const profileAPercentage = this.remainingProfileA / totalGasRemaining;
        const profileBPercentage = this.remainingProfileB / totalGasRemaining;
        return Math.abs(profileAPercentage - profileBPercentage) * this.fiftyPercent;
    }

    public get gasReservePercentageDifference(): number {
        const totalReserve = this.profileA.reserve + this.profileB.reserve;

        if (totalReserve === 0) {
            return 0;
        }

        const profileAPercentage = this.profileA.reserve / totalReserve;
        const profileBPercentage = this.profileB.reserve / totalReserve;
        return Math.abs(profileAPercentage - profileBPercentage) * this.fiftyPercent;
    }
}

@Injectable()
export class GasesComparisonService {
    constructor(private units: UnitConversion, private profileDiff: ProfileComparatorService) {
    }

    public get gasesDifference(): ConsumedGasDifference[] {
        const mixedTanks: ConsumedGasDifference[] = [];

        const emptyConsumption: IConsumedByProfile = {
            total: 0,
            consumed: 0,
            reserve: 0
        };

        for (const consumedA of this.profileDiff.profileAConsumed) {
            const consumedB: IConsumedMix | undefined = this.profileDiff.profileBConsumed
                .find(t => t.gas.contentCode() === consumedA.gas.contentCode());

            const profileB = consumedB ? this.toProfileConsumed(consumedB) : emptyConsumption;
            const newGas = new ConsumedGasDifference(consumedA.gas,
                this.toProfileConsumed(consumedA), profileB);
            mixedTanks.push(newGas);
        }

        for (const consumedB of this.profileDiff.profileBConsumed) {
            if (!mixedTanks.find(mt => mt.gas.contentCode() === consumedB.gas.contentCode())) {
                const newGas = new ConsumedGasDifference(consumedB.gas, emptyConsumption,
                    this.toProfileConsumed(consumedB));
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
