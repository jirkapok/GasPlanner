import {Component, OnInit} from '@angular/core';
import { Location } from '@angular/common';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup, NonNullableFormBuilder} from '@angular/forms';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { TankBound } from '../shared/models';
import { TankTemplate, Tank, Precision } from 'scuba-physics';
import {ValidatorGroups} from '../shared/ValidatorGroups';
import {InputControls} from '../shared/inputcontrols';

interface RedundanciesForm {
    firstTankSize: FormControl<number>;
    firstTankPressure: FormControl<number>;
    firstTankWorkPressure?: FormControl<number>;
    secondTankSize: FormControl<number>;
    secondTankPressure: FormControl<number>;
    secondTankWorkPressure?: FormControl<number>;
}
@Component({
    selector: 'app-redundancies',
    templateUrl: './redundancies.component.html',
    styleUrls: ['./redundancies.component.scss']
})
export class RedundanciesComponent implements OnInit {
    public calcIcon = faCalculator;
    public redForm!: FormGroup<RedundanciesForm>;
    public firstTank: TankBound;
    public secondTank: TankBound;

    constructor(public location: Location,
        public units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private validators: ValidatorGroups,
        private inputs: InputControls,) {
        this.firstTank = new TankBound(Tank.createDefault(), this.units);
        this.secondTank = new TankBound(Tank.createDefault(), this.units);
        this.secondTank.size = 10;
        this.secondTank.startPressure = 100;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get finalPressure(): number {
        return 0;
    }

    public get firstTankSizeInvalid(): boolean {
        const firstTankSize = this.redForm.controls.firstTankSize;
        return this.inputs.controlInValid(firstTankSize);
    }

    public get firstTankWorkPressureInvalid(): boolean {
        const firstTankWorkPressure = this.redForm.controls.firstTankWorkPressure;
        return this.inputs.controlInValid(firstTankWorkPressure);
    }

    public get firstTankPressureInvalid(): boolean {
        const firstTankPressure = this.redForm.controls.firstTankPressure;
        return this.inputs.controlInValid(firstTankPressure);
    }

    public get secondTankSizeInvalid(): boolean {
        const secondTankSize = this.redForm.controls.secondTankSize;
        return this.inputs.controlInValid(secondTankSize);
    }

    public get secondTankWorkPressureInvalid(): boolean {
        const secondTankWorkPressure = this.redForm.controls.secondTankWorkPressure;
        return this.inputs.controlInValid(secondTankWorkPressure);
    }

    public get secondTankPressureInvalid(): boolean {
        const secondTankPressure = this.redForm.controls.secondTankPressure;
        return this.inputs.controlInValid(secondTankPressure);
    }

    public ngOnInit(): void {
        // TODO load/save viewState

        this.redForm = this.fb.group({
            firstTankSize: [Precision.round(this.firstTank.size, 1), this.validators.tankSize],
            firstTankPressure: [Precision.round(this.firstTank.startPressure, 1), this.validators.tankPressure],
            secondTankSize: [Precision.round(this.secondTank.size, 1), this.validators.tankSize],
            secondTankPressure: [Precision.round(this.secondTank.startPressure, 1), this.validators.tankPressure],
        });

        if(this.units.imperialUnits) {
            const firstTankWorkPressure = this.fb.control(
                Precision.round(this.firstTank.workingPressure, 1), this.validators.tankPressure);
            this.redForm.addControl('firstTankWorkPressure', firstTankWorkPressure);
            const secondTankWorkPressure = this.fb.control(
                Precision.round(this.secondTank.workingPressure, 1), this.validators.tankPressure);
            this.redForm.addControl('secondTankWorkPressure', secondTankWorkPressure);
        }
    }

    public applyTemplate(template: TankTemplate, tank: TankBound): void {
        if(this.redForm.invalid) {
            return;
        }

        tank.workingPressure = template.workingPressure;

        this.redForm.patchValue({
            firstTankWorkPressure: this.firstTank.workingPressure,
            secondTankWorkPressure: this.secondTank.workingPressure,
        });

        this.inputChanged();
    }

    public inputChanged(): void {
        if(this.redForm.invalid) {
            return;
        }

        const values = this.redForm.value;
        // TODO apply all values
    }
}
