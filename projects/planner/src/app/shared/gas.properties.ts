import {
    GasProperties
} from 'scuba-physics';
import { TankBound } from './models';
import { UnitConversion } from './UnitConversion';

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
        return this.units.fromMeters(this.calc.minDepth);
    }

    public get maxDepth(): number {
        return this.units.fromMeters(this.calc.maxDepth);
    }

    public get end(): number {
        return this.units.fromMeters(this.calc.end);
    }

    public get mnd(): number {
        return this.units.fromMeters(this.calc.mnd);
    }

    public get density(): number {
        return this.units.fromGramPerLiter(this.calc.density);
    }

    public get depth(): number {
        return this.units.fromMeters(this.calc.depth);
    }

    public get maxPpO2(): number {
        return this.calc.maxPpO2;
    }

    public get oxygenNarcotic(): boolean {
        return this.calc.oxygenNarcotic;
    }

    public set depth(newValue: number) {
        this.calc.depth = this.units.toMeters(newValue);
    }

    public set maxPpO2(newValue: number) {
        this.calc.maxPpO2 = newValue;
    }

    public switchOxygenNarcotic(): void {
        this.calc.oxygenNarcotic = !this.calc.oxygenNarcotic;
    }
}
