import { DepthConverter } from './depth-converter';
import { GasSwitchCalculator, NitroxCalculator } from './calculators/NitroxCalculator';
import { Options } from './Options';
import { DepthLevels } from './DepthLevels';
import { Tank } from './Tanks';
import { Gas } from './Gases';
import { Precision } from './common/precision';

/**
 * Combines all gas limits into one service
 */
export class GasToxicity {
    // for gas toxicity only always use simple to be aligned with what people expect
    private depthConverter = DepthConverter.simple();
    private nitroxCalculator: NitroxCalculator;
    private gasSwitchesCalculator: GasSwitchCalculator;

    // since we don't need to fix biding of the options, the original instance is OK.
    constructor(private options: Options = new Options()) {
        const levels = new DepthLevels(this.depthConverter, this.options);
        this.gasSwitchesCalculator = new GasSwitchCalculator(levels);
        this.nitroxCalculator = new NitroxCalculator(this.depthConverter);
    }

    /**
     * Returns maximum operational depth in meters.
     * @param tank gas for which to calculate the depth.
     */
    public modForGas(tank: Tank): number {
        return this.nitroxCalculator.mod(this.options.maxPpO2, tank.o2);
    }

    /**
     * Returns maximum narcotic depth in meters.
     * @param gas Mixture for which to calculate the depth.
     */
    public mndForGas(gas: Gas): number {
        const depthInBars = this.depthConverter.toBar(this.options.maxEND);
        const maxNarcBar = gas.mnd(depthInBars, this.options.oxygenNarcotic);
        const maxNarcDepth = this.depthConverter.fromBar(maxNarcBar);
        let roundedNarc = Precision.fix(maxNarcDepth);
        roundedNarc = Precision.roundTwoDecimals(roundedNarc);
        return roundedNarc;
    }

    /**
     * Returns maximum depth in meters at which gas switch to this mixture can happen.
     * @param tank source of the O2 for which to calculate the depth.
     */
    public switchDepth(tank: Tank): number {
        return this.gasSwitchesCalculator.gasSwitch(this.options.maxDecoPpO2, tank.o2);
    }

    /**
     * Returns maximum depth in meters at which this gas can be used.
     * This is minim of mod or mnd values.
     * @param tank Gas for which to calculate the depth.
     */
    public maxDepth(tank: Tank): number {
        const roundedNarc = this.mndForGas(tank.gas);
        const gasMod = this.modForGas(tank);
        const minFound = Math.min(roundedNarc, gasMod);
        return minFound;
    }

    /**
     * Returns best mix O2 content for required depth in percents.
     * @param maxDepth required depth in meters
     */
    public bestNitroxMix(maxDepth: number): number {
        const maxPpO2 = this.options.maxPpO2;
        const o2 = this.nitroxCalculator.bestMix(maxPpO2, maxDepth);
        return Precision.round(o2);
    }
}
