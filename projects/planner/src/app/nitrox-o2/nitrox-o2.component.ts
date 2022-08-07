import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StandardGases, Tank } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-nitrox-o2',
    templateUrl: './nitrox-o2.component.html',
    styleUrls: ['./nitrox-o2.component.css']
})
export class NitroxO2Component {
    // TODO consider get rid of tank
    @Input()
    public tank = new Tank(15, 200, 21);
    @Input()
    public showBestMix = true;

    @Output()
    public gasChange = new EventEmitter();

    @Output()
    public assignBestMix = new EventEmitter();

    public nitroxNames: string[];

    constructor(public units: UnitConversion) {
        this.nitroxNames = StandardGases.nitroxNames();
    }

    public fireAssignBestMix(): void {
        this.assignBestMix.emit();
    }

    public fireGasChanged(): void {
        this.gasChange.emit();
    }

    public assignStandardGas(gasName: string): void {
        this.tank.assignStandardGas(gasName);
        this.fireGasChanged();
    }
}
