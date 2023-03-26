import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Diver, OptionDefaults, Options, SafetyStop, Salinity } from 'scuba-physics';
import { StandardGradientsService } from './standard-gradients.service';

@Injectable()
export class OptionsService {
    public reloaded$: Observable<unknown>;
    private standardGradients = new StandardGradientsService();
    private options = new Options();
    private onReloaded = new Subject<void>();

    constructor() {
        // To be aligned with planner
        this.options.salinity = Salinity.fresh;
        this.options.safetyStop = SafetyStop.auto;
        this.reloaded$ = this.onReloaded.asObservable();
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
    }

    public set ascentSpeed50perc(newValue: number) {
        // somehow noticed frozen UI in case copy/paste 0 into the asc/desc fields
        // not need to be converted by units since for our use case need at least some finite value
        if (newValue < 1) {
            return;
        }

        this.options.ascentSpeed50perc = newValue;
    }

    public set ascentSpeed50percTo6m(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.options.ascentSpeed50percTo6m = newValue;
    }

    public set ascentSpeed6m(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.options.ascentSpeed6m = newValue;
    }

    public set decoStopDistance(newValue: number) {
        this.options.decoStopDistance = newValue;
    }

    public set descentSpeed(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.options.descentSpeed = newValue;
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

    public set lastStopDepth(newValue: number) {
        this.options.lastStopDepth = newValue;
    }

    public set maxDecoPpO2(newValue: number) {
        this.options.maxDecoPpO2 = newValue;
    }

    public set maxEND(newValue: number) {
        this.options.maxEND = newValue;
    }

    public set maxPpO2(newValue: number) {
        this.options.maxPpO2 = newValue;
    }

    public set minimumAutoStopDepth(newValue: number) {
        this.options.minimumAutoStopDepth = newValue;
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
        OptionDefaults.useRecreational(this.options);
    }

    public useRecommended(): void {
        OptionDefaults.useRecommended(this.options);
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

    public loadFrom(newOptions: Options): void {
        this.options.loadFrom(newOptions);
        this.onReloaded.next();
    }

    public applyDiver(diver: Diver): void {
        this.options.maxPpO2 = diver.maxPpO2;
        this.options.maxDecoPpO2 = diver.maxDecoPpO2;
    }

    public resetToSimple(): void {
        const foundGfLabel = this.standardGradients.labelFor(this.gfLow, this.gfHigh);
        if(foundGfLabel === '') {
            // TODO needs to be rounded to units
            OptionDefaults.setMediumConservatism(this.options);
        }
    }

    // didn't use inheritance to be able override some properties
    // can be considered later
    public getOptions(): Options {
        return this.options;
    }
}
