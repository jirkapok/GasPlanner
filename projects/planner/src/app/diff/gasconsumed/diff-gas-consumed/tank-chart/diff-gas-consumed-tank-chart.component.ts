import { Component, Input } from '@angular/core';
import { UnitConversion } from '../../../../shared/UnitConversion';
import { StandardGases } from 'scuba-physics';
import { faArrowLeft, faArrowRight, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ProfileComparatorService } from '../../../../shared/diff/profileComparatorService';
import { ConsumedGasDifference } from '../../../../shared/diff/gases-comparison.service';

@Component({
    selector: 'app-diff-gas-consumed-tank-chart',
    templateUrl: './diff-gas-consumed-tank-chart.component.html',
    styleUrl: './diff-gas-consumed-tank-chart.component.scss'
})
export class GasConsumedDifferenceTankComponent {
    @Input({required: true})
    public gasDiff: ConsumedGasDifference = {
            gas: StandardGases.air.copy(),
            profileA: {
                total: 0,
                consumed: 0,
                reserve: 0
            },
            profileB: {
                total: 0,
                consumed: 0,
                reserve: 0
            }
        };

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

    public get remainingProfileA(): number {
        return  this.gasDiff.profileA.total - this.gasDiff.profileA.consumed;
    }

    public get remainingProfileB(): number {
        return  this.gasDiff.profileB.total - this.gasDiff.profileB.consumed;
    }

    public get gasReserveProfileA(): number {
        return this.gasDiff.profileA.reserve;
    }

    public get gasReserveProfileB(): number {
        return this.gasDiff.profileB.reserve;
    }

    public get gasRemainingDifference(): number {
        return this.remainingProfileA - this.remainingProfileB;
    }

    public get absoluteRemainingDifference(): number {
        return Math.abs(this.gasRemainingDifference);
    }
    public get gasReserveDifference(): number {
        return this.gasDiff.profileA.reserve - this.gasDiff.profileB.reserve;
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
        return Math.abs(profileAPercentage - profileBPercentage) * 50; // half into middle
    }

    public get gasReservePercentageDifference(): number {
        const totalReserve = this.gasDiff.profileA.reserve + this.gasDiff.profileB.reserve;

        if (totalReserve === 0) {
            return 0;
        }

        const profileAPercentage = this.gasDiff.profileA.reserve / totalReserve;
        const profileBPercentage = this.gasDiff.profileB.reserve / totalReserve;
        return Math.abs(profileAPercentage - profileBPercentage) * 50; // half into middle
    }
}
