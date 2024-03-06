import { Injectable } from '@angular/core';
import { GasBlender, MixRequest, MixResult, Tank } from 'scuba-physics';
import { TankBound } from './models';
import { UnitConversion } from './UnitConversion';

@Injectable()
export class GasBlenderService {
    private readonly _sourceTank: TankBound;
    private readonly _topMix: TankBound;
    private readonly _targetTank: TankBound;
    private results!: MixResult;

    constructor(private units: UnitConversion) {
        this._sourceTank = new TankBound(Tank.createDefault(), this.units);
        this._sourceTank.startPressure = 0;
        // TODO move percents from tank new BoundGas
        this._topMix = new TankBound(Tank.createDefault(), this.units);
        this._topMix.assignStandardGas('EAN32');
        this._targetTank = new TankBound(Tank.createDefault(), this.units);
        this._targetTank.assignStandardGas('EAN32');
        this.calculate();
    }

    public get sourceTank(): TankBound {
        return this._sourceTank;
    }

    public get topMix(): TankBound {
        return this._topMix;
    }

    public get targetTank(): TankBound {
        return this._targetTank;
    }

    public get addO2(): number {
        return this.results.addO2 * 100;
    }

    public get addHe(): number {
        return this.results.addHe * 100;
    }

    public get addTop(): number {
        return this.results.addTop;
    }

    public get removeFromSource(): number {
        return this.results.removeFromSource;
    }

    public get needsRemove(): boolean {
        return this.removeFromSource > 0;
    }

    // TODO apply, when any field changes
    public calculate(): void {
        // to avoid percents conversion to fraction
        const sourceMetric = this._sourceTank.tank;
        const targetMetric = this.targetTank.tank;
        const topMetric = this.topMix.tank;

        const request: MixRequest = {
            source: {
                pressure: sourceMetric.startPressure,
                o2: sourceMetric.gas.fO2,
                he: sourceMetric.gas.fHe
            },
            target: {
                pressure: targetMetric.startPressure,
                o2: targetMetric.gas.fO2,
                he: targetMetric.gas.fHe
            },
            topMix: {
                o2: topMetric.gas.fO2,
                he: topMetric.gas.fHe
            }
        };

        this.results = GasBlender.mix(request);
    }
}
