import { Injectable } from '@angular/core';
import { UnitConversion } from './UnitConversion';
import { AppSettings } from './models';
import { GasDensity } from 'scuba-physics';
import { AppOptionsDto } from './serialization.model';

@Injectable()
export class ApplicationSettingsService {
    public appSettings = new AppSettings();

    constructor(private units: UnitConversion) {
    }

    /** in metric **/
    public get settings(): AppSettings {
        return this.appSettings;
    }

    /** in current units **/
    public get maxGasDensity(): number {
        return this.units.fromGramPerLiter(this.appSettings.maxGasDensity);
    }

    public get primaryTankReserve(): number {
        return this.units.fromBar(this.appSettings.primaryTankReserve);
    }

    public get stageTankReserve(): number {
        return this.units.fromBar(this.appSettings.stageTankReserve);
    }

    /** in current units **/
    public get defaultMaxGasDensity(): number {
        return this.units.fromGramPerLiter(GasDensity.recommendedMaximum);
    }

    public get icdIgnored(): boolean {
        return this.appSettings.icdIgnored;
    }

    public get densityIgnored(): boolean {
        return this.appSettings.densityIgnored;
    }

    public get noDecoIgnored(): boolean {
        return this.appSettings.noDecoIgnored;
    }

    public set maxGasDensity(value: number) {
        this.appSettings.maxGasDensity = this.units.toGramPerLiter(value);
    }

    public set primaryTankReserve(newValue: number) {
        this.appSettings.primaryTankReserve = this.units.toBar(newValue);
    }

    public set stageTankReserve(newValue: number) {
        this.appSettings.stageTankReserve = this.units.toBar(newValue);
    }

    public set icdIgnored(newValue: boolean) {
        this.appSettings.icdIgnored = newValue;
    }

    public set densityIgnored(newValue: boolean) {
        this.appSettings.densityIgnored = newValue;
    }

    public set noDecoIgnored(newValue: boolean) {
        this.appSettings.noDecoIgnored = newValue;
    }

    public loadFrom(source: AppOptionsDto): void {
        this.settings.maxGasDensity = source.maxDensity || GasDensity.recommendedMaximum;
        this.settings.primaryTankReserve = source.primaryTankReserve || AppSettings.defaultPrimaryReserve;
        this.settings.stageTankReserve = source.stageTankReserve || AppSettings.defaultStageReserve;
        this.settings.icdIgnored = source.icdIgnored || false;
        this.settings.densityIgnored = source.densityIgnored || false;
        this.settings.noDecoIgnored = source.noDecoIgnored || false;
    }
}
