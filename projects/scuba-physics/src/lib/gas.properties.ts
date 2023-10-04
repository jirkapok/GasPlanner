import { DensityAtDepth } from './GasDensity';
import { Gas, GasMixtures } from './Gases';
import { Tank } from './Tanks';
import { DepthConverter } from './depth-converter';

// TODO add documentation to all properties
export class GasProperties {
    /** in meters */
    public depth = 0;
    private readonly _tank = Tank.createDefault();
    private readonly depthConverter = DepthConverter.simple();
    private readonly densityCalc = new DensityAtDepth(this.depthConverter);

    public get tank(): Tank {
        return this._tank;
    }

    public get ppO2(): number {
        const result = GasMixtures.partialPressure(this.depthPressure, this.gas.fO2);
        return result;
    }

    public get ppHe(): number {
        const result = GasMixtures.partialPressure(this.depthPressure, this.gas.fHe);
        return result;
    }

    public get ppN2(): number {
        const result = GasMixtures.partialPressure(this.depthPressure, this.gas.fN2);
        return result;
    }

    public get totalPp(): number {
        return this.depthPressure;
    }

    public get minDepth(): number {
        const surface = this.depthConverter.surfacePressure;
        const minDepthPressure = GasMixtures.ceiling(this.gas.fO2, surface);
        return this.depthConverter.fromBar(minDepthPressure);
    }

    public get maxDepth(): number {
        const maxppO2 = 1.4; // TODO add to UI
        const maxDepthPressure = GasMixtures.mod(1.4, this.gas.fO2);
        return this.depthConverter.fromBar(maxDepthPressure);
    }

    public get end(): number {
        let endDepthPressure = GasMixtures.end(this.depthPressure, this.gas.fN2, this.gas.fO2);

        if(endDepthPressure < this.depthConverter.surfacePressure) {
            endDepthPressure = this.depthConverter.surfacePressure;
        }

        return this.depthConverter.fromBar(endDepthPressure);
    }

    public get mnd(): number {
        const narcDepthBars = 4; // TODO add to UI
        const endDepthPressure = GasMixtures.mnd(narcDepthBars, this.gas.fN2, this.gas.fO2);
        return this.depthConverter.fromBar(endDepthPressure);
    }

    public get density(): number {
        const density = this.densityCalc.atDepth(this.gas, this.depth);
        return density;
    }

    private get gas(): Gas {
        return this.tank.gas;
    }

    private get depthPressure(): number {
        return this.depthConverter.toBar(this.depth);
    }
}
