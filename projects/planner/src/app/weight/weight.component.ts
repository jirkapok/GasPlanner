import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl, AbstractControl
} from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import {
    Precision, Tank, TankTemplate, AirWeight
} from 'scuba-physics';
import { KnownViews } from '../shared/viewStates';
import { WeightViewState } from '../shared/views.model';
import { SubViewStorage } from '../shared/subViewStorage';
import { TankBound } from '../shared/models';

interface WeightForm {
    workPressure?: FormControl<number>;
    consumed: FormControl<number>;
}

@Component({
    selector: 'app-weight-calc',
    templateUrl: './weight.component.html',
    styleUrls: ['./weight.component.scss']
})
export class WeightCalcComponent implements OnInit {
    public calcIcon = faCalculator;
    public weightForm!: FormGroup<WeightForm>;
    public tank: TankBound;

    constructor(
        private fb: NonNullableFormBuilder,
        private validators: ValidatorGroups,
        private inputs: InputControls,
        public units: UnitConversion,
        public location: Location,
        private viewStates: SubViewStorage) {
        this.tank = new TankBound(Tank.createDefault(), this.units);
        this.loadState();
        this.saveState();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get consumedInvalid(): boolean {
        const depthControl = this.weightForm.controls.consumed;
        return this.inputs.controlInValid(depthControl);
    }

    public get workPressureInvalid(): boolean {
        const pressureControl = this.weightForm.controls.workPressure;
        return this.inputs.controlInValid(pressureControl);
    }

    public get tankSizeInvalid(): boolean {
        const tankSize = this.weightForm.get('tankSize') as AbstractControl;
        return this.inputs.controlInValid(tankSize);
    }

    public get weight(): number {
        let result = AirWeight.tankVolumeWeight(this.tank.tank);
        result = this.units.fromKilogram(result);
        return Precision.round(result, 1);
    }

    public get consumed(): number {
        const bars = this.tank.tank.consumed;
        return this.units.fromBar(bars);
    }

    public ngOnInit(): void {
        this.weightForm = this.fb.group({
            consumed: [this.consumed, this.validators.rangeFor(this.ranges.consumed)],
        });

        if(this.units.imperialUnits) {
            const workPressureControl = this.fb.control(
                Precision.round(this.tank.workingPressure, 1), this.validators.tankPressure);
            this.weightForm.addControl('workPressure', workPressureControl);
        }
    }

    public applyTemplate(template: TankTemplate): void {
        if (this.weightForm.invalid) {
            return;
        }

        this.weightForm.patchValue({
            workPressure: template.workingPressure,
        });

        this.inputChanged();
    }

    public inputChanged(): void {
        if (this.weightForm.invalid) {
            return;
        }

        const values = this.weightForm.value;
        const consumed = Number(values.consumed);
        this.tank.tank.consumed = this.units.toBar(consumed);
        this.setWorkingPressure(Number(values.workPressure));
        this.saveState();
    }

    private loadState(): void {
        let state: WeightViewState = this.viewStates.loadView(KnownViews.weight);

        if (!state) {
            state = this.createState();
        }

        this.tank.tank.size = state.tankSize;
        const workPressure = this.units.fromBar(state.workPressure);
        this.setWorkingPressure(workPressure);
        this.tank.tank.consumed = state.consumed;
    }

    private saveState(): void {
        const viewState = this.createState();
        this.viewStates.saveView(viewState);
    }

    private createState(): WeightViewState {
        const tank = this.tank.tank;
        return {
            tankSize: tank.size,
            workPressure: this.tank.workingPressureBars,
            consumed: tank.consumed,
            id: KnownViews.weight
        };
    }

    private setWorkingPressure(newValue: number): void {
        if(this.units.imperialUnits) {
            this.tank.workingPressure = Precision.round(newValue, 1);
        }
    }
}
