import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
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

interface MccrForm {
    setpoint: FormControl<number>;
    o2Flow: FormControl<number>;
    loopVolume: FormControl<number>;
    metabolicO2: FormControl<number>;
}

/** mCCR options of the selected dive */
@Component({
    selector: 'app-mccr-options',
    templateUrl: './mccr-options.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, TranslatePipe]
})
export class MccrOptionsComponent extends Streamed implements OnInit, OnDestroy {
    /** Name of this form in the root form */
    public static readonly formName = 'mccrOptions';
    @Input() public rootForm!: FormGroup;
    public mccrForm!: FormGroup<MccrForm>;
    private _volumeStep = 0.1;

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

    public get setpointInvalid(): boolean {
        return this.inputs.controlInValid(this.mccrForm.controls.setpoint);
    }

    public get o2FlowInvalid(): boolean {
        return this.inputs.controlInValid(this.mccrForm.controls.o2Flow);
    }

    public get loopVolumeInvalid(): boolean {
        return this.inputs.controlInValid(this.mccrForm.controls.loopVolume);
    }

    public get metabolicO2Invalid(): boolean {
        return this.inputs.controlInValid(this.mccrForm.controls.metabolicO2);
    }

    /** Volumes use the same precision as diver rmv */
    public get volumeStep(): number {
        return this._volumeStep;
    }

    private get options(): OptionsService {
        return this.schedules.selectedOptions;
    }

    public ngOnInit(): void {
        this.mccrForm = this.fb.group({
            setpoint: [this.roundedSetpoint(), this.validators.setpoint],
            o2Flow: [this.roundedVolume(this.options.o2Flow), this.validators.o2Flow],
            loopVolume: [this.roundedVolume(this.options.loopVolume), this.validators.loopVolume],
            metabolicO2: [this.roundedVolume(this.options.metabolicO2), this.validators.metabolicO2]
        });

        this.dispatcher.optionsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((source: OptionsService) => {
                if (this.options === source) {
                    this.reload();
                }
            });

        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reload());

        this.units.ranges$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((r) => this.rangeChanged(r));

        // replaces the form of previous instance, addControl would keep the old one
        this.rootForm.setControl(MccrOptionsComponent.formName, this.mccrForm);
    }

    /** Removes the form from the root form, so it can't block the planner after the component is gone */
    public override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.rootForm.removeControl(MccrOptionsComponent.formName);
    }

    public applyOptions(): void {
        // also other parts of the planner (e.g. tanks) need to be valid to calculate
        if (this.rootForm.invalid) {
            return;
        }

        const values = this.mccrForm.value;
        this.options.setpoint = Number(values.setpoint);
        this.options.o2Flow = Number(values.o2Flow);
        this.options.loopVolume = Number(values.loopVolume);
        this.options.metabolicO2 = Number(values.metabolicO2);
        this.dispatcher.sendOptionsChanged();
    }

    private reload(): void {
        this.mccrForm.patchValue({
            setpoint: this.roundedSetpoint(),
            o2Flow: this.roundedVolume(this.options.o2Flow),
            loopVolume: this.roundedVolume(this.options.loopVolume),
            metabolicO2: this.roundedVolume(this.options.metabolicO2)
        });
    }

    private rangeChanged(ranges: RangeConstants): void {
        const exp = ranges.rmvRounding - 1;
        this._volumeStep = Math.pow(10, -exp);
        this.reload();
    }

    private roundedSetpoint(): number {
        return Precision.round(this.options.setpoint, 2);
    }

    private roundedVolume(value: number): number {
        return Precision.round(value, this.ranges.rmvRounding);
    }
}
