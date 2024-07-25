import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup
} from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Precision } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { DiverOptions } from '../shared/models';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.scss']
})
export class DiverComponent extends Streamed implements OnInit {
    @Input() public diver: DiverOptions = new DiverOptions();
    @Input() public diverForm!: FormGroup;
    @Output()public changed = new EventEmitter();

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

    public get stressRmv(): number {
        const roundTo = this.units.ranges.rmvRounding;
        const rmvMetric = this.diver.stressRmv;
        const rmv = this.units.fromLiter(rmvMetric);
        return Precision.round(rmv, roundTo);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.diverForm.controls.rmv;
        return this.inputs.controlInValid(rmv);
    }

    public get stressRmvInvalid(): boolean {
        const rmv = this.diverForm.controls.srtessRmv;
        return this.inputs.controlInValid(rmv);
    }

    public get rmvStep(): number {
        return this._rmvStep;
    }

    public ngOnInit(): void {
        if (!this.diverForm) {
            this.diverForm = this.fb.group({});
        }

        const rmvControl = this.fb.control(this.rmv, this.validators.diverRmv);
        this.diverForm.addControl('rmv', rmvControl);
        const stressRmvControl = this.fb.control(this.stressRmv, this.validators.diverRmv);
        this.diverForm.addControl('stressRmv', stressRmvControl);

        this.units.ranges$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((r) => this.rangeChanged(r));
    }

    public inputChanged(): void {
        if (this.diverForm.invalid) {
            return;
        }

        const rmv = Number(this.diverForm.value.rmv);
        this.diver.rmv = this.units.toLiter(rmv);
        const stressRmv = Number(this.diverForm.value.stressRmv);
        this.diver.stressRmv = this.units.toLiter(stressRmv);
        this.changed.emit();
    }

    public maxPpO2Changed(newValue: number): void {
        this.diver.maxPpO2 = newValue;
        this.changed.emit();
    }

    public maxDecoPpO2Changed(newValue: number): void {
        this.diver.maxDecoPpO2 = newValue;
        this.changed.emit();
    }

    private rangeChanged(ranges: RangeConstants): void {
        const exp = ranges.rmvRounding - 1;
        this._rmvStep = Math.pow(10, -exp);
        this.diverForm.patchValue({
            rmv: this.rmv
        });
    }
}
