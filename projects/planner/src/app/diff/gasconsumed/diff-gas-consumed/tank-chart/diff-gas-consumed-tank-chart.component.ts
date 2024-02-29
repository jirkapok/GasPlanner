import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {UnitConversion} from '../../../../shared/UnitConversion';
import {IConsumedMix, StandardGases} from 'scuba-physics';

@Component({
    selector: 'app-diff-gas-consumed-tank-chart',
    templateUrl: './diff-gas-consumed-tank-chart.component.html',
    styleUrl: './diff-gas-consumed-tank-chart.component.scss'
})
export class GasConsumedDifferenceTankComponent implements OnChanges{
    @Input({required: true})
    public profileACombinedGas: IConsumedMix = {
            gas: StandardGases.air.copy(),
            total: 0,
            consumed: 0,
            reserve: 0
        };
    @Input({required: true})
    public profileBCombinedGas: IConsumedMix = {
            gas: StandardGases.air.copy(),
            total: 0,
            consumed: 0,
            reserve: 0
        };
    @Input()
    public collapsed = false;

    private profileAGasRemaining = this.profileACombinedGas.total - this.profileACombinedGas.consumed;
    private profileBGasRemaining = this.profileBCombinedGas.total - this.profileBCombinedGas.consumed;

    constructor(public units: UnitConversion) { }

    public get gasName(): string {
        return this.profileACombinedGas.gas.name;
    }
    public get gasTotalProfileA(): number {
        return this.units.fromLiter(this.profileACombinedGas.total);
    }

    public get gasTotalProfileB(): number {
        return this.units.fromLiter(this.profileBCombinedGas.total);
    }

    public get gasRemainingProfileA(): number {
        return this.units.fromLiter(this.profileAGasRemaining);
    }

    public get gasRemainingProfileB(): number {
        return this.units.fromLiter(this.profileBGasRemaining);
    }

    public get gasReserveProfileA(): number {
        return this.units.fromLiter(this.profileACombinedGas.reserve);
    }

    public get gasReserveProfileB(): number {
        return this.units.fromLiter(this.profileBCombinedGas.reserve);
    }

    public get gasRemainingDifference(): number {
        return this.units.fromLiter(this.profileAGasRemaining - this.profileBGasRemaining);
    }
    public get gasReserveDifference(): number {
        return this.units.fromLiter(this.profileACombinedGas.reserve - this.profileBCombinedGas.reserve);
    }

    public get gasRemainingPercentageDifference(): number {
        const totalGasRemaining = this.profileAGasRemaining + this.profileBGasRemaining;

        if (totalGasRemaining === 0) {
            return 0;
        }

        const profileAPercentage = this.profileAGasRemaining / totalGasRemaining;
        const profileBPercentage = this.profileBGasRemaining / totalGasRemaining;
        return Math.abs(profileAPercentage - profileBPercentage) * 50;
    }

    public get gasReservePercentageDifference(): number {
        const totalReserve = this.profileACombinedGas.reserve + this.profileBCombinedGas.reserve;

        if (totalReserve === 0) {
            return 0;
        }

        const profileAPercentage = this.profileACombinedGas.reserve / totalReserve;
        const profileBPercentage = this.profileBCombinedGas.reserve / totalReserve;
        return Math.abs(profileAPercentage - profileBPercentage) * 50;
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.profileACombinedGas || changes.profileBCombinedGas) {
            this.profileAGasRemaining = this.profileACombinedGas.total - this.profileACombinedGas.consumed;
            this.profileBGasRemaining = this.profileBCombinedGas.total - this.profileBCombinedGas.consumed;
        }
    }

    protected readonly Math = Math;
}
