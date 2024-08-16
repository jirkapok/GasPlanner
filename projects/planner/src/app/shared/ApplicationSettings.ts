import { Injectable } from '@angular/core';
import { UnitConversion } from './UnitConversion';
import { AppSettings } from './models';
import { GasDensity } from 'scuba-physics';

@Injectable()
export class ApplicationSettingsService {
    public appSettings = new AppSettings();

    constructor(private units: UnitConversion) {
    }

    /** in metric **/
    public get settings(): AppSettings {
        return this.appSettings;
    }

    public get maxGasDensity(): number {
        return this.units.fromGramPerLiter(this.appSettings.maxGasDensity);
    }

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

    public set icdIgnored(newValue: boolean) {
        this.appSettings.icdIgnored = newValue;
    }

    public set densityIgnored(newValue: boolean) {
        this.appSettings.densityIgnored = newValue;
    }

    public set noDecoIgnored(newValue: boolean) {
        this.appSettings.noDecoIgnored = newValue;
    }

    public loadFrom(maxDensity: number): void {
        this.settings.maxGasDensity = maxDensity;
        // TODO add ignored issues and tank reserve
    }
}
