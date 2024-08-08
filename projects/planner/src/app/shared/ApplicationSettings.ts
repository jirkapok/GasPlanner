import { Injectable } from '@angular/core';
import { UnitConversion } from './UnitConversion';
import { GasDensity } from 'scuba-physics';

// TODO AppSettings:
// * add to normalization service
// * Add to application serialization settings
// * Don't add to url

export class AppSettings {
    public maxGasDensity = GasDensity.recommendedMaximum;
    public priamryTankReserve = 30;
    public stageTankReserve = 30;
}

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
