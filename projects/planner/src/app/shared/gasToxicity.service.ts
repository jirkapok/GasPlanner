import {
    DepthConverter, DepthLevels, Gas, NitroxCalculator,
    Options, Precision, Tank, GasSwitchCalculator
} from 'scuba-physics';

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

    public modForGas(tank: Tank): number {
        return this.nitroxCalculator.mod(this.options.maxPpO2, tank.o2);
    }

    public mndForGas(gas: Gas): number {
        const depthInBars = this.depthConverter.toBar(this.options.maxEND);
        const maxNarcBar = gas.mnd(depthInBars, this.options.oxygenNarcotic);
        const maxNarcDepth = this.depthConverter.fromBar(maxNarcBar);
        let roundedNarc = Precision.fix(maxNarcDepth);
        roundedNarc = Precision.roundTwoDecimals(roundedNarc);
        return roundedNarc;
    }

    public switchDepth(tank: Tank): number {
        return this.gasSwitchesCalculator.gasSwitch(this.options.maxDecoPpO2, tank.o2);
    }

    public maxDepth(tank: Tank): number {
        const roundedNarc = this.mndForGas(tank.gas);
        const gasMod = this.modForGas(tank);
        const minFound = Math.min(roundedNarc, gasMod);
        return minFound;
    }

    public bestNitroxMix(maxDepth: number): number {
        const maxPpO2 = this.options.maxPpO2;
        const o2 = this.nitroxCalculator.bestMix(maxPpO2, maxDepth);
        return Precision.round(o2);
    }
}
