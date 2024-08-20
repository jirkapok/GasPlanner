import {
    Time, Segment, Tank,
    Precision, TankTemplate, Options,
    Diver, GasDensity, Consumption
} from 'scuba-physics';
import { UnitConversion } from './UnitConversion';

export enum Strategies {
    ALL = 1,
    HALF = 2,
    THIRD = 3
}

export interface DiveSetup {
    tanks: Tank[];
    segments: Segment[];
    diver: Diver;
    options: Options;
}

export class Level {
    constructor(
        private units: UnitConversion,
        public segment: Segment,
        private tankBound: TankBound
    ) {
    }

    public get duration(): number {
        return Time.toMinutes(this.segment.duration);
    }

    public get startDepth(): number {
        const depth = this.segment.startDepth;
        return this.units.fromMeters(depth);
    }

    public get endDepth(): number {
        const depth = this.segment.endDepth;
        return this.units.fromMeters(depth);
    }

    public get tank(): TankBound {
        return this.tankBound;
    }

    public get tankLabel(): string {
        return this.tank.label;
    }

    /** in minutes */
    public set duration(newValue: number) {
        this.segment.duration = Time.toSeconds(newValue);
    }

    public set endDepth(newValue: number) {
        const meters = this.units.toMeters(newValue);
        this.segment.endDepth = meters;
    }

    public set tank(newValue: TankBound) {
        this.segment.tank = newValue.tank;
        this.tankBound = newValue;
    }
}

/**
 * Not added to the Url, since it is not needed for sharing.
 */
export class AppSettings {
    public maxGasDensity = GasDensity.recommendedMaximum;
    public primaryTankReserve = Consumption.defaultPrimaryReserve;
    public stageTankReserve = Consumption.defaultStageReserve;
    public icdIgnored = false;
    public noDecoIgnored = false;
    public densityIgnored = false;
}

export class DiverOptions {
    constructor(private options: Options = new Options(), private diver: Diver = new Diver()) { }

    public get maxPpO2(): number {
        return this.options.maxPpO2;
    }

    public get maxDecoPpO2(): number {
        return this.options.maxDecoPpO2;
    }

    public get rmv(): number {
        return this.diver.rmv;
    }

    public get stressRmv(): number {
        return this.diver.stressRmv;
    }

    public set maxPpO2(newValue: number) {
        this.options.maxPpO2 = newValue;
    }

    public set maxDecoPpO2(newValue: number) {
        this.options.maxDecoPpO2 = newValue;
    }

    public set rmv(newValue: number) {
        this.diver.rmv = newValue;
    }

    public set stressRmv(newValue: number) {
        this.diver.stressRmv = newValue;
    }

    public loadFrom(other: DiverOptions): void {
        this.rmv = other.rmv;
        this.stressRmv = other.stressRmv;
        this.maxPpO2 = other.maxPpO2;
        this.maxDecoPpO2 = other.maxDecoPpO2;
    }

    public gasSac(tank: Tank): number {
        return this.diver.gasSac(tank);
    }
}

export interface IGasContent {
    /** In percents */
    o2: number;
    /** In percents */
    he: number;
    assignStandardGas(gasName: string): void;
}

export interface ITankSize {
    /** In respective volume units */
    size: number;
    /** In respective pressure units */
    workingPressure: number;
    /** In respective pressure units */
    startPressure: number;
    assignTemplate(template: TankTemplate): void;
}

export class TankBound implements IGasContent, ITankSize {
    private _workingPressure: number;

    constructor(public tank: Tank, private units: UnitConversion) {
        const defaultTanks = this.units.defaults.tanks;
        const newWorkPressure = defaultTanks.primary.workingPressure;
        this._workingPressure = this.units.toBar(newWorkPressure);
    }

    public get id(): number {
        return this.tank.id;
    }

    public get size(): number {
        return this.units.fromTankLiters(this.tank.size, this._workingPressure);
    }

    public get startPressure(): number {
        return this.units.fromBar(this.tank.startPressure);
    }

    public get workingPressure(): number {
        return this.units.fromBar(this._workingPressure);
    }

    public get workingPressureBars(): number {
        return this._workingPressure;
    }

    public get o2(): number {
        return this.tank.o2;
    }

    public get he(): number {
        return this.tank.he;
    }

    public get n2(): number {
        return this.tank.n2;
    }

    public get label(): string {
        let volume = this.units.fromTankLiters(this.tank.size, this._workingPressure);
        volume = Precision.round(volume, 1);
        let startPressure = this.units.fromBar(this.tank.startPressure);
        startPressure = Precision.round(startPressure, 1);
        return `${this.tank.id}. ${this.tank.name}/${volume}/${startPressure}`;
    }

    public set id(newValue: number) {
        this.tank.id = newValue;
    }

    public set size(newValue: number) {
        this.tank.size = this.units.toTankLiters(newValue, this._workingPressure);
    }

    public set startPressure(newValue: number) {
        this.tank.startPressure = this.units.toBar(newValue);
    }

    public set workingPressure(newValue: number) {
        if (isNaN(newValue)) {
            return;
        }

        const sizeBackup = this.size;
        this._workingPressure = this.units.toBar(newValue);
        this.size = sizeBackup;
    }

    /** For serialization purpose only */
    public set workingPressureBars(newValue: number) {
        if (isNaN(newValue)) {
            return;
        }

        const sizeBackup = this.size;
        this._workingPressure = newValue;
        this.size = sizeBackup;
    }

    public set o2(newValue: number) {
        this.tank.o2 = newValue;
    }

    public set he(newValue: number) {
        this.tank.he = newValue;
    }

    public assignTemplate(template: TankTemplate): void {
        this.workingPressure = template.workingPressure;
        this.size = template.size;
    }

    public assignStandardGas(gasName: string): void {
        this.tank.assignStandardGas(gasName);
    }
}
