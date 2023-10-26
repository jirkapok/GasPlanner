import {Injectable} from '@angular/core';
import {TankBound} from './models';
import {Tank, GasBlender } from 'scuba-physics';
import {UnitConversion} from './UnitConversion';

@Injectable()
export class RedundanciesService {
    private readonly _firstTank: TankBound;
    private readonly _secondTank: TankBound;

    constructor(private units: UnitConversion) {
        this._firstTank = new TankBound(Tank.createDefault(), this.units);
        this._secondTank = new TankBound(Tank.createDefault(), this.units);
    }
    public get firstTank(): TankBound {
        return this._firstTank;
    }

    public get secondTank(): TankBound {
        return this._secondTank;
    }

    public get finalPressure(): number {
        // TODO recalculate the results by each tank working pressure
        // e.g. we probably cant use BoundTank
        return 0; //GasBlender.redundancies(this.firstTank, this.secondTank);
    }
}
