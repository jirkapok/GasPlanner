import { Injectable, EventEmitter } from '@angular/core';
import { Diver, OptionDefaults, Options, SafetyStop, Salinity } from 'scuba-physics';

@Injectable({
    providedIn: 'root'
})
export class OptionsDispatcherService {
    public change = new EventEmitter<Options>();
    private options = new Options();

    constructor() {
        // To be aligned with planner
        this.options.salinity = Salinity.fresh;
        this.options.safetyStop = SafetyStop.auto;
    }

    public get altitude(): number {
        return this.options.altitude;
    }

    public get ascentSpeed50perc(): number {
        return this.options.ascentSpeed50perc;
    }

    public get ascentSpeed50percTo6m(): number {
        return this.options.ascentSpeed50percTo6m;
    }

    public get ascentSpeed6m(): number {
        return this.options.ascentSpeed6m;
    }

    public get decoStopDistance(): number {
        return this.options.decoStopDistance;
    }

    public get descentSpeed(): number {
        return this.options.descentSpeed;
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

    public get lastStopDepth(): number {
        return this.options.lastStopDepth;
    }

    public get maxDecoPpO2(): number {
        return this.options.maxDecoPpO2;
    }

    public get maxEND(): number {
        return this.options.maxEND;
    }

    public get maxPpO2(): number {
        return this.options.maxPpO2;
    }

    public get minimumAutoStopDepth(): number {
        return this.options.minimumAutoStopDepth;
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



    public set altitude(newValue: number) {
        this.options.altitude = newValue;
        this.fireChange();
    }

    public set ascentSpeed50perc(newValue: number) {
        // somehow noticed frozen UI in case copy/paste 0 into the asc/desc fields
        if (newValue < 1) {
            return;
        }

        this.options.ascentSpeed50perc = newValue;
        this.fireChange();
    }

    public set ascentSpeed50percTo6m(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.options.ascentSpeed50percTo6m = newValue;
        this.fireChange();
    }

    public set ascentSpeed6m(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.options.ascentSpeed6m = newValue;
        this.fireChange();
    }

    public set decoStopDistance(newValue: number) {
        this.options.decoStopDistance = newValue;
        this.fireChange();
    }

    public set descentSpeed(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.options.descentSpeed = newValue;
        this.fireChange();
    }

    public set gasSwitchDuration(newValue: number) {
        this.options.gasSwitchDuration = newValue;
        this.fireChange();
    }

    public set gfLow(newValue: number) {
        this.options.gfLow = newValue;
        this.fireChange();
    }

    public set gfHigh(newValue: number ){
        this.options.gfHigh = newValue;
        this.fireChange();
    }

    public set lastStopDepth(newValue: number) {
        this.options.lastStopDepth = newValue;
        this.fireChange();
    }

    public set maxDecoPpO2(newValue: number) {
        this.options.maxDecoPpO2 = newValue;
        this.fireChange();
    }

    public set maxEND(newValue: number) {
        this.options.maxEND = newValue;
        this.fireChange();
    }

    public set maxPpO2(newValue: number) {
        this.options.maxPpO2 = newValue;
        this.fireChange();
    }

    public set minimumAutoStopDepth(newValue: number) {
        this.options.minimumAutoStopDepth = newValue;
        this.fireChange();
    }

    public set oxygenNarcotic(newValue: boolean) {
        this.options.oxygenNarcotic = newValue;
        this.fireChange();
    }

    public set problemSolvingDuration(newValue: number) {
        this.options.problemSolvingDuration = newValue;
        this.fireChange();
    }

    public set roundStopsToMinutes(newValue: boolean) {
        this.options.roundStopsToMinutes = newValue;
        this.fireChange();
    }

    public set safetyStop(newValue: SafetyStop) {
        this.options.safetyStop = newValue;
        this.fireChange();
    }

    public set salinity(newValue: Salinity) {
        this.options.salinity = newValue;
        this.fireChange();
    }

    public useRecreational(): void {
        OptionDefaults.useRecreational(this.options);
        this.fireChange();
    }

    public useRecommended(): void {
        OptionDefaults.useRecommended(this.options);
        this.fireChange();
    }

    public useSafetyOff(): void {
        this.options.safetyStop = SafetyStop.never;
        this.fireChange();
    }

    public useSafetyAuto(): void {
        this.options.safetyStop = SafetyStop.auto;
        this.fireChange();
    }

    public useSafetyOn(): void {
        this.options.safetyStop = SafetyStop.always;
        this.fireChange();
    }

    public loadFrom(newOptions: Options): void {
        this.options.loadFrom(newOptions);
    }

    public applyDiver(diver: Diver): void {
        this.options.maxPpO2 = diver.maxPpO2;
        this.options.maxDecoPpO2 = diver.maxDecoPpO2;
    }

    public resetToSimple(): void {
        OptionDefaults.setMediumConservatism(this.options);
        this.change.emit(this.options);
    }

    public getOptions(): Options {
        return this.options;
    }

    private fireChange(): void {
        this.change.emit(this.options);
    }
}
