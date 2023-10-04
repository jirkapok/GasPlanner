import { DensityAtDepth } from './GasDensity';
import { Gas, GasMixtures } from './Gases';
import { Tank } from './Tanks';
import { DepthConverter } from './depth-converter';

/** Calculator for gas properties of selected mix at defined depth. */
export class GasProperties {
    /** Gets or sets current in meters */
    public depth = 0;
    /** Gets or sets the maximum partial pressure of the mix. Default is 1.4, recommended range 1-3 */
    public maxPpO2 = 1.4; // TODO add to UI
    public oxygenNarcotic = true; // TODO Add to UI
    private narcDepthBars = 4; // TODO add to UI
    private readonly _tank = Tank.createDefault();
    private readonly depthConverter = DepthConverter.simple();
    private readonly densityCalc = new DensityAtDepth(this.depthConverter);

    public get tank(): Tank {
        return this._tank;
    }

    /** Gets or sets narcotic depth in meters to be used to compare with current gas properties. */
    public get narcoticDepth(): number {
        return this.depthConverter.fromBar(this.narcDepthBars);
    }

    /** Gets current mixture oxygen partial pressure */
    public get ppO2(): number {
        const result = GasMixtures.partialPressure(this.depthPressure, this.gas.fO2);
        return result;
    }

    /** Gets current mixture helium partial pressure */
    public get ppHe(): number {
        const result = GasMixtures.partialPressure(this.depthPressure, this.gas.fHe);
        return result;
    }

    /** Gets current mixture nitrogen partial pressure */
    public get ppN2(): number {
        const result = GasMixtures.partialPressure(this.depthPressure, this.gas.fN2);
        return result;
    }

    /** Gets total pressure of the mix at current depth. Its value equals to current depth pressure in bars. */
    public get totalPp(): number {
        return this.depthPressure;
    }

    /** Gets minimum operational depth in meters based on current maximum partial pressure and oxygen content. */
    public get minDepth(): number {
        const surface = this.depthConverter.surfacePressure;
        const minDepthPressure = this.gas.ceiling(surface);
        return this.depthConverter.fromBar(minDepthPressure);
    }

    /** Gets maximum operational depth in meters based on current maximum partial pressure and oxygen content. */
    public get maxDepth(): number {
        const maxDepthPressure = this.gas.mod(this.maxPpO2);
        return this.depthConverter.fromBar(maxDepthPressure);
    }

    /** Gets current mix equivalent narcotic depth based on current depth. */
    public get end(): number {
        let endDepthPressure = this.gas.end(this.depthPressure, this.oxygenNarcotic);

        if(endDepthPressure < this.depthConverter.surfacePressure) {
            endDepthPressure = this.depthConverter.surfacePressure;
        }

        return this.depthConverter.fromBar(endDepthPressure);
    }

    /** Gets maximum narcotic depth of current mixture. */
    public get mnd(): number {
        const endDepthPressure = this.gas.mnd(this.narcDepthBars, this.oxygenNarcotic);
        return this.depthConverter.fromBar(endDepthPressure);
    }

    /** Gets density in g/l of the mixture at current depth. */
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

    public set narcoticDepth(newValue: number) {
        this.narcDepthBars = this.depthConverter.toBar(newValue);
    }
}
