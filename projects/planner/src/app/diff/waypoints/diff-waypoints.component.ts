import { Component } from "@angular/core";
import { UnitConversion } from "../../shared/UnitConversion";

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss']
})
export class WaypointsDifferenceComponent{

    constructor(
        private units: UnitConversion
   ){}

    public get imperialUnits(): boolean {
        return this.units.imperialUnits;
    }
}