import { Injectable } from '@angular/core';
import { UnitConversion } from './UnitConversion';
import { AppSettings } from './models';

@Injectable()
export class ApplicationSettingsService {
    public appSettings = new AppSettings();

    constructor(private units: UnitConversion) {
    }

    public get maxGasDensity(): number {
        return this.units.fromGramPerLiter(this.appSettings.maxGasDensity);
    }

    public set maxGasDensity(value: number) {
        this.appSettings.maxGasDensity = this.units.toGramPerLiter(value);
    }
}
