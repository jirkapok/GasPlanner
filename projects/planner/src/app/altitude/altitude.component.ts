import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormControl } from '@angular/forms';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';

export interface AltitudeForm {
    altitude: FormControl<number>;
}

@Component({
    selector: 'app-altitude',
    templateUrl: './altitude.component.html',
    styleUrls: ['./altitude.component.scss']
})
export class AltitudeComponent implements OnInit {
    @Output()
    public inputChange = new EventEmitter<number>();

    /** In m.a.s.l */
    @Input()
    public altitude = 0;

    @Input()
    public altitudeForm!: FormGroup;

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) { }

    public get altitudeBound(): number {
        return this.units.fromMeters(this.altitude);
    }

    public get smallHill(): string {
        return this.levelLabel(1);
    }

    public get mountains(): string {
        return this.levelLabel(2);
    }

    public get highMountains(): string {
        return this.levelLabel(3);
    }

    public get altitudeInvalid(): boolean {
        const altitudeField = this.altitudeForm.controls.altitude;
        return this.inputs.controlInValid(altitudeField);
    }

    public ngOnInit(): void {
        if(!this.altitudeForm) {
            this.altitudeForm = this.fb.group({
                altitude: [this.altitudeBound, this.validators.altitude]
            });
        }
    }

    public altitudeChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const typedForm = this.altitudeForm as FormGroup<AltitudeForm>;
        const newValue = Number(typedForm.value.altitude);
        this.altitude = this.units.toMeters(newValue);
        this.inputChange.emit(this.altitude);
    }

    public seaLevel(): void {
        this.setLevel(0);
    }

    public setHill(): void {
        this.setLevel(1);
    }

    public setMountains(): void {
        this.setLevel(2);
    }

    // we don't change the values for imperial units here
    // simply lets fit closes rounded value
    public setHighMountains(): void {
        this.setLevel(3);
    }

    private setLevel(index: number): void {
        const level = this.selectLevels()[index];
        this.altitudeForm.patchValue({
            altitude: level
        });

        this.altitudeChanged();
    }

    private levelLabel(index: number): string {
        const level = this.selectLevels()[index];
        return `${level} ${this.units.altitude}`;
    }

    private selectLevels(): number[] {
        return this.units.ranges.altitudeLevels;
    }
}
