import { Component, Input, OnInit } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormControl } from '@angular/forms';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { Salinity, Precision } from 'scuba-physics';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { InputControls } from '../shared/inputcontrols';
import { Strategies } from '../shared/models';
import { OptionsService } from '../shared/options.service';
import { Gradients } from '../shared/standard-gradients.service';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Plan } from '../shared/plan.service';
import { ViewSwitchService } from '../shared/viewSwitchService';
import {DiveSchedules} from '../shared/dive.schedules';

@Component({
    selector: 'app-diveoptions',
    templateUrl: './diveoptions.component.html',
    styleUrls: ['./diveoptions.component.scss']
})
export class DiveOptionsComponent extends Streamed implements OnInit {
    @Input()
    public formValid = true;
    public readonly allUsableName = 'All usable';
    public readonly halfUsableName = 'Half usable';
    public readonly thirdUsableName = 'Thirds usable';
    public strategy = this.allUsableName;
    public icon = faCog;
    public optionsForm!: FormGroup<{
        maxEND: FormControl<number>;
        problem: FormControl<number>;
        gasSwitch: FormControl<number>;
        lastStopDepth: FormControl<number>;
        descentSpeed: FormControl<number>;
        ascentSpeed6m: FormControl<number>;
        ascentSpeed50percTo6m: FormControl<number>;
        ascentSpeed50perc: FormControl<number>;
    }>;

    constructor(public units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        private viewSwitch: ViewSwitchService,
        private delayedCalc: DelayedScheduleService,
        private schedules: DiveSchedules) {
        super();
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get narcoticDepthInvalid(): boolean {
        const narcoticDepth = this.optionsForm.controls.maxEND;
        return this.inputs.controlInValid(narcoticDepth);
    }

    public get problemInvalid(): boolean {
        const problem = this.optionsForm.controls.problem;
        return this.inputs.controlInValid(problem);
    }

    public get switchDurationInvalid(): boolean {
        const gasSwitch = this.optionsForm.controls.gasSwitch;
        return this.inputs.controlInValid(gasSwitch);
    }

    public get lastStopInvalid(): boolean {
        const lastStopDepth = this.optionsForm.controls.lastStopDepth;
        return this.inputs.controlInValid(lastStopDepth);
    }

    public get descSpeedInvalid(): boolean {
        const descentSpeed = this.optionsForm.controls.descentSpeed;
        return this.inputs.controlInValid(descentSpeed);
    }

    public get ascSpeedInvalid(): boolean {
        const ascentSpeed6m = this.optionsForm.controls.ascentSpeed6m;
        return this.inputs.controlInValid(ascentSpeed6m);
    }

    public get ascentSpeed50percTo6mInvalid(): boolean {
        const ascentSpeed50percTo6m = this.optionsForm.controls.ascentSpeed50percTo6m;
        return this.inputs.controlInValid(ascentSpeed50percTo6m);
    }

    public get ascentSpeed50percInvalid(): boolean {
        const ascentSpeed50perc = this.optionsForm.controls.ascentSpeed50perc;
        return this.inputs.controlInValid(ascentSpeed50perc);
    }

    public get options(): OptionsService {
        return this.schedules.selected.optionsService;
    }

    public set isComplex(newValue: boolean) {
        if (!newValue) {
            this.setAllUsable();
        }

        this.viewSwitch.isComplex = newValue;
        // always calculate, even nothing changed, since we want to propagate url update
        // if some value on the form is invalid, switch causes the forms to reinit
        this.applyOptions();
    }

    public ngOnInit(): void {
        this.optionsForm = this.fb.group({
            maxEND: [Precision.round(this.options.maxEND, 1), this.validators.maxEnd],
            problem: [Precision.round(this.options.problemSolvingDuration, 1), this.validators.problemSolvingDuration],
            gasSwitch: [Precision.round(this.options.gasSwitchDuration, 1), this.validators.gasSwitchDuration],
            lastStopDepth: [Precision.round(this.options.lastStopDepth, 1), this.validators.lastStopDepth],
            descentSpeed: [Precision.round(this.options.descentSpeed, 1), this.validators.speed],
            ascentSpeed6m: [Precision.round(this.options.ascentSpeed6m, 1), this.validators.speed],
            ascentSpeed50percTo6m: [Precision.round(this.options.ascentSpeed50percTo6m, 1), this.validators.speed],
            ascentSpeed50perc: [Precision.round(this.options.ascentSpeed50perc, 1), this.validators.speed],
        });

        this.options.reloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reloadForm());
    }

    // public reset(): void {
    //     switch (this.plan.strategy) {
    //         case Strategies.HALF: {
    //             this.halfUsable();
    //             break;
    //         }
    //         case Strategies.THIRD: {
    //             this.thirdUsable();
    //             break;
    //         }
    //         default: {
    //             this.allUsable();
    //             break;
    //         }
    //     }
    // }

    // public allUsable(): void {
    //     this.setAllUsable();
    //     this.applyOptions();
    // }

    public setAllUsable(): void {
        // this.plan.strategy = Strategies.ALL;
        this.strategy = this.allUsableName;
    }

    // public halfUsable(): void {
    //     this.plan.strategy = Strategies.HALF;
    //     this.strategy = this.halfUsableName;
    //     this.applyOptions();
    // }

    // public thirdUsable(): void {
    //     this.plan.strategy = Strategies.THIRD;
    //     this.strategy = this.thirdUsableName;
    //     this.applyOptions();
    // }

    public useRecreational(): void {
        this.options.useRecreational();
        this.fireCalculation();
        this.reloadForm();
    }

    public useRecommended(): void {
        this.options.useRecommended();
        this.fireCalculation();
        this.reloadForm();
    }

    public switchStopsRounding(): void {
        this.options.roundStopsToMinutes = !this.options.roundStopsToMinutes;
        this.applyOptions();
    }

    public useSafetyOff(): void {
        this.options.useSafetyOff();
        this.applyOptions();
    }

    public useSafetyAuto(): void {
        this.options.useSafetyAuto();
        this.applyOptions();
    }
    public useSafetyOn(): void {
        this.options.useSafetyOn();
        this.applyOptions();
    }

    public switchOxygenNarcotic(): void {
        this.options.oxygenNarcotic = !this.options.oxygenNarcotic;
        this.applyOptions();
    }

    public updateGradients(gf: Gradients): void {
        this.options.gfLow = gf.gfLow;
        this.options.gfHigh = gf.gfHeigh;
        this.applyOptions();
    }

    public salinityChanged(newValue: Salinity): void {
        this.options.salinity = newValue;
        this.applyOptions();
    }

    public altitudeChanged(newValue: number): void {
        this.options.altitude = newValue;
        this.applyOptions();
    }

    public applyOptions(): void {
        // altitude and salinity are checked in their respective component and shouldn't fire event
        if (this.optionsForm.invalid) {
            return;
        }

        const values = this.optionsForm.value;
        this.options.maxEND = Number(values.maxEND);
        this.options.problemSolvingDuration = Number(values.problem);
        this.options.gasSwitchDuration = Number(values.gasSwitch);
        this.options.lastStopDepth = Number(values.lastStopDepth);
        this.options.descentSpeed = Number(values.descentSpeed);
        this.options.ascentSpeed6m = Number(values.ascentSpeed6m);
        this.options.ascentSpeed50percTo6m = Number(values.ascentSpeed50percTo6m);
        this.options.ascentSpeed50perc = Number(values.ascentSpeed50perc);

        this.fireCalculation();
    }

    public fireCalculation(): void {
        this.delayedCalc.schedule();
    }

    private reloadForm(): void {
        this.optionsForm.patchValue({
            maxEND: Precision.round(this.options.maxEND, 1),
            problem: Precision.round(this.options.problemSolvingDuration, 1),
            gasSwitch: Precision.round(this.options.gasSwitchDuration, 1),
            lastStopDepth: Precision.round(this.options.lastStopDepth, 1),
            descentSpeed: Precision.round(this.options.descentSpeed, 1),
            ascentSpeed6m: Precision.round(this.options.ascentSpeed6m, 1),
            ascentSpeed50percTo6m: Precision.round(this.options.ascentSpeed50percTo6m, 1),
            ascentSpeed50perc: Precision.round(this.options.ascentSpeed50perc, 1),
        });
    }
}
