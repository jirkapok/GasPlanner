import { DecimalPipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { SafetyStop, Salinity } from 'scuba-physics';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { InputControls } from '../shared/inputcontrols';
import { Plan, Strategies } from '../shared/models';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { PlannerService } from '../shared/planner.service';
import { Gradients } from '../shared/standard-gradients.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-diveoptions',
    templateUrl: './diveoptions.component.html',
    styleUrls: ['./diveoptions.component.css']
})
export class DiveOptionsComponent implements OnInit, OnDestroy {
    @Input()
    public formValid = true;
    public readonly allUsableName = 'All usable';
    public readonly halfUsableName = 'Half usable';
    public readonly thirdUsableName = 'Thirds usable';
    public readonly safetyOffName = 'Never';
    public readonly safetyOnName = 'Always';
    public plan: Plan;
    public strategy = this.allUsableName;
    public icon = faCog;
    public optionsForm!: FormGroup;
    private subscription!: Subscription;

    constructor(public units: UnitConversion,
        public options: OptionsDispatcherService,
        private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        private planner: PlannerService,
        private delayedCalc: DelayedScheduleService) {
        this.plan = this.planner.plan;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get safetyAutoName(): string {
        const level = this.units.autoStopLevel;
        return `Auto (> ${level} ${this.units.length})`;
    }

    public get safetyStopOption(): string {
        switch (this.options.safetyStop) {
            case SafetyStop.never:
                return this.safetyOffName;
            case SafetyStop.always:
                return this.safetyOnName;
            default:
                return this.safetyAutoName;
        }
    }

    public get narcoticDepthInvalid(): boolean {
        const narcoticDepth = this.optionsForm.controls.maxEND;
        return InputControls.controlInValid(narcoticDepth);
    }

    public get problemInvalid(): boolean {
        const problem = this.optionsForm.controls.problem;
        return InputControls.controlInValid(problem);
    }

    public get switchDurationInvalid(): boolean {
        const gasSwitch = this.optionsForm.controls.gasSwitch;
        return InputControls.controlInValid(gasSwitch);
    }

    public get lastStopInvalid(): boolean {
        const lastStopDepth = this.optionsForm.controls.lastStopDepth;
        return InputControls.controlInValid(lastStopDepth);
    }

    public get descSpeedInvalid(): boolean {
        const descentSpeed = this.optionsForm.controls.descentSpeed;
        return InputControls.controlInValid(descentSpeed);
    }

    public get ascSpeedInvalid(): boolean {
        const ascentSpeed6m = this.optionsForm.controls.ascentSpeed6m;
        return InputControls.controlInValid(ascentSpeed6m);
    }

    public get ascentSpeed50percTo6mInvalid(): boolean {
        const ascentSpeed50percTo6m = this.optionsForm.controls.ascentSpeed50percTo6m;
        return InputControls.controlInValid(ascentSpeed50percTo6m);
    }

    public get ascentSpeed50percInvalid(): boolean {
        const ascentSpeed50perc = this.optionsForm.controls.ascentSpeed50perc;
        return InputControls.controlInValid(ascentSpeed50perc);
    }

    public get maxEND(): number {
        const source = this.options.maxEND;
        return this.units.fromMeters(source);
    }

    public get lastStopDepth(): number {
        const source = this.options.lastStopDepth;
        return this.units.fromMeters(source);
    }

    public get descentSpeed(): number {
        const source = this.options.descentSpeed;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed6m(): number {
        const source = this.options.ascentSpeed6m;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed50percTo6m(): number {
        const source = this.options.ascentSpeed50percTo6m;
        return this.units.fromMeters(source);
    }

    public get ascentSpeed50perc(): number {
        const source = this.options.ascentSpeed50perc;
        return this.units.fromMeters(source);
    }

    public set maxEND(newValue: number) {
        this.options.maxEND = this.units.toMeters(newValue);
    }

    public set lastStopDepth(newValue: number) {
        this.options.lastStopDepth = this.units.toMeters(newValue);
    }

    public set descentSpeed(newValue: number) {
        this.options.descentSpeed = this.units.toMeters(newValue);
    }

    public set ascentSpeed6m(newValue: number) {
        this.options.ascentSpeed6m = this.units.toMeters(newValue);
    }

    public set ascentSpeed50percTo6m(newValue: number) {
        this.options.ascentSpeed50percTo6m = this.units.toMeters(newValue);
    }

    public set ascentSpeed50perc(newValue: number) {
        this.options.ascentSpeed50perc = this.units.toMeters(newValue);
    }

    public set isComplex(newValue: boolean) {
        if (!newValue) {
            this.setAllUsable();
            this.options.resetToSimple();
        }

        this.planner.isComplex = newValue;
        // always calculate, even nothing changed, since we want to propagate url update
        this.applyOptions();
    }

    public ngOnInit(): void {
        this.optionsForm = this.fb.group({
            maxEND: [InputControls.formatNumber(this.numberPipe, this.maxEND),
                [Validators.required, Validators.min(this.ranges.narcoticDepth[0]), Validators.max(this.ranges.narcoticDepth[1])]],
            problem: [InputControls.formatNumber(this.numberPipe, this.options.problemSolvingDuration),
                [Validators.required, Validators.min(1), Validators.max(100)]],
            gasSwitch: [InputControls.formatNumber(this.numberPipe, this.options.gasSwitchDuration),
                [Validators.required, Validators.min(1), Validators.max(10)]],
            lastStopDepth: [InputControls.formatNumber(this.numberPipe, this.lastStopDepth),
                [Validators.required, Validators.min(this.ranges.lastStopDepth[0]), Validators.max(this.ranges.lastStopDepth[1])]],
            descentSpeed: [InputControls.formatNumber(this.numberPipe, this.descentSpeed),
                [Validators.required, Validators.min(this.ranges.speed[0]), Validators.max(this.ranges.speed[1])]],
            ascentSpeed6m: [InputControls.formatNumber(this.numberPipe, this.ascentSpeed6m),
                [Validators.required, Validators.min(this.ranges.speed[0]), Validators.max(this.ranges.speed[1])]],
            ascentSpeed50percTo6m: [InputControls.formatNumber(this.numberPipe, this.ascentSpeed50percTo6m),
                [Validators.required, Validators.min(this.ranges.speed[0]), Validators.max(this.ranges.speed[1])]],
            ascentSpeed50perc: [InputControls.formatNumber(this.numberPipe, this.ascentSpeed50perc),
                [Validators.required, Validators.min(this.ranges.speed[0]), Validators.max(this.ranges.speed[1])]],
        });

        this.subscription = this.options.reloaded.subscribe(() => this.reloadForm());
    }

    public ngOnDestroy(): void {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    public reset(): void {
        switch (this.plan.strategy) {
            case Strategies.HALF: {
                this.halfUsable();
                break;
            }
            case Strategies.THIRD: {
                this.thirdUsable();
                break;
            }
            default: {
                this.allUsable();
                break;
            }
        }
    }

    public allUsable(): void {
        this.setAllUsable();
        this.applyOptions();
    }

    public setAllUsable(): void {
        this.plan.strategy = Strategies.ALL;
        this.strategy = this.allUsableName;
    }

    public halfUsable(): void {
        this.plan.strategy = Strategies.HALF;
        this.strategy = this.halfUsableName;
        this.applyOptions();
    }

    public thirdUsable(): void {
        this.plan.strategy = Strategies.THIRD;
        this.strategy = this.thirdUsableName;
        this.applyOptions();
    }

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
        if(this.optionsForm.invalid) {
            return;
        }

        const values = this.optionsForm.value;
        this.maxEND = Number(values.maxEND);
        this.options.problemSolvingDuration = Number(values.problem);
        this.options.gasSwitchDuration = Number(values.gasSwitch);
        this.lastStopDepth = Number(values.lastStopDepth);
        this.descentSpeed = Number(values.descentSpeed);
        this.ascentSpeed6m = Number(values.ascentSpeed6m);
        this.ascentSpeed50percTo6m = Number(values.ascentSpeed50percTo6m);
        this.ascentSpeed50perc = Number(values.ascentSpeed50perc);

        this.fireCalculation();
    }

    private fireCalculation(): void {
        this.planner.assignOptions(this.options.getOptions());
        this.delayedCalc.schedule();
    }

    private reloadForm(): void {
        this.optionsForm.patchValue({
            maxEND: InputControls.formatNumber(this.numberPipe, this.maxEND),
            problem: InputControls.formatNumber(this.numberPipe, this.options.problemSolvingDuration),
            gasSwitch: InputControls.formatNumber(this.numberPipe, this.options.gasSwitchDuration),
            lastStopDepth: InputControls.formatNumber(this.numberPipe, this.lastStopDepth),
            descentSpeed: InputControls.formatNumber(this.numberPipe, this.descentSpeed),
            ascentSpeed6m: InputControls.formatNumber(this.numberPipe, this.ascentSpeed6m),
            ascentSpeed50percTo6m: InputControls.formatNumber(this.numberPipe, this.ascentSpeed50percTo6m),
            ascentSpeed50perc: InputControls.formatNumber(this.numberPipe, this.ascentSpeed50perc),
        });
    }
}
