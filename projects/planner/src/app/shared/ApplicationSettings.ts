import { Injectable } from '@angular/core';
import { UnitConversion } from './UnitConversion';
import { AppSettings } from './models';

// TODO AppSettings:
// * Don't add to url
// * Add to application serialization settings
// * Define imperial range
// * Apply by component
// * Add save and load last from state
// * Apply to algorithm
// * Define Step and precision rounding for UI (imperial needs more precision)
// * add to normalization service

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
