import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { Precision, AltitudeCalculator, Tank, TankTemplate } from 'scuba-physics';
import { KnownViews } from '../shared/viewStates';
import { AltitudeViewState } from '../shared/serialization.model';
import { SubViewStorage } from '../shared/subViewStorage';
import { TankBound } from '../shared/models';

interface WeightForm {
    pressure: FormControl<number>;
    actualDepth: FormControl<number>;
}

@Component({
    selector: 'app-weight-calc',
    templateUrl: './weight.component.html',
    styleUrls: ['./weight.component.scss']
})
export class WeightCalcComponent implements OnInit {
    public calcIcon = faCalculator;
    public weightForm!: FormGroup<WeightForm>;
    public calc = new AltitudeCalculator();
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

    // TODO
    public get workPressureInvalid(): boolean {
        const pressureControl = this.weightForm.controls.pressure;
        return this.inputs.controlInValid(pressureControl);
    }

    // TODO
    public get pressureInvalid(): boolean {
        const depthControl = this.weightForm.controls.actualDepth;
        return this.inputs.controlInValid(depthControl);
    }

    public get calcAltitude(): number {
        const uiAltitude = this.units.fromMeters(this.calc.altitude);
        return Precision.round(uiAltitude);
    }

    public get calcPressure(): number {
        const uiPressure = this.units.fromBar(this.calc.pressure);
        return Precision.round(uiPressure, 6);
    }

    public get calcAltitudeDepth(): number {
        const altitudeDepth = this.units.fromMeters(this.calc.altitudeDepth);
        return Precision.round(altitudeDepth, 0);
    }

    public get theoreticalDepth(): number {
        const depth = this.units.fromMeters(this.calc.theoreticalDepth);
        return Precision.round(depth, 2);
    }

    public firstTankSizeInvalid(): boolean {
        return false; // TODO tank size invalid
    }

    public ngOnInit(): void {
        this.weightForm = this.fb.group({
            pressure: [this.calcPressure, this.validators.rangeFor(this.ranges.altitudePressure)],
            actualDepth: [this.calcAltitudeDepth, this.validators.depth]
        });
    }

    public sizeChanged(): void {
        // TODO sizeChanged
    }

    public applyTemplate(template: TankTemplate): void {
        // TODO apply tank size template
    }

    // TODO replace
    public pressureChanged(): void {
        if (this.weightForm.invalid) {
            return;
        }

        const values = this.weightForm.value;
        const metricPressure = this.units.toBar(Number(values.pressure));
        this.calc.pressure = metricPressure;

        // this.weightForm.patchValue({
        //     altitude: this.calcAltitude
        // });

        this.saveState();
    }

    // TODO replace
    public altitudeChanged(newValue: number): void {
        if (this.weightForm.invalid) {
            return;
        }

        // already in metric
        // this.calc.altitude = newValue;
        this.saveState();
    }

    // TODO replace
    public inputChanged(): void {
        if (this.weightForm.invalid) {
            return;
        }

        const values = this.weightForm.value;
        const metricDepth = this.units.toMeters(Number(values.actualDepth));
        // this.calc.altitudeDepth = metricDepth;
        this.saveState();
    }

    // TODO implement save/load of state
    private loadState(): void {
        // let state: AltitudeViewState = this.viewStates.loadView(KnownViews.altitude);

        // if (!state) {
        //     state = this.createState();
        // }

        // this.calc.altitudeDepth = state.actualDepth;
        // this.calc.altitude = state.altitude;
    }

    private saveState(): void {
    //     const viewState = this.createState();
    //     this.viewStates.saveView(viewState);
    }

    // private createState(): AltitudeViewState {
    //     return {
    //         altitude: this.calc.altitude,
    //         actualDepth: this.calc.altitudeDepth,
    //         id: KnownViews.altitude
    //     };
    // }
}
