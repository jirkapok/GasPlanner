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

    public set maxGasDensity(value: number) {
        this.appSettings.maxGasDensity = this.units.toGramPerLiter(value);
    }

    public loadFrom(maxDensity: number): void {
        this.settings.maxGasDensity = maxDensity;
    }
}
