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

interface AltitudeForm {
    pressure: FormControl<number>;
    altitude: FormControl<number>;
    actualDepth: FormControl<number>;
}

@Component({
    selector: 'app-altitude-calc',
    templateUrl: './altitude-calc.component.html',
    styleUrls: ['./altitude-calc.component.scss']
})
export class AltitudeCalcComponent implements OnInit {
    public calcIcon = faCalculator;
    public altitudeForm!: FormGroup<AltitudeForm>;
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

    public ngOnInit(): void {
        // TODO add load/save view state

        this.altitudeForm = this.fb.group({
            // TODO define correct range for altitude pressure
            pressure: [this.calc.pressure, this.validators.rangeFor([0.7, 1.2])],
            altitude: [this.calc.altitude, this.validators.altitude],
            actualDepth: [this.calc.altitudeDepth, this.validators.depth]
        });
    }

    public pressureChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const values = this.altitudeForm.value;
        // TODO imperial units
        this.calc.pressure = Number(values.pressure);
    }

    public altitudeChanged(newValue: number): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        // TODO imperial units
        this.calc.altitude = newValue;
    }

    public inputChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const values = this.altitudeForm.value;
        // TODO imperial units
        this.calc.altitudeDepth = Number(values.actualDepth);
    }
}
