import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator, faTable } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl, AbstractControl
} from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import {
    Precision, Tank, AirWeight
} from 'scuba-physics';
import { KnownViews } from '../shared/viewStates';
import { WeightViewState } from '../shared/views.model';
import { SubViewStorage } from '../shared/subViewStorage';
import { TankBound } from '../shared/models';

interface GasForm {
    o2: FormControl<number>;
    he: FormControl<number>;
    depth: FormControl<number>;
}

@Component({
    selector: 'app-gas-props-calc',
    templateUrl: './gas.props.component.html',
    styleUrls: ['./gas.props.component.scss']
})
export class GasPropertiesCalcComponent implements OnInit {
    public calcIcon = faCalculator;
    public tableIcon = faTable;
    public gasForm!: FormGroup<GasForm>;
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

    public get gasHeInvalid(): boolean {
        const heControl = this.gasForm.controls.he;
        return this.inputs.controlInValid(heControl);
    }

    public get depthInvalid(): boolean {
        const depthControl = this.gasForm.controls.depth;
        return this.inputs.controlInValid(depthControl);
    }

    public get nitrox(): number {
        return this.tank.n2;
    }

    public get consumed(): number {
        const bars = this.tank.tank.consumed;
        return this.units.fromBar(bars);
    }

    public ngOnInit(): void {
        this.gasForm = this.fb.group({
            o2: [this.tank.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            he: [this.tank.he, this.validators.rangeFor(this.ranges.tankHe)],
            depth: [1, this.validators.rangeFor(this.ranges.depth)], // TDDO consider change range from 0
        });
    }

    public standardGasApplied(): void {
        if (this.gasForm.invalid) {
            return;
        }

        this.reloadContent();
        this.saveState();
    }

    public inputChanged(): void {
        if (this.gasForm.invalid) {
            return;
        }

        const values = this.gasForm.value;
        this.tank.o2 = Number(values.o2);
        this.tank.he = Number(values.he);
        this.reloadContent();
        this.saveState();
    }

    // TODO snap nitrox to reflect air 20.9% but showing 21
    // TODO fix validation of depth from 0
    private reloadContent(): void {
        // because they affect each other
        this.gasForm.patchValue({
            o2: this.tank.o2,
            he: this.tank.he,
        });
    }

    private loadState(): void {
        // let state: WeightViewState = this.viewStates.loadView(KnownViews.weight);

        // if (!state) {
        //     state = this.createState();
        // }

        // this.tank.tank.size = state.tankSize;
        // const workPressure = this.units.fromBar(state.workPressure);
        // this.setWorkingPressure(workPressure);
        // this.tank.tank.consumed = state.consumed;
    }

    private saveState(): void {
        // const viewState = this.createState();
        // this.viewStates.saveView(viewState);
    }

    // private createState(): WeightViewState {
    //     const tank = this.tank.tank;
    //     return {
    //         tankSize: tank.size,
    //         workPressure: this.tank.workingPressureBars,
    //         consumed: tank.consumed,
    //         id: KnownViews.weight
    //     };
    // }
}
