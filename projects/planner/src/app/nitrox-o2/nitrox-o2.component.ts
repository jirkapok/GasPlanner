import { Component, Input } from '@angular/core';
import { StandardGases, Tank } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-nitrox-o2',
    templateUrl: './nitrox-o2.component.html',
    styleUrls: ['./nitrox-o2.component.css']
})
export class NitroxO2Component {
    @Input()
    public tank = new Tank(15, 200, 21);
    @Input()
    public showBestMix = true;
    public nitroxNames: string[];

    constructor(public units: UnitConversion) {
        this.nitroxNames = StandardGases.nitroxNames();
    }

    public gasChanged(): void {
        // TODO gasChanged
    }

    public assignBestMix(): void {
        // TODO assignBestMix
    }

    public assignStandardGas(stgas: string): void {
        // TODO assignStandardGas
    }
}
