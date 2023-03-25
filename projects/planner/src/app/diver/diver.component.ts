import { Component, Input, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup
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

    private _rmvStep = 2;

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
        const roundTo = this.units.ranges.rmvRounding;
        const rmvMetric = this.diver.rmv;
        const rmv = this.units.fromLiter(rmvMetric);
        return Precision.round(rmv, roundTo);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.diverForm.controls.rmv;
        return this.inputs.controlInValid(rmv);
    }

    public get rmvStep(): number {
        return this._rmvStep;
    }

    public ngOnInit(): void {
        if (!this.diverForm) {
            this.diverForm = this.fb.group({});
        }

        // TODO rounding based on units, for imperial rmv needs more decimal palaces, see sac calculator
        const rmvControl = this.fb.control(this.rmv, this.validators.diverRmv);
        this.diverForm.addControl('rmv', rmvControl);

        this.units.ranges$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((r) => this.rangeChanged(r));
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

    private rangeChanged(ranges: RangeConstants): void {
        const exp = ranges.rmvRounding - 1;
        this._rmvStep = Math.pow(10, -exp);
        this.diverForm.patchValue({
            rmv: this.rmv
        });
    }
}
