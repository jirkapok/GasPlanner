import { Component, Input } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Tank } from 'scuba-physics';
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

    public get gasMod(): number {
        return this.planer.modForGas(this.tank);
    }

    public get gasMnd(): number {
        const maxEnd = this.planer.options.maxEND;
        const oxygenNarcotic = this.planer.options.oxygenNarcotic;
        const mnd = this.tank.gas.mnd(maxEnd, oxygenNarcotic);
        return mnd;
    }

    public get isTrimix(): boolean {
        return this.tank.he > 0;
    }

    public get gasDecoMod(): number {
        return this.planer.switchDepth(this.tank);
    }

    constructor(private planer: PlannerService, public units: UnitConversion) { }
}
