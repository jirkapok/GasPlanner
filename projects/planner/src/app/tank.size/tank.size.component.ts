import { Component } from '@angular/core';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { TankTemplate } from 'scuba-physics';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-tank-size',
    templateUrl: './tank.size.component.html',
    styleUrls: ['./tank.size.component.scss']
})
export class TankSizeComponent {
    public sizeForm = new FormGroup({
        tankSize: new FormControl('')
    });

    constructor(private units: UnitConversion) { }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get allDefaultTanks(): TankTemplate[] {
        return this.units.defaults.tanks.available;
    }

    public tankSizeInvalid(): boolean {
        // const tank = this.tanksGroup.at(index);
        // return this.inputs.controlInValid(tank.controls.tankSize);
        return false;
    }

    public sizeChanged(): void {
    }

    public assignTankTemplate(template: TankTemplate): void {
        // const bound = this.tanks[index];
        // bound.assignTemplate(template);
        // this.reload(bound, index);
        // this.delayedCalc.schedule();
    }
}
