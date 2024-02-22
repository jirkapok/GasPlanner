import { Injectable } from '@angular/core';
import { GasBlender, MixRequest, MixResult, Tank } from 'scuba-physics';
import { TankBound } from './models';
import { UnitConversion } from './UnitConversion';

@Injectable()
export class BasBlenderService {
    private sourceTank: TankBound;
    private topMix: TankBound;
    private targetTank: TankBound;
    private results!: MixResult;

    constructor(private units: UnitConversion) {
        this.sourceTank = new TankBound(Tank.createDefault(), this.units);
        // TODO set to Ean32 by default
        // TODO move percents from tank new BoundGas
        this.topMix = new TankBound(Tank.createDefault(), this.units);
        this.topMix.assignStandardGas('EAN32');
        console.log(this.topMix.tank.gas);
        this.targetTank = new TankBound(Tank.createDefault(), this.units);
        this.calculate();
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
        return 0;//  this.results.removeFromSource;
    }

    public get needsRemove(): boolean {
        return this.removeFromSource > 0;
    }

    private calculate(): void {
        // to avoid percents conversion to fraction
        const sourceMetric = this.sourceTank.tank;
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
