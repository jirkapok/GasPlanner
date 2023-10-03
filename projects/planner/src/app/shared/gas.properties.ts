import {
    DensityAtDepth,
    DepthConverter,
    Gas,
    GasMixtures,
    Tank
} from 'scuba-physics';
import { TankBound } from './models';
import { UnitConversion } from './UnitConversion';

// TODO apply units
// TODO split to library
// TODO add warning to the UI about simple depth converter
export class BoundGasProperties {
    // TODO consider reduce dependency from tank to gas only
    private readonly _tank: TankBound;
    private readonly calc = new GasProperties();

    constructor(private units: UnitConversion) {
        this._tank = new TankBound(this.calc.tank, this.units);
    }

    public get tank(): TankBound {
        return this._tank;
    }

    public get ppO2(): number {
        return this.calc.ppO2;
    }

    public get ppHe(): number {
        return this.calc.ppHe;
    }

    public get ppN2(): number {
        return this.calc.ppN2;
    }

    public get totalPp(): number {
        return this.calc.totalPp;
    }

    public get minDepth(): number {
        return this.calc.minDepth;
    }

    public get maxDepth(): number {
        return this.calc.maxDepth;
    }

    public get end(): number {
        return this.calc.end;
    }

    public get mnd(): number {
        return this.calc.mnd;
    }

    public get density(): number {
        return this.calc.density;
    }

    /** in meters */
    public get depth(): number {
        return this.calc.depth;
    }

    public set depth(newValue: number) {
        this.calc.depth = newValue;
    }
}


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
        const endDepthPressure = GasMixtures.end(this.depthPressure, this.gas.fN2, this.gas.fO2);
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
