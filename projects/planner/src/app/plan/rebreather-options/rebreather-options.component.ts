import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Precision } from 'scuba-physics';
import { TranslatePipe } from '@ngx-translate/core';
import { InputControls } from '../../shared/inputcontrols';
import { OptionsService } from '../../shared/options.service';
import { Streamed } from '../../shared/streamed';
import { RangeConstants, UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';

interface RebreatherForm {
    injectionRatio: FormControl<number>;
    metabolicO2: FormControl<number>;
}

/** pSCR options of the selected dive */
@Component({
    selector: 'app-rebreather-options',
    templateUrl: './rebreather-options.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, TranslatePipe]
})
export class RebreatherOptionsComponent extends Streamed implements OnInit {
    @Input() public rootForm!: FormGroup;
    public rebreatherForm!: FormGroup<RebreatherForm>;

    constructor(
        public units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        private dispatcher: ReloadDispatcher,
        private schedules: DiveSchedules) {
        super();
        this.rootForm = this.fb.group({});
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get injectionRatioInvalid(): boolean {
        return this.inputs.controlInValid(this.rebreatherForm.controls.injectionRatio);
    }

    public get metabolicO2Invalid(): boolean {
        return this.inputs.controlInValid(this.rebreatherForm.controls.metabolicO2);
    }

    private get options(): OptionsService {
        return this.schedules.selectedOptions;
    }

    public ngOnInit(): void {
        this.rebreatherForm = this.fb.group({
            injectionRatio: [Precision.round(this.options.injectionRatio, 1), this.validators.injectionRatio],
            metabolicO2: [this.roundedMetabolicO2(), this.validators.metabolicO2]
        });

        this.dispatcher.optionsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((source: OptionsService) => {
                if (this.options === source) {
                    this.reload();
                }
            });

        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reload());

        this.rootForm.addControl('rebreatherOptions', this.rebreatherForm);
    }

    public applyOptions(): void {
        if (this.rebreatherForm.invalid) {
            return;
        }

        const values = this.rebreatherForm.value;
        this.options.injectionRatio = Number(values.injectionRatio);
        this.options.metabolicO2 = Number(values.metabolicO2);
        this.dispatcher.sendOptionsChanged();
    }

    private reload(): void {
        this.rebreatherForm.patchValue({
            injectionRatio: Precision.round(this.options.injectionRatio, 1),
            metabolicO2: this.roundedMetabolicO2()
        });
    }

    private roundedMetabolicO2(): number {
        return Precision.round(this.options.metabolicO2, this.ranges.rmvRounding);
    }
}
