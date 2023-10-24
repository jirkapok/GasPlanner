import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { TankBound } from '../shared/models';
import { Tank, TankTemplate } from 'scuba-physics';

@Component({
    selector: 'app-redundancies',
    templateUrl: './redundancies.component.html',
    styleUrls: ['./redundancies.component.scss']
})
export class RedundanciesComponent {
    public calcIcon = faCalculator;
    public redForm!: FormGroup<any>;
    public tankA: TankBound;

    constructor(public location: Location,
        public units: UnitConversion,
        private fb: FormBuilder) {
        this.tankA = new TankBound(Tank.createDefault(), this.units);
        this.redForm = this.fb.group([]);
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get finalPressure(): number {
        return 0;
    }

    public get tankASizeInvalid(): boolean {
        return false;
    }

    public applyTemplate(template: TankTemplate): void  {
    }

    public inputChanged(): void {

    }
}
