import { computed, Injectable, signal } from '@angular/core';
import {
    DefaultOptions, Diver, OptionDefaults,
    Options, SafetyStop, Salinity, GasToxicity,
    AirBreakOptions, CircuitType
} from 'scuba-physics';
import { StandardGradientsService } from './standard-gradients.service';
import { UnitConversion } from './UnitConversion';
import { DiverOptions } from './models';
import { ReloadDispatcher } from './reloadDispatcher';

/** All options stored in metric units */
@Injectable()
export class OptionsService {
    /** Allows set lower speed as 0.1 m/min. for last 6 m on hard deco */
    private static readonly minimumSpeed = 0.1;
    public readonly safetyOffName = 'options.safetyOff';
    public readonly safetyOnName = 'options.safetyOn';
    public readonly safetyAutoName = 'options.safetyAuto';
    private standardGradients = new StandardGradientsService();
    private options = new Options();
    private _diver: Diver = new Diver();
    // new instance after options changed, so views showing gas properties derived from it are refreshed
    private readonly _toxicity = computed(() => new GasToxicity(this.tracked));
    // Options are edited in place, each change increases it and each getter reads it to track the change.
    private readonly _version = signal(0);

    constructor(private units: UnitConversion, private dispatcher: ReloadDispatcher) {
        this.options.salinity = Salinity.fresh;
        this.options.safetyStop = SafetyStop.auto;
        // units rounded default values aren't provided,
        // because there is no real use case where this service
        // is created with imperial units by default
    }

    public get toxicity(): GasToxicity {
        return this._toxicity();
    }

    public get diverOptions(): DiverOptions {
        return new DiverOptions(this.tracked, this._diver, () => this.changed());
    }

    public get maxEND(): number {
        const source = this.tracked.maxEND;
        return this.units.fromMeters(source);
    }

    public get lastStopDepth(): number {
        const source = this.tracked.lastStopDepth;
        return this.units.fromMeters(source);
    }

    public get descentSpeed(): number {
        const source = this.tracked.descentSpeed;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed6m(): number {
        const source = this.tracked.ascentSpeed6m;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed50percTo6m(): number {
        const source = this.tracked.ascentSpeed50percTo6m;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed50perc(): number {
        const source = this.tracked.ascentSpeed50perc;
        return this.units.fromMeters(source);
    }

    public get altitude(): number {
        const source = this.tracked.altitude;
        return this.units.fromMeters(source);
    }

    public get gasSwitchDuration(): number {
        return this.tracked.gasSwitchDuration;
    }

    public get gfLow(): number {
        return this.tracked.gfLow;
    }

    public get gfHigh(): number {
        return this.tracked.gfHigh;
    }

    public get maxDecoPpO2(): number {
        return this.tracked.maxDecoPpO2;
    }

    public get maxPpO2(): number {
        return this.tracked.maxPpO2;
    }

    public get oxygenNarcotic(): boolean {
        return this.tracked.oxygenNarcotic;
    }

    public get problemSolvingDuration(): number {
        return this.tracked.problemSolvingDuration;
    }

    public get roundStopsToMinutes(): boolean {
        return this.tracked.roundStopsToMinutes;
    }

    public get salinity(): Salinity {
        return this.tracked.salinity;
    }

    public get safetyAutoLevel(): number {
        return this.units.defaults.autoStopLevel;
    }

    public get safetyStopKey(): string {
        switch (this.tracked.safetyStop) {
            case SafetyStop.never:
                return this.safetyOffName;
            case SafetyStop.always:
                return this.safetyOnName;
            default:
                return this.safetyAutoName;
        }
    }

    public get safetyAutoParams(): Record<string, unknown> {
        return { level: this.safetyAutoLevel, unit: this.units.length };
    }

    public get airBreaks(): AirBreakOptions {
        return this.tracked.airBreaks;
    }

    public get circuit(): CircuitType {
        return this.tracked.rebreather.circuit;
    }

    public get isRebreather(): boolean {
        return this.circuit !== CircuitType.oc;
    }

    public get isPscr(): boolean {
        return this.circuit === CircuitType.pscr;
    }

    public get isMccr(): boolean {
        return this.circuit === CircuitType.mccr;
    }

    public get isEccr(): boolean {
        return this.circuit === CircuitType.eccr;
    }

    /** Rebreather with diluent and oxygen tanks holding a setpoint (mCCR or eCCR) */
    public get isClosedCircuit(): boolean {
        return this.isMccr || this.isEccr;
    }

    public get injectionRatio(): number {
        return this.tracked.rebreather.injectionRatio;
    }

    /** mCCR target ppO2 in bars */
    public get setpoint(): number {
        return this.tracked.rebreather.setpoint;
    }

    /** eCCR setpoint in bars shallower than the switch depth */
    public get descentSetpoint(): number {
        return this.tracked.rebreather.descentSetpoint;
    }

    /** eCCR setpoint in bars deeper than the switch depth */
    public get bottomSetpoint(): number {
        return this.tracked.rebreather.bottomSetpoint;
    }

    /** eCCR setpoint in bars from the deepest point */
    public get decoSetpoint(): number {
        return this.tracked.rebreather.decoSetpoint;
    }

    /** eCCR setpoint switch depth in current length units */
    public get setpointSwitchDepth(): number {
        const source = this.tracked.rebreather.setpointSwitchDepth;
        return this.units.fromMeters(source);
    }

    /** In current volume units per minute */
    public get o2Flow(): number {
        const source = this.tracked.rebreather.o2Flow;
        return this.units.fromLiter(source);
    }

    /** In current volume units */
    public get loopVolume(): number {
        const source = this.tracked.rebreather.loopVolume;
        return this.units.fromLiter(source);
    }

    /** In current volume units per minute */
    public get metabolicO2(): number {
        const source = this.tracked.rebreather.metabolicO2;
        return this.units.fromLiter(source);
    }

    public get decoStopDistance(): number {
        const source = this.tracked.decoStopDistance;
        return this.units.fromMeters(source);
    }

    private get tracked(): Options {
        this._version();
        return this.options;
    }

    public set maxEND(newValue: number) {
        this.options.maxEND = this.units.toMeters(newValue);
        this.changed();
    }

    public set lastStopDepth(newValue: number) {
        this.options.lastStopDepth = this.units.toMeters(newValue);
        this.changed();
    }

    public set descentSpeed(newValue: number) {
        const converted = this.units.toMeters(newValue);
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.descentSpeed = converted;
        this.changed();
    }

    public set ascentSpeed6m(newValue: number) {
        const converted = this.units.toMeters(newValue);
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.ascentSpeed6m = converted;
        this.changed();
    }

    public set ascentSpeed50percTo6m(newValue: number) {
        const converted = this.units.toMeters(newValue);
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.ascentSpeed50percTo6m = converted;
        this.changed();
    }

    public set ascentSpeed50perc(newValue: number) {
        const converted = this.units.toMeters(newValue);

        // somehow noticed frozen UI in case copy/paste 0 into the asc/desc fields
        // not need to be converted by units since for our use case need at least some finite value
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.ascentSpeed50perc = converted;
        this.changed();
    }

    public set altitude(newValue: number) {
        this.options.altitude = this.units.toMeters(newValue);
        this.changed();
    }

    public set gasSwitchDuration(newValue: number) {
        this.options.gasSwitchDuration = newValue;
        this.changed();
    }

    public set gfLow(newValue: number) {
        this.options.gfLow = newValue;
        this.changed();
    }

    public set gfHigh(newValue: number ){
        this.options.gfHigh = newValue;
        this.changed();
    }

    public set maxDecoPpO2(newValue: number) {
        this.options.maxDecoPpO2 = newValue;
        this.changed();
    }

    public set maxPpO2(newValue: number) {
        this.options.maxPpO2 = newValue;
        this.changed();
    }

    public set oxygenNarcotic(newValue: boolean) {
        this.options.oxygenNarcotic = newValue;
        this.changed();
    }

    public set problemSolvingDuration(newValue: number) {
        this.options.problemSolvingDuration = newValue;
        this.changed();
    }

    public set roundStopsToMinutes(newValue: boolean) {
        this.options.roundStopsToMinutes = newValue;
        this.changed();
    }

    public set salinity(newValue: Salinity) {
        this.options.salinity = newValue;
        this.changed();
    }

    public set decoStopDistance(newValue: number) {
        this.options.decoStopDistance = this.units.toMeters(newValue);
        this.changed();
    }

    public set circuit(newValue: CircuitType) {
        this.options.rebreather.circuit = newValue;
        this.changed();
    }

    public set injectionRatio(newValue: number) {
        this.options.rebreather.injectionRatio = newValue;
        this.changed();
    }

    public set metabolicO2(newValue: number) {
        this.options.rebreather.metabolicO2 = this.units.toLiter(newValue);
        this.changed();
    }

    public set setpoint(newValue: number) {
        this.options.rebreather.setpoint = newValue;
        this.changed();
    }

    public set descentSetpoint(newValue: number) {
        this.options.rebreather.descentSetpoint = newValue;
        this.changed();
    }

    public set bottomSetpoint(newValue: number) {
        this.options.rebreather.bottomSetpoint = newValue;
        this.changed();
    }

    public set decoSetpoint(newValue: number) {
        this.options.rebreather.decoSetpoint = newValue;
        this.changed();
    }

    public set setpointSwitchDepth(newValue: number) {
        this.options.rebreather.setpointSwitchDepth = this.units.toMeters(newValue);
        this.changed();
    }

    public set o2Flow(newValue: number) {
        this.options.rebreather.o2Flow = this.units.toLiter(newValue);
        this.changed();
    }

    public set loopVolume(newValue: number) {
        this.options.rebreather.loopVolume = this.units.toLiter(newValue);
        this.changed();
    }

    public useRecreational(): void {
        const newValues = this.units.defaults.recreationalOptions;
        this.applyValues(newValues);
    }

    public useRecommended(): void {
        const newValues = this.units.defaults.recommendedOptions;
        this.applyValues(newValues);
    }

    public useSafetyOff(): void {
        this.options.safetyStop = SafetyStop.never;
        this.changed();
    }

    public useSafetyAuto(): void {
        this.options.safetyStop = SafetyStop.auto;
        this.changed();
    }

    public useSafetyOn(): void {
        this.options.safetyStop = SafetyStop.always;
        this.changed();
    }

    public loadFrom(newOptions: Options, diver: Diver): void {
        this.options.loadFrom(newOptions);
        this.changed();
        const newDiver = new DiverOptions(newOptions, diver);
        this.applyDiver(newDiver);
        this.dispatcher.sendOptionsReloaded(this);
    }

    public applyDiver(diver: DiverOptions): void {
        this.diverOptions.loadFrom(diver);
        this.changed();
    }

    public resetToSimple(): void {
        // rebreathers are available only in complex mode
        this.options.rebreather.circuit = CircuitType.oc;
        this.changed();
        const foundGfLabel = this.standardGradients.labelFor(this.gfLow, this.gfHigh);
        if(foundGfLabel === '') {
            OptionDefaults.setMediumConservatism(this.options);
            this.changed();
        }
    }

    // didn't use inheritance to be able override some properties
    // can be considered later
    public getOptions(): Options {
        return this.options;
    }

    public getDiver(): Diver {
        return this._diver;
    }

    public switchAirBreaks(): void {
        this.airBreaks.enabled = !this.airBreaks.enabled;
        this.changed();
    }

    private changed(): void {
        this._version.update(v => v + 1);
    }

    private applyValues(newValues: DefaultOptions): void {
        this.options.ascentSpeed50perc = this.units.toMeters(newValues.ascentSpeed50perc);
        this.options.ascentSpeed50percTo6m = this.units.toMeters(newValues.ascentSpeed50percTo6m);
        this.options.ascentSpeed6m = this.units.toMeters(newValues.ascentSpeed6m);
        this.options.descentSpeed = this.units.toMeters(newValues.descentSpeed);
        this.options.lastStopDepth = this.units.toMeters(newValues.lastStopDepth);
        this.options.maxEND =this.units.toMeters(newValues.maxEND);
        OptionDefaults.useGeneralRecommended(this.options);
        this.changed();
    }
}
