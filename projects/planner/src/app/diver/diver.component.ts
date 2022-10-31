import { DecimalPipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Diver } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.css']
})
export class DiverComponent implements OnInit, OnDestroy {
    @Input() public diver: Diver = new Diver();
    @Input() public ranges: RangeConstants;
    public icon = faUserCog;
    public diverForm!: FormGroup;
    private subscription!: Subscription;

    constructor(private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        public units: UnitConversion) {
        this.ranges = units.ranges;
    }

    public get rmv(): number {
        const rmvMetric = this.diver.rmv;
        return this.units.fromLiter(rmvMetric);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.diverForm.controls.rmv;
        return InputControls.controlInValid(rmv);
    }

    public ngOnInit(): void {
        this.diverForm = this.fb.group({
            rmv: [InputControls.formatNumber(this.numberPipe, this.rmv),
                [Validators.required, Validators.min(this.ranges.diverRmv[0]), Validators.max(this.ranges.diverRmv[1])]]
        });

        this.subscription = this.units.ranges$.subscribe(() => this.diverForm.patchValue({
            rmv:  InputControls.formatNumber(this.numberPipe, this.rmv)
        }));
    }

    public ngOnDestroy(): void {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    public inputChanged(): void {
        if(this.diverForm.invalid) {
            return;
        }

        const values = this.diverForm.value;
        this.diver.rmv = this.units.toLiter(values.rmv);
    }

    public maxPpO2Changed(newValue: number): void {
        this.diver.maxPpO2 = newValue;
    }

    public maxDecoPpO2Changed(newValue: number): void {
        this.diver.maxDecoPpO2 = newValue;
    }
}
