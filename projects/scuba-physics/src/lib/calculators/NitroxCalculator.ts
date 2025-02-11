import { Precision } from '../common/precision';
import { DepthConverter } from '../physics/depth-converter';
import { DepthLevels } from '../depths/DepthLevels';
import { GasMixtures } from '../gases/GasMixtures';

export class GasSwitchCalculator {
    constructor(private depthLevels: DepthLevels) {
    }

    /**
     * Calculates recommended switch depth for given gas rounded to meters.
     *
     * @param ppO2 - Partial pressure constant.
     * @param percentO2 - Percents of Oxygen fraction in gas.
     * @returns Depth in meters.
     */
    public gasSwitch(ppO2: number, percentO2: number): number {
        const fO2 = percentO2 / 100;
        const result = GasMixtures.mod(ppO2, fO2);
        return this.depthLevels.toDecoStop(result);
    }
}

/**
 * Calculates all Nitrox related values (ead, mod, ppO2, best mix)
 * except gas switch depth (see GasSwitchCalculator).
 */
export class NitroxCalculator {
    constructor(private depthConverter: DepthConverter, private o2InAir = GasMixtures.o2InAir) {
    }

    /**
     * Calculates equivalent air depth for given nitrox gas mix.
     *
     * @param percentO2 - Percents of Oxygen fraction in gas.
     * @param depth - Current depth in meters.
     * @returns Depth in meters.
     */
    public ead(percentO2: number, depth: number): number {
        const fO2 = percentO2 / 100;
        const bars = this.depthConverter.toBar(depth);
        const result = GasMixtures.ead(fO2, bars, this.o2InAir);

        if(result <= this.depthConverter.surfacePressure) {
            return 0;
        }

        let resultMeters = this.depthConverter.fromBar(result);
        resultMeters = Precision.fix(resultMeters);
        return Precision.ceilTwoDecimals(resultMeters);
    }

    /**
     * Calculates best mix of nitrox gas for given depth.
     *
     * @param pO2 - Partial pressure constant.
     * @param depth - Current depth in meters.
     * @returns Percents of oxygen fraction in required gas.
     */
    public bestMix(pO2: number, depth: number): number {
        let result = GasMixtures.bestMix(pO2, depth, this.depthConverter) * 100;
        result = Precision.fix(result);
        return Precision.floor(result, 2) ;
    }

    /**
     * Calculates Maximum operation depth for given mix.
     *
     * @param ppO2 - Partial pressure constant.
     * @param percentO2 - Percents of Oxygen fraction in gas.
     * @returns Depth in meters.
     */
    public mod(ppO2: number, percentO2: number): number {
        const fO2 = percentO2 / 100;
        let result = GasMixtures.mod(ppO2, fO2);
        result = this.depthConverter.fromBar(result);
        result = Precision.fix(result);
        return Precision.floor(result, 2);
    }

    /**
     * Calculates partial pressure constant for given mix at depth.
     *
     * @param fO2 - Percents of Oxygen fraction in gas.
     * @param depth - Current depth in meters.
     * @returns Constant value.
     */
    public partialPressure(fO2: number, depth: number): number {
        const bar = this.depthConverter.toBar(depth);
        let result = GasMixtures.partialPressure(bar, fO2) / 100;
        result = Precision.fix(result);
        return Precision.ceilTwoDecimals(result);
    }
}
