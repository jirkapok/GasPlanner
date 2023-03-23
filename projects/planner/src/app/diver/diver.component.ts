import { Component, Input, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { Diver, Precision } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.scss']
})
export class DiverComponent extends Streamed implements OnInit {
    @Input() public diver: Diver = new Diver();
    @Input() public diverForm!: FormGroup;
    public icon = faUserCog;

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
        super();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get rmv(): number {
        const rmvMetric = this.diver.rmv;
        return this.units.fromLiter(rmvMetric);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.diverForm.controls.rmv;
        return this.inputs.controlInValid(rmv);
    }

    public ngOnInit(): void {
        if (!this.diverForm) {
            this.diverForm = this.fb.group({});
        }

        // TODO rounding based on units, for imperial rmv needs more decimal palaces, see sac calculator
        const rmvControl = this.fb.control(Precision.round(this.rmv, 2), this.validators.diverRmv);
        this.diverForm.addControl('rmv', rmvControl);

        this.units.ranges$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.diverForm.patchValue({
                rmv: Precision.round(this.rmv, 2)
            }));
    }

    public inputChanged(): void {
        if (this.diverForm.invalid) {
            return;
        }

        const rmv = Number(this.diverForm.value.rmv);
        this.diver.rmv = this.units.toLiter(rmv);
    }

    public maxPpO2Changed(newValue: number): void {
        this.diver.maxPpO2 = newValue;
    }

    public maxDecoPpO2Changed(newValue: number): void {
        this.diver.maxDecoPpO2 = newValue;
    }
}
