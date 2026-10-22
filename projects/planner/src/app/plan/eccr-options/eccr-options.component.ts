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

interface EccrForm {
    descentSetpoint: FormControl<number>;
    bottomSetpoint: FormControl<number>;
    decoSetpoint: FormControl<number>;
    setpointSwitchDepth: FormControl<number>;
    loopVolume: FormControl<number>;
    metabolicO2: FormControl<number>;
}

/** eCCR options of the selected dive */
@Component({
    selector: 'app-eccr-options',
    templateUrl: './eccr-options.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, TranslatePipe]
})
export class EccrOptionsComponent extends Streamed implements OnInit, OnDestroy {
    /** Name of this form in the root form */
    public static readonly formName = 'eccrOptions';
    @Input() public rootForm!: FormGroup;
    public eccrForm!: FormGroup<EccrForm>;
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

    public get descentSetpointInvalid(): boolean {
        return this.inputs.controlInValid(this.eccrForm.controls.descentSetpoint) || this.descentAboveBottom;
    }

    /** Descent setpoint is in range, but higher than the bottom setpoint */
    public get descentAboveBottom(): boolean {
        return this.eccrForm.hasError('descentAboveBottom');
    }

    public get bottomSetpointInvalid(): boolean {
        return this.inputs.controlInValid(this.eccrForm.controls.bottomSetpoint);
    }

    public get decoSetpointInvalid(): boolean {
        return this.inputs.controlInValid(this.eccrForm.controls.decoSetpoint);
    }

    public get setpointSwitchDepthInvalid(): boolean {
        return this.inputs.controlInValid(this.eccrForm.controls.setpointSwitchDepth);
    }

    public get loopVolumeInvalid(): boolean {
        return this.inputs.controlInValid(this.eccrForm.controls.loopVolume);
    }

    public get metabolicO2Invalid(): boolean {
        return this.inputs.controlInValid(this.eccrForm.controls.metabolicO2);
    }

    /** Volumes use the same precision as diver rmv */
    public get volumeStep(): number {
        return this._volumeStep;
    }

    private get options(): OptionsService {
        return this.schedules.selectedOptions;
    }

    public ngOnInit(): void {
        this.eccrForm = this.fb.group({
            descentSetpoint: [this.roundedSetpoint(this.options.descentSetpoint), this.validators.setpoint],
            bottomSetpoint: [this.roundedSetpoint(this.options.bottomSetpoint), this.validators.setpoint],
            decoSetpoint: [this.roundedSetpoint(this.options.decoSetpoint), this.validators.setpoint],
            setpointSwitchDepth: [this.roundedDepth(), this.validators.setpointSwitchDepth],
            loopVolume: [this.roundedVolume(this.options.loopVolume), this.validators.loopVolume],
            metabolicO2: [this.roundedVolume(this.options.metabolicO2), this.validators.metabolicO2]
        }, {
            validators: this.validators.descentNotAboveBottom('descentSetpoint', 'bottomSetpoint')
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
        this.rootForm.setControl(EccrOptionsComponent.formName, this.eccrForm);
    }

    /** Removes the form from the root form, so it can't block the planner after the component is gone */
    public override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.rootForm.removeControl(EccrOptionsComponent.formName);
    }

    public applyOptions(): void {
        // also other parts of the planner (e.g. tanks) need to be valid to calculate
        if (this.rootForm.invalid) {
            return;
        }

        const values = this.eccrForm.value;
        this.options.descentSetpoint = Number(values.descentSetpoint);
        this.options.bottomSetpoint = Number(values.bottomSetpoint);
        this.options.decoSetpoint = Number(values.decoSetpoint);
        this.options.setpointSwitchDepth = Number(values.setpointSwitchDepth);
        this.options.loopVolume = Number(values.loopVolume);
        this.options.metabolicO2 = Number(values.metabolicO2);
        this.dispatcher.sendOptionsChanged();
    }

    private reload(): void {
        this.eccrForm.patchValue({
            descentSetpoint: this.roundedSetpoint(this.options.descentSetpoint),
            bottomSetpoint: this.roundedSetpoint(this.options.bottomSetpoint),
            decoSetpoint: this.roundedSetpoint(this.options.decoSetpoint),
            setpointSwitchDepth: this.roundedDepth(),
            loopVolume: this.roundedVolume(this.options.loopVolume),
            metabolicO2: this.roundedVolume(this.options.metabolicO2)
        });
    }

    private rangeChanged(ranges: RangeConstants): void {
        const exp = ranges.rmvRounding - 1;
        this._volumeStep = Math.pow(10, -exp);
        this.reload();
    }

    private roundedSetpoint(value: number): number {
        return Precision.round(value, 2);
    }

    private roundedDepth(): number {
        return Precision.round(this.options.setpointSwitchDepth, 1);
    }

    private roundedVolume(value: number): number {
        return Precision.round(value, this.ranges.rmvRounding);
    }
}
