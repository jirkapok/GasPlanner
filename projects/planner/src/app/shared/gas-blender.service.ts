import { Injectable } from '@angular/core';
import {
    GasBlender, MixRequest, MixResult, Tank
} from 'scuba-physics';
import { TankBound } from './models';
import { UnitConversion } from './UnitConversion';

@Injectable()
export class GasBlenderService {
    private readonly _sourceTank: TankBound;
    private readonly _topMix: TankBound;
    private readonly _targetTank: TankBound;
    private _addO2 = 0;
    private _addHe = 0;
    private _addTop = 0;
    private _removeFromSource = 0;
    private _unableToCalculate = false;

    constructor(private units: UnitConversion) {
        // we dont need create default tank based on units, because all values are always within ranges
        this._sourceTank = new TankBound(Tank.createDefault(), this.units);
        this._sourceTank.startPressure = 0;
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
        return this.units.fromBar(this._addO2);
    }

    public get addHe(): number {
        return this.units.fromBar(this._addHe);
    }

    public get addTop(): number {
        return this.units.fromBar(this._addTop);
    }

    public get removeFromSource(): number {
        return this.units.fromBar(this._removeFromSource);
    }

    public get needsRemove(): boolean {
        return this.removeFromSource > 0;
    }

    public get unableToCalculate(): boolean {
        return this._unableToCalculate;
    }

    /**
     *  Needs to be applied, when any field changes.
     **/
    public calculate(): void {
        try {
            const request: MixRequest = this.createRequest();
            const results = GasBlender.mix(request);
            this.applyResults(results);
            this._unableToCalculate = false;
        } catch {
            const results: MixResult = { addHe: 0, addO2: 0, addTop: 0, removeFromSource: 0 };
            this.applyResults(results);
            this._unableToCalculate = true;
        }
    }

    private createRequest(): MixRequest {
        // to avoid percents conversion to fraction
        const sourceMetric = this._sourceTank.tank;
        const targetMetric = this.targetTank.tank;
        const topMetric = this.topMix.tank;

        return {
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
    }

    private applyResults(results: MixResult): void {
        this._addO2 = results.addO2;
        this._addHe = results.addHe;
        this._addTop = results.addTop;
        this._removeFromSource = results.removeFromSource;
    }
}
