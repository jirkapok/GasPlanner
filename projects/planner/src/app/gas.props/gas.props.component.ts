import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator, faTable } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { KnownViews } from '../shared/viewStates';
import { GasViewState } from '../shared/views.model';
import { SubViewStorage } from '../shared/subViewStorage';
import { BoundGasProperties } from '../shared/gas.properties';
import { TextConstants } from '../shared/TextConstants';
import { Tank } from 'scuba-physics';

interface GasForm {
    o2: FormControl<number>;
    he: FormControl<number>;
    maxPO2: FormControl<number>;
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
    public calc: BoundGasProperties;
    public depthConverterWarning = TextConstants.depthConverterWarning;

    constructor(
        private fb: NonNullableFormBuilder,
        private validators: ValidatorGroups,
        private inputs: InputControls,
        public units: UnitConversion,
        public location: Location,
        private viewStates: SubViewStorage) {
        this.calc = new BoundGasProperties(this.units);
        this.loadState();
        this.saveState();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get tank(): Tank {
        return this.calc.tank;
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

    public ngOnInit(): void {
        this.gasForm = this.fb.group({
            o2: [this.tank.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            he: [this.tank.he, this.validators.rangeFor(this.ranges.tankHe)],
            maxPO2: [this.calc.maxPpO2, this.validators.rangeFor(this.ranges.ppO2)],
            // TODO consider change range from 0
            depth: [this.calc.depth, this.validators.rangeFor(this.ranges.depth)],
        });
    }

    public standardGasApplied(): void {
        if (this.gasForm.invalid) {
            return;
        }

        this.reloadContent();
        this.inputChanged();
        this.saveState();
    }

    public inputChanged(): void {
        if (this.gasForm.invalid) {
            return;
        }

        const values = this.gasForm.value;
        this.tank.o2 = Number(values.o2);
        this.tank.he = Number(values.he);
        this.calc.maxPpO2 = Number(values.maxPO2);
        this.calc.depth = Number(values.depth);
        this.reloadContent();
        this.saveState();
    }

    public switchOxygenNarcotic(): void {
        this.calc.switchOxygenNarcotic();
        this.saveState();
    }

    private reloadContent(): void {
        // because they affect each other
        this.gasForm.patchValue({
            o2: this.tank.o2,
            he: this.tank.he,
        });
    }

    private loadState(): void {
        let state: GasViewState = this.viewStates.loadView(KnownViews.gas);

        if (!state) {
            state = this.createState();
        }

        this.tank.he = state.he;
        this.tank.o2 =  state.o2;
        this.calc.maxPpO2 = state.maxPO2;
        this.calc.depth = this.units.fromMeters(state.depth);

        if(this.calc.oxygenNarcotic !== state.oxygenNarcotic) {
            this.calc.switchOxygenNarcotic();
        }
    }

    private saveState(): void {
        const viewState = this.createState();
        this.viewStates.saveView(viewState);
    }

    private createState(): GasViewState {
        return {
            o2: this.tank.o2,
            he: this.tank.he,
            maxPO2: this.calc.maxPpO2,
            depth: this.units.toMeters(this.calc.depth),
            oxygenNarcotic: this.calc.oxygenNarcotic,
            id: KnownViews.gas
        };
    }
}
