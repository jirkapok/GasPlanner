import {
    Time, Segment, Tank,
    Precision, TankTemplate, Options,
    Diver, GasDensity, Consumption,
    Event, EventType, GasNames
} from 'scuba-physics';
import { signal } from '@angular/core';
import { UnitConversion } from './UnitConversion';

export enum Strategies {
    all = 1,
    half = 2,
    third = 3
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
        this.segment.tank = newValue.algorithmTank;
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
    public missingAirBreakIgnored = false;
}

export class DiverOptions {
    constructor(
        private options: Options = new Options(),
        private diver: Diver = new Diver(),
        private onChanged: () => void = () => {}) { }

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
        this.onChanged();
    }

    public set maxDecoPpO2(newValue: number) {
        this.options.maxDecoPpO2 = newValue;
        this.onChanged();
    }

    public set rmv(newValue: number) {
        this.diver.rmv = newValue;
        this.onChanged();
    }

    public set stressRmv(newValue: number) {
        this.diver.stressRmv = newValue;
        this.onChanged();
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
    private _workingPressureBars: number;
    // The tank is edited in place by other components than the ones showing it and consumption comes from web worker.
    // Each setter increases it and each getter reads it to track the change.
    private readonly _version = signal(0);

    private readonly _tank: Tank;

    constructor(tank: Tank, private units: UnitConversion) {
        this._tank = tank;
        const defaultTanks = this.units.defaults.tanks;
        const newWorkPressure = defaultTanks.primary.workingPressure;
        this._workingPressureBars = this.units.toBar(newWorkPressure);
    }

    /** The tank with tracked changes, use it to calculate values shown in the view. Change the tank only by setters of this class. */
    public get tank(): Readonly<Tank> {
        this._version();
        return this._tank;
    }

    /**
     * The tracked tank for scuba-physics APIs requiring the Tank type (its private members make Readonly<Tank> unassignable).
     * Pass it only for reading, change the tank only by setters of this class.
     */
    public get algorithmTank(): Tank {
        this._version();
        return this._tank;
    }

    public get id(): number {
        return this.tank.id;
    }

    public get size(): number {
        return this.units.fromTankLiters(this.tank.size, this._workingPressureBars);
    }

    public get startPressure(): number {
        return this.units.fromBar(this.tank.startPressure);
    }

    public get workingPressure(): number {
        return this.units.fromBar(this.workingPressureBars);
    }

    public get workingPressureBars(): number {
        this._version();
        return this._workingPressureBars;
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

    public get name(): string {
        return this.tank.name;
    }

    /** In respective pressure units */
    public get consumed(): number {
        return this.units.fromBar(this.tank.consumed);
    }

    /** In respective pressure units */
    public get reserve(): number {
        return this.units.fromBar(this.tank.reserve);
    }

    /** In respective pressure units */
    public get endPressure(): number {
        return this.units.fromBar(this.tank.endPressure);
    }

    public get percentsReserve(): number {
        return this.tank.percentsReserve;
    }

    public get percentsRemaining(): number {
        return this.tank.percentsRemaining;
    }

    public get hasReserve(): boolean {
        return this.tank.hasReserve;
    }

    public get label(): string {
        const volume = Precision.round(this.size, 1);
        const startPressure = Precision.round(this.startPressure, 1);
        return `${this.id}. ${this.name}/${volume}/${startPressure}`;
    }

    public set id(newValue: number) {
        this._tank.id = newValue;
        this.changed();
    }

    /** Rounded to one decimal place in respective volume units */
    public set size(newValue: number) {
        this.assignSize(Precision.round(newValue, 1));
    }

    public set startPressure(newValue: number) {
        this._tank.startPressure = this.units.toBar(newValue);
        this.changed();
    }

    /** Size in liters regardless of the units, for restoring metric state */
    public set sizeLiters(newValue: number) {
        this._tank.size = newValue;
        this.changed();
    }

    /** Start pressure in bars regardless of the units */
    public set startPressureBars(newValue: number) {
        this._tank.startPressure = newValue;
        this.changed();
    }

    /** Consumed in bars regardless of the units */
    public set consumedBars(newValue: number) {
        this._tank.consumed = newValue;
        this.changed();
    }

    public set workingPressure(newValue: number) {
        if (Number.isNaN(newValue)) {
            return;
        }

        const sizeBackup = this.size;
        this._workingPressureBars = this.units.toBar(newValue);
        this.assignSize(sizeBackup);
    }

    /**
     * Does not preserve size in UI units.
     * Use only for serialization or switching between units.
     **/
    public set workingPressureBars(newValue: number) {
        if (Number.isNaN(newValue)) {
            return;
        }

        this._workingPressureBars = newValue;
        this.changed();
    }

    public set o2(newValue: number) {
        this._tank.o2 = newValue;
        this.changed();
    }

    public set he(newValue: number) {
        this._tank.he = newValue;
        this.changed();
    }

    public assignTemplate(template: TankTemplate): void {
        this.workingPressure = template.workingPressure;
        this.size = template.size;
    }

    public assignStandardGas(gasName: string): void {
        this._tank.assignStandardGas(gasName);
        this.changed();
    }

    /** Values in bars, as calculated by the consumption worker */
    public assignConsumption(consumed: number, reserve: number): void {
        this._tank.consumed = consumed;
        this._tank.reserve = reserve;
        this.changed();
    }

    private assignSize(newValue: number): void {
        this._tank.size = this.units.toTankLiters(newValue, this._workingPressureBars);
        this.changed();
    }

    private changed(): void {
        this._version.update(v => v + 1);
    }
}

export enum EventSeverity {
    none = 0,
    warning = 1,
    error = 2
}

export class BoundEvent {
    constructor(private units: UnitConversion, private event: Event) {
    }

    public get isNoDeco(): boolean {
        return this.event.type === EventType.noDecoEnd;
    }

    public get isLowPpO2(): boolean {
        return this.event.type === EventType.lowPpO2;
    }

    public get isHighPpO2(): boolean {
        return this.event.type === EventType.highPpO2;
    }

    public get isHighAscentSpeed(): boolean {
        return this.event.type === EventType.highAscentSpeed;
    }

    public get isHighDescentSpeed(): boolean {
        return this.event.type === EventType.highDescentSpeed;
    }

    public get isBrokenCeiling(): boolean {
        return this.event.type === EventType.brokenCeiling;
    }

    public get isHighN2Switch(): boolean {
        return this.event.type === EventType.isobaricCounterDiffusion;
    }

    public get isMndExceeded(): boolean {
        return this.event.type === EventType.maxEndExceeded;
    }

    public get isHighDensity(): boolean {
        return this.event.type === EventType.highGasDensity;
    }

    public get isMinDepth(): boolean {
        return this.event.type === EventType.minDepth;
    }

    public get isMaxDepth(): boolean {
        return this.event.type === EventType.maxDepth;
    }

    public get isMissingAirbreak(): boolean {
        return this.event.type === EventType.missingAirBreak;
    }

    public get timeStamp(): number {
        return this.event.timeStamp;
    }
    public get depth(): number {
        return this.units.fromMeters(this.event.depth);
    }

    /**
     * Percentage points of nitrogen, by which the gas switch exceeds
     * the isobaric counter diffusion limit (1/5 rule). 0 for other events.
     */
    public get n2OverLimit(): number {
        const fraction = this.event.value ?? 0;
        return Precision.round(fraction * 100, 1);
    }

    /** Name of the gas associated with the event, empty if the event has no gas */
    public get gasName(): string {
        const gas = this.event.gas;
        return gas ? GasNames.nameFor(gas.fO2, gas.fHe) : '';
    }

    public get showInProfileChart(): boolean {
        switch (this.event.type) {
            case EventType.gasSwitch:
            case EventType.noDecoEnd:
            case EventType.safetyStop:
                return true;
            default: return false;
        }
    }

    public get severity(): EventSeverity {
        switch (this.event.type) {
            case EventType.error:
            case EventType.brokenCeiling:
            case EventType.lowPpO2:
            case EventType.highPpO2:
                return EventSeverity.error;

            case EventType.highAscentSpeed:
            case EventType.highDescentSpeed:
            case EventType.maxEndExceeded:
            case EventType.isobaricCounterDiffusion:
            case EventType.highGasDensity:
            case EventType.minDepth:
            case EventType.maxDepth:
            case EventType.missingAirBreak:
                return EventSeverity.warning;
            default:
                return EventSeverity.none;
        }
    }

    public get isWarning(): boolean {
        return this.severity === EventSeverity.warning;
    }

    public get isError(): boolean {
        return this.severity === EventSeverity.error;
    }

    public get chartEventText(): string {
        switch (this.event.type) {
            case EventType.gasSwitch:
                return this.gasName;
            case EventType.noDecoEnd:
                return 'events.deco';
            case EventType.safetyStop:
                return 'events.safetyStop';
            default: return '';
        }
    }
}
