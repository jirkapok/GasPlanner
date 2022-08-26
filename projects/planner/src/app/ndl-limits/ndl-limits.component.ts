import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faTable, faCog } from '@fortawesome/free-solid-svg-icons';
import { Options, Tank, Time } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { NdlLimit, NdlService } from '../shared/ndl.service';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { UnitConversion } from '../shared/UnitConversion';
import { TankBound } from '../tanks/tanks.component';


@Component({
    selector: 'app-ndl-limits',
    templateUrl: './ndl-limits.component.html',
    styleUrls: ['./ndl-limits.component.css']
})
export class NdlLimitsComponent {
    public icon = faTable;
    public iconConfig = faCog;
    public tank: TankBound;
    public options: Options;
    public totalDuration = Time.oneDay;
    public isComplex = false;
    public limits: NdlLimit[] = [];
    public toxicity: GasToxicity;

    constructor(private router: Router, public units: UnitConversion,
        private ndl: NdlService, optionsService: OptionsDispatcherService) {
        this.tank = new TankBound(new Tank(15, 200, 21), this.units);
        this.options = new Options();
        this.copyOptions(optionsService);
        this.toxicity = new GasToxicity(this.options);
        this.calculate();
    }

    public get noResults(): boolean {
        return this.limits.length === 0;
    }

    public calculate(): void {
        this.limits = this.ndl.calculate(this.tank.tank.gas, this.options);
        const indexOffset = 4; // 4 times the minimum 3 m depth (= 12 m)

        for(let index = 0; index < this.limits.length; index++) {
            // convert meters to target unit
            const limit = this.limits[index];
            limit.depth = this.units.stopsDistance * (index + indexOffset);
        }
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    private copyOptions(optionsService: OptionsDispatcherService): void {
        this.options.gfLow = optionsService.gfLow;
        this.options.gfHigh = optionsService.gfHigh;
        this.options.salinity = optionsService.salinity;
        // Altitude already converted to metric value in its component
        this.options.altitude = optionsService.altitude;
        this.options.maxPpO2 = optionsService.maxPpO2;
    }
}
