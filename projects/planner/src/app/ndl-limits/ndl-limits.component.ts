import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faTable, faCog } from '@fortawesome/free-solid-svg-icons';
import { Options, Tank, Time } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { NdlLimit, NdlService } from '../shared/ndl.service';
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

    constructor(private router: Router, public units: UnitConversion, private ndl: NdlService) {
        this.tank = new TankBound(new Tank(15, 200, 21), this.units);
        this.options = new Options();
        this.toxicity = new GasToxicity(this.options);
        this.calculate();
    }

    public get noResults(): boolean {
        return this.limits.length === 0;
    }

    public calculate(): void {
        // TODO depths return need to be converted to defined units
        this.limits = this.ndl.calculate(this.tank.tank.gas, this.options);
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }
}
