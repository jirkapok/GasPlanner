import { DepthConverter, DepthLevels, Diver, Gas, NitroxCalculator, Options, Tank } from 'scuba-physics';

export class GasToxicity {
    private nitroxCalculator: NitroxCalculator;
    private depthConverter: DepthConverter;
    private diver = new Diver();
    private options: Options;

    constructor() {
        // TODO provide services and reset depth converter whenever options change
        this.options = new Options();
        this.depthConverter = DepthConverter.simple();
        const levels = new DepthLevels(this.depthConverter, this.options);
        this.nitroxCalculator = new NitroxCalculator(levels, this.depthConverter);
    }

    public modForGas(tank: Tank): number {
        return this.nitroxCalculator.mod(this.diver.maxPpO2, tank.o2);
    }

    public mndForGas(gas: Gas): number {
        const depthInBars = this.depthConverter.toBar(this.options.maxEND);
        const maxNarcBar = gas.mnd(depthInBars, this.options.oxygenNarcotic);
        const maxNarcDepth = this.depthConverter.fromBar(maxNarcBar);
        // because of javascript numbers precision we need to help our self
        const roundedNarc = Math.round(maxNarcDepth * 100) / 100;
        return roundedNarc;
    }

    public switchDepth(tank: Tank): number {
        return this.nitroxCalculator.gasSwitch(this.diver.maxDecoPpO2, tank.o2);
    }

    public maxDepth(tank: Tank): number {
        const roundedNarc = this.mndForGas(tank.gas);
        const gasMod = this.modForGas(tank);
        const minFound = Math.min(roundedNarc, gasMod);
        return Math.floor(minFound);
    }

    public bestNitroxMix(maxDepth: number): number {
        const maxPpO2 = this.options.maxPpO2;
        const o2 = this.nitroxCalculator.bestMix(maxPpO2, maxDepth);
        return Math.round(o2);
    }
}
