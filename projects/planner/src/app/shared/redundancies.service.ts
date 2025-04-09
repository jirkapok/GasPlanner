import { Injectable } from '@angular/core';
import { ITankSize, TankBound } from './models';
import { Tank, GasBlender } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';

@Injectable()
export class RedundanciesService {
    private readonly _firstTank: TankBound;
    private readonly _secondTank: TankBound;

    constructor(private units: UnitConversion) {
        this._firstTank = new TankBound(Tank.createDefault(), this.units);
        this._secondTank = new TankBound(Tank.createDefault(), this.units);
    }
    public get firstTank(): ITankSize {
        return this._firstTank;
    }

    public get secondTank(): ITankSize {
        return this._secondTank;
    }

    public get finalPressure(): number {
        const tankA= this._firstTank.tank;
        const tankB= this._secondTank.tank;
        let result = GasBlender.redundancies(tankA, tankB);
        result = this.units.fromBar(result);
        return result;
    }
}
