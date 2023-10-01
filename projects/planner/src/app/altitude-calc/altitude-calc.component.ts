import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { AltitudeForm } from '../altitude/altitude.component';
import { Precision, AltitudeCalculator } from 'scuba-physics';
import { KnownViews } from '../shared/viewStates';
import { AltitudeViewState } from '../shared/views.model';
import { SubViewStorage } from '../shared/subViewStorage';

interface AltitudeDepthForm extends AltitudeForm {
    pressure: FormControl<number>;
    actualDepth: FormControl<number>;
}

@Component({
    selector: 'app-altitude-calc',
    templateUrl: './altitude-calc.component.html',
    styleUrls: ['./altitude-calc.component.scss']
})
export class AltitudeCalcComponent implements OnInit {
    public calcIcon = faCalculator;
    public altitudeForm!: FormGroup<AltitudeDepthForm>;
    public calc = new AltitudeCalculator();

    constructor(
        private fb: NonNullableFormBuilder,
        private validators: ValidatorGroups,
        private inputs: InputControls,
        public units: UnitConversion,
        public location: Location,
        private viewStates: SubViewStorage) {
        this.loadState();
        this.saveState();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get pressureInvalid(): boolean {
        const pressureControl = this.altitudeForm.controls.pressure;
        return this.inputs.controlInValid(pressureControl);
    }

    public get actualDepthInvalid(): boolean {
        const depthControl = this.altitudeForm.controls.actualDepth;
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

    public ngOnInit(): void {
        this.altitudeForm = this.fb.group({
            pressure: [this.calcPressure, this.validators.rangeFor(this.ranges.altitudePressure)],
            altitude: [this.calcAltitude, this.validators.altitude],
            actualDepth: [this.calcAltitudeDepth, this.validators.depth]
        });
    }

    public pressureChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const values = this.altitudeForm.value;
        const metricPressure = this.units.toBar(Number(values.pressure));
        this.calc.pressure = metricPressure;

        this.altitudeForm.patchValue({
            altitude: this.calcAltitude
        });

        this.saveState();
    }

    public altitudeChanged(newValue: number): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        // already in metric
        this.calc.altitude = newValue;
        this.saveState();
    }

    public inputChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const values = this.altitudeForm.value;
        const metricDepth = this.units.toMeters(Number(values.actualDepth));
        this.calc.altitudeDepth = metricDepth;
        this.saveState();
    }

    private loadState(): void {
        let state: AltitudeViewState = this.viewStates.loadView(KnownViews.altitude);

        if (!state) {
            state = this.createState();
        }

        this.calc.altitudeDepth = state.actualDepth;
        this.calc.altitude = state.altitude;
    }

    private saveState(): void {
        const viewState = this.createState();
        this.viewStates.saveView(viewState);
    }

    private createState(): AltitudeViewState {
        return {
            altitude: this.calc.altitude,
            actualDepth: this.calc.altitudeDepth,
            id: KnownViews.altitude
        };
    }
}
