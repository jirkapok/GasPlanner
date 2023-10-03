import {
    GasProperties
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
