import { Injectable } from '@angular/core';
import {
    DefaultOptions, Diver, OptionDefaults,
    Options, SafetyStop, Salinity, GasToxicity
} from 'scuba-physics';
import { StandardGradientsService } from './standard-gradients.service';
import { UnitConversion } from './UnitConversion';
import { DiverOptions } from './models';
import {ReloadDispatcher} from './reloadDispatcher';

/** All options stored in metric units */
@Injectable()
export class OptionsService {
    /** Allows set lower speed as 0.1 m/min. for last 6 m on hard deco */
    private static readonly minimumSpeed = 0.1;
    public readonly safetyOffName = 'Never';
    public readonly safetyOnName = 'Always';
    private standardGradients = new StandardGradientsService();
    private options = new Options();
    private _diver: Diver = new Diver();
    private _toxicity = new GasToxicity(this.options);

    constructor(private units: UnitConversion, private dispatcher: ReloadDispatcher) {
        this.options.salinity = Salinity.fresh;
        this.options.safetyStop = SafetyStop.auto;
        // units rounded default values aren't provided,
        // because there is no real use case where this service
        // is created with imperial units by default
    }

    public get toxicity(): GasToxicity {
        return this._toxicity;
    }

    public get diverOptions(): DiverOptions {
        return new DiverOptions(this.options, this._diver);
    }

    public get maxEND(): number {
        const source = this.options.maxEND;
        return this.units.fromMeters(source);
    }

    public get lastStopDepth(): number {
        const source = this.options.lastStopDepth;
        return this.units.fromMeters(source);
    }

    public get descentSpeed(): number {
        const source = this.options.descentSpeed;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed6m(): number {
        const source = this.options.ascentSpeed6m;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed50percTo6m(): number {
        const source = this.options.ascentSpeed50percTo6m;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed50perc(): number {
        const source = this.options.ascentSpeed50perc;
        return this.units.fromMeters(source);
    }

    public get altitude(): number {
        const source = this.options.altitude;
        return this.units.fromMeters(source);
    }

    public get gasSwitchDuration(): number {
        return this.options.gasSwitchDuration;
    }

    public get gfLow(): number {
        return this.options.gfLow;
    }

    public get gfHigh(): number {
        return this.options.gfHigh;
    }

    public get maxDecoPpO2(): number {
        return this.options.maxDecoPpO2;
    }

    public get maxPpO2(): number {
        return this.options.maxPpO2;
    }

    public get oxygenNarcotic(): boolean {
        return this.options.oxygenNarcotic;
    }

    public get problemSolvingDuration(): number {
        return this.options.problemSolvingDuration;
    }

    public get roundStopsToMinutes(): boolean {
        return this.options.roundStopsToMinutes;
    }

    public get safetyStop(): SafetyStop {
        return this.options.safetyStop;
    }

    public get salinity(): Salinity {
        return this.options.salinity;
    }

    public get safetyAutoName(): string {
        const level = this.units.defaults.autoStopLevel;
        return `Auto (> ${level} ${this.units.length})`;
    }

    public get safetyStopOption(): string {
        switch (this.options.safetyStop) {
            case SafetyStop.never:
                return this.safetyOffName;
            case SafetyStop.always:
                return this.safetyOnName;
            default:
                return this.safetyAutoName;
        }
    }

    public set maxEND(newValue: number) {
        this.options.maxEND = this.units.toMeters(newValue);
    }

    public set lastStopDepth(newValue: number) {
        this.options.lastStopDepth = this.units.toMeters(newValue);
    }

    public set descentSpeed(newValue: number) {
        const converted = this.units.toMeters(newValue);
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.descentSpeed = converted;
    }

    public set ascentSpeed6m(newValue: number) {
        const converted = this.units.toMeters(newValue);
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.ascentSpeed6m = converted;
    }

    public set ascentSpeed50percTo6m(newValue: number) {
        const converted = this.units.toMeters(newValue);
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.ascentSpeed50percTo6m = converted;
    }

    public set ascentSpeed50perc(newValue: number) {
        const converted = this.units.toMeters(newValue);

        // somehow noticed frozen UI in case copy/paste 0 into the asc/desc fields
        // not need to be converted by units since for our use case need at least some finite value
        if (converted < OptionsService.minimumSpeed) {
            return;
        }

        this.options.ascentSpeed50perc = converted;
    }

    public set altitude(newValue: number) {
        this.options.altitude = this.units.toMeters(newValue);
    }

    public set gasSwitchDuration(newValue: number) {
        this.options.gasSwitchDuration = newValue;
    }

    public set gfLow(newValue: number) {
        this.options.gfLow = newValue;
    }

    public set gfHigh(newValue: number ){
        this.options.gfHigh = newValue;
    }

    public set maxDecoPpO2(newValue: number) {
        this.options.maxDecoPpO2 = newValue;
    }

    public set maxPpO2(newValue: number) {
        this.options.maxPpO2 = newValue;
    }

    public set oxygenNarcotic(newValue: boolean) {
        this.options.oxygenNarcotic = newValue;
    }

    public set problemSolvingDuration(newValue: number) {
        this.options.problemSolvingDuration = newValue;
    }

    public set roundStopsToMinutes(newValue: boolean) {
        this.options.roundStopsToMinutes = newValue;
    }

    public set safetyStop(newValue: SafetyStop) {
        this.options.safetyStop = newValue;
    }

    public set salinity(newValue: Salinity) {
        this.options.salinity = newValue;
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
    }

    public useSafetyAuto(): void {
        this.options.safetyStop = SafetyStop.auto;
    }

    public useSafetyOn(): void {
        this.options.safetyStop = SafetyStop.always;
    }

    public loadFrom(newOptions: Options, diver: Diver): void {
        this.options.loadFrom(newOptions);
        const newDiver = new DiverOptions(newOptions, diver);
        this.applyDiver(newDiver);
        this.dispatcher.sendOptionsReloaded(this);
    }

    public applyDiver(diver: DiverOptions): void {
        this.diverOptions.loadFrom(diver);
    }

    public resetToSimple(): void {
        const foundGfLabel = this.standardGradients.labelFor(this.gfLow, this.gfHigh);
        if(foundGfLabel === '') {
            OptionDefaults.setMediumConservatism(this.options);
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

    private applyValues(newValues: DefaultOptions): void {
        this.options.ascentSpeed50perc = this.units.toMeters(newValues.ascentSpeed50perc);
        this.options.ascentSpeed50percTo6m = this.units.toMeters(newValues.ascentSpeed50percTo6m);
        this.options.ascentSpeed6m = this.units.toMeters(newValues.ascentSpeed6m);
        this.options.descentSpeed = this.units.toMeters(newValues.descentSpeed);
        this.options.lastStopDepth = this.units.toMeters(newValues.lastStopDepth);
        this.options.maxEND =this.units.toMeters(newValues.maxEND);
        OptionDefaults.useGeneralRecommended(this.options);
    }
}
