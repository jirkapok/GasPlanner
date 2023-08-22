import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { faTable, faCog } from '@fortawesome/free-solid-svg-icons';
import { Options, Salinity, Tank, Time } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { NdlLimit, NdlService } from '../shared/ndl.service';
import { OptionsService } from '../shared/options.service';
import { Gradients } from '../shared/standard-gradients.service';
import { UnitConversion } from '../shared/UnitConversion';
import { TankBound } from '../shared/models';
import { SubViewComponent } from '../shared/subView';

@Component({
    selector: 'app-ndl-limits',
    templateUrl: './ndl-limits.component.html',
    styleUrls: ['./ndl-limits.component.scss']
})
export class NdlLimitsComponent extends SubViewComponent {
    public icon = faTable;
    public iconConfig = faCog;
    public tank: TankBound;
    public options: Options;
    public totalDuration = Time.oneDay;
    public isComplex = false;
    public limits: NdlLimit[] = [];
    public toxicity: GasToxicity;

    constructor(
        public units: UnitConversion,
        private ndl: NdlService,
        optionsService: OptionsService,
        location: Location) {
        super(location);
        this.tank = new TankBound(Tank.createDefault(), this.units);
        const defaultTanks = this.units.defaults.tanks;
        this.tank.workingPressure = defaultTanks.primary.workingPressure;
        this.tank.size = defaultTanks.primary.size;
        this.options = new Options();
        this.options.loadFrom(optionsService.getOptions());
        this.toxicity = new GasToxicity(this.options);
        this.calculate();
    }

    public get noResults(): boolean {
        return this.limits.length === 0;
    }

    public calculate(): void {
        this.limits = this.ndl.calculate(this.tank.tank.gas, this.options);
        const indexOffset = 4; // 4 times the minimum 3 m depth (= 12 m)

        for (let index = 0; index < this.limits.length; index++) {
            // convert meters to target unit
            const limit = this.limits[index];
            limit.depth = this.units.defaults.stopsDistance * (index + indexOffset);
        }
    }

    public ppO2Changed(newValue: number): void {
        this.options.maxPpO2 = newValue;
        this.calculate();
    }

    public salinityChanged(newValue: Salinity): void {
        this.options.salinity = newValue;
        this.calculate();
    }

    public altitudeChanged(newValue: number): void {
        this.options.altitude = newValue;
        this.calculate();
    }

    public gradientsChanged(gf: Gradients): void {
        this.options.gfLow = gf.gfLow;
        this.options.gfHigh = gf.gfHeigh;
        this.calculate();
    }
}
