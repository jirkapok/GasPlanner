import { Component, Input } from '@angular/core';
import { Tank } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { PlannerService } from '../shared/planner.service';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-gaslabel',
    templateUrl: './gaslabel.component.html',
    styleUrls: ['./gaslabel.component.css']
})
export class GaslabelComponent {
    @Input()
    public tank: Tank = Tank.createDefault();

    @Input()
    public showName = true;

    private toxicity = new GasToxicity();

    constructor(public units: UnitConversion) { }

    public get gasMod(): number {
        const mod = this.toxicity.modForGas(this.tank);
        return this.units.fromMeters(mod);
    }

    // TODO fix rounding of MOD and MND to pessimistic number for EAN33 the depth should be 30 m only
    public get gasMnd(): number {
        const mnd = this.toxicity.mndForGas(this.tank.gas);
        return this.units.fromMeters(mnd);
    }

    public get isTrimix(): boolean {
        return this.tank.he > 0;
    }

    public get gasDecoMod(): number {
        const mod = this.toxicity.switchDepth(this.tank);
        return this.units.fromMeters(mod);
    }
}
