import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { InputControls } from '../../shared/inputcontrols';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';

@Component({
    selector: 'app-altitude',
    templateUrl: './altitude.component.html',
    styleUrls: ['./altitude.component.scss']
})
export class AltitudeComponent implements OnInit {
    @Output() public inputChange = new EventEmitter<number>();
    /** In m.a.s.l */
    @Input() public altitude = 0;
    @Input() public altitudeForm!: FormGroup;
    @Input() public controlName = 'altitude';

    constructor(
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) { }

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
        const altitudeField = this.altitudeForm.get(this.controlName) as AbstractControl;
        return this.inputs.controlInValid(altitudeField);
    }

    public ngOnInit(): void {
        if(!this.altitudeForm) {
            this.altitudeForm = this.fb.group({});
            const altitudeBound = this.units.fromMeters(this.altitude);
            const altitudeControl = this.fb.control(altitudeBound, this.validators.altitude);
            this.altitudeForm.addControl(this.controlName, altitudeControl);
        }
    }

    public altitudeChanged(): void {
        if (this.altitudeForm.invalid) {
            return;
        }

        const altitudeField = this.altitudeForm.get(this.controlName);
        const newValue = Number(altitudeField?.value);
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
            [this.controlName]: level // already in respective units
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
