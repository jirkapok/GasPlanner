import { Component, Input } from '@angular/core';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { Diver } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.css']
})
export class DiverComponent{
    @Input() public diver: Diver = new Diver();
    @Input() public ranges: RangeConstants;
    public icon = faUserCog;

    constructor(public units: UnitConversion) {
        this.ranges = units.ranges;
    }

    public get rmv(): number {
        const rmvMetric = this.diver.rmv;
        return this.units.fromLiter(rmvMetric);
    }

    public set rmv(newValue: number) {
        this.diver.rmv = this.units.toLiter(newValue);
    }
}
