import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
    UntypedFormBuilder, UntypedFormGroup
} from '@angular/forms';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Diver } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.scss']
})
export class DiverComponent implements OnInit, OnDestroy {
    @Input() public diver: Diver = new Diver();
    @Input() public diverForm!: UntypedFormGroup;
    public icon = faUserCog;
    private subscription!: Subscription;

    constructor(private fb: UntypedFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
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

        const rmvControl = this.fb.control(this.inputs.formatNumber(this.rmv), this.validators.diverRmv);
        this.diverForm.addControl('rmv', rmvControl);

        this.subscription = this.units.ranges$.subscribe(() => this.diverForm.patchValue({
            rmv: this.inputs.formatNumber(this.rmv)
        }));
    }

    public ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
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
