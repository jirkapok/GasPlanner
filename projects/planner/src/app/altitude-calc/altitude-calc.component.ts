import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { AltitudePressure, DepthConverter, DepthConverterFactory, Precision, PressureConverter } from 'scuba-physics';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';

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
        this.altitudeForm = this.fb.group({
            // TODO define correct range for altitude pressure
            pressure: [this.calc.pressure, this.validators.rangeFor([0.7, 1.2])],
            altitude: [this.calc.altitude, this.validators.altitude],
            actualDepth: [this.calc.altitudeDepth, this.validators.depth]
        });
    }

    public inputChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const values = this.altitudeForm.value;
        // TODO imperial units
        this.calc.pressure = Number(values.pressure);
        this.calc.altitudeDepth = Number(values.actualDepth);
    }
}


/** Inspired by https://www.divebuddy.com/calculator/ */
class AltitudeCalculator {
    public altitudeDepth = 20;
    private _altitude = 300;
    private _pressure = this.toPressure(this.altitude);
    private saltWater: DepthConverter;

    constructor() {
        this.saltWater = DepthConverter.forSaltWater();
    }

    public get pressure(): number {
        return this._pressure;
    }

    public get altitude(): number {
        return this._altitude;
    }

    /** Expecting the altitudeDepth to be in fresh water meters */
    public get theoreticalDepth(): number {
        const freshWater = DepthConverter.forFreshWater(this.altitude);
        const depthPressure = freshWater.toBar(this.altitudeDepth);
        const result = this.saltWater.fromBar(depthPressure);
        return result;
    }

    public set pressure(newValue: number) {
        this._pressure = newValue;
        this._altitude = this.toAltitude(newValue);
    }

    public set altitude(newValue: number) {
        this._altitude = newValue;
        this._pressure = this.toPressure(newValue);
    }

    private toAltitude(pressure: number): number {
        const pascalPressure = PressureConverter.barToPascal(pressure);
        return AltitudePressure.altitude(pascalPressure);
    }

    private toPressure(altitude: number): number {
        const pressure = AltitudePressure.pressure(altitude);
        return PressureConverter.pascalToBar(pressure);
    }
}
