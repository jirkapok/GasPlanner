import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UnitConversion } from '../../../../shared/UnitConversion';
import { StandardGases } from 'scuba-physics';
import { faArrowLeft, faArrowRight, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ProfileComparatorService } from '../../../../shared/diff/profileComparatorService';
import { IConsumedGasDifference } from '../../../../shared/diff/gases-comparison.service';

@Component({
    selector: 'app-diff-gas-consumed-tank-chart',
    templateUrl: './diff-gas-consumed-tank-chart.component.html',
    styleUrl: './diff-gas-consumed-tank-chart.component.scss'
})
export class GasConsumedDifferenceTankComponent implements OnChanges{
    @Input({required: true})
    public gasDiff: IConsumedGasDifference = {
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

    private profileAGasRemaining = this.gasDiff.profileA.total - this.gasDiff.profileA.consumed;
    private profileBGasRemaining = this.gasDiff.profileB.total - this.gasDiff.profileB.consumed;

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

    public get gasRemainingProfileA(): number {
        return this.profileAGasRemaining;
    }

    public get gasRemainingProfileB(): number {
        return this.profileBGasRemaining;
    }

    public get gasReserveProfileA(): number {
        return this.gasDiff.profileA.reserve;
    }

    public get gasReserveProfileB(): number {
        return this.gasDiff.profileB.reserve;
    }

    public get gasRemainingDifference(): number {
        return this.profileAGasRemaining - this.profileBGasRemaining;
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
        const totalGasRemaining = this.profileAGasRemaining + this.profileBGasRemaining;

        if (totalGasRemaining === 0) {
            return 0;
        }

        const profileAPercentage = this.profileAGasRemaining / totalGasRemaining;
        const profileBPercentage = this.profileBGasRemaining / totalGasRemaining;
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

    public ngOnChanges(changes: SimpleChanges) {
        if (changes.profileDiff || changes.profileBCombinedGas) {
            this.profileAGasRemaining = this.gasDiff.profileA.total - this.gasDiff.profileA.consumed;
            this.profileBGasRemaining = this.gasDiff.profileB.total - this.gasDiff.profileB.consumed;
        }
    }
}
