import { Component } from '@angular/core';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { PlannerService } from '../shared/planner.service';
import { Diver } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.css']
})
export class DiverComponent{
    public diver: Diver;
    public icon = faUserCog;

    constructor(private planer: PlannerService, public units: UnitConversion) {
        this.diver = this.planer.diver;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }
}
