import { Component, Input } from '@angular/core';
import { Precision, Tank } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
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

    @Input()
    public toxicity = new GasToxicity();

    constructor(public units: UnitConversion) { }

    public get gasMod(): number {
        const mod = this.toxicity.modForGas(this.tank);
        const result = this.units.fromMeters(mod);
        return Precision.floor(result);
    }

    public get gasMnd(): number {
        const mnd = this.toxicity.mndForGas(this.tank.gas);
        const result = this.units.fromMeters(mnd);
        return Precision.floor(result);
    }

    public get isTrimix(): boolean {
        return this.tank.he > 0;
    }

    public get gasDecoMod(): number {
        const mod = this.toxicity.switchDepth(this.tank);
        const result = this.units.fromMeters(mod);
        return Precision.floor(result);
    }
}
