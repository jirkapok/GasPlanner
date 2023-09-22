import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { AltitudeCalculator } from '../shared/altitudeCalculator';
import { AltitudeForm } from '../altitude/altitude.component';
import { Precision } from 'scuba-physics';

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
        public location: Location) { }

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
        const altitudeDepth = this.units.fromMeters(this.calc.pressure);
        return Precision.round(altitudeDepth, 0);
    }

    public ngOnInit(): void {
        // TODO add load/save view state

        this.altitudeForm = this.fb.group({
            // TODO define correct range for altitude pressure
            pressure: [this.calcPressure, this.validators.rangeFor([0.7, 1.2])],
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
    }

    public altitudeChanged(newValue: number): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        // already in metric
        this.calc.altitude = newValue;
    }

    public inputChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const values = this.altitudeForm.value;
        const metricDepth = this.units.toMeters(Number(values.actualDepth));
        this.calc.altitudeDepth = metricDepth;
    }
}
