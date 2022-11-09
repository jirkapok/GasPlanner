import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faLayerGroup, faTrashAlt, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Tank } from 'scuba-physics';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { Plan, Level, Dive } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.css']
})
export class DepthsComponent implements OnInit, OnDestroy {
    public plan: Plan;
    public cardIcon = faLayerGroup;
    public addIcon = faPlusSquare;
    public removeIcon = faTrashAlt;
    public depthsForm!: FormGroup;
    public dive: Dive;
    private subscription!: Subscription;

    constructor(
        private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        public planner: PlannerService,
        public depths: DepthsService,
        public units: UnitConversion) {
        this.plan = this.planner.plan;
        this.dive = this.planner.dive;
        // data are already available, it is ok to generate the levels.
        this.depths.updateLevels();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get minimumSegments(): boolean {
        return this.plan.minimumSegments;
    }

    // only to get their label, formatted in the tankLabel
    public get tanks(): Tank[] {
        return this.planner.tanks;
    }

    public get noDecoTime(): number {
        return this.plan.noDecoTime;
    }

    public get durationInvalid(): boolean {
        const duration = this.depthsForm.controls.planDuration;
        return InputControls.controlInValid(duration);
    }

    public get levels(): FormArray {
        return this.depthsForm.controls.levels as FormArray;
    }

    public depthItemInvalid(index: number): boolean {
        const level = this.levels.at(index) as FormGroup;
        const endDepth = level.controls.endDepth;
        return InputControls.controlInValid(endDepth);
    }

    public durationItemInvalid(index: number): boolean {
        const level = this.levels.at(index) as FormGroup;
        const duration = level.controls.duration;
        return InputControls.controlInValid(duration);
    }

    public startDepth(index: number): number {
        return this.levelAt(index).startDepth;
    }

    public tankLabelFor(index: number): string {
        return this.levelAt(index).tankLabel;
    }

    public assignTank(index: number, tank: Tank): void {
        const level = this.levelAt(index);
        this.depths.assignTank(level, tank);
    }

    public ngOnInit(): void {
        this.depthsForm = this.fb.group({
            planDuration: this.createDurationControl(this.depths.planDuration),
            levels: this.fb.array(this.createLevelControls())
        });
        this.subscription = this.plan.reloaded.subscribe(() => this.reload());
    }

    public addLevel(): void {
        if (this.depthsForm.invalid) {
            return;
        }

        this.depths.addSegment();
        const index = this.depths.levels.length - 1;
        const newLevel = this.levelAt(index);
        const levelControls = this.createLevelControl(newLevel);
        this.levels.push(levelControls);
    }

    public removeLevel(index: number): void {
        if (this.depthsForm.invalid || !this.minimumSegments) {
            return;
        }

        const level = this.levelAt(index);
        this.depths.removeSegment(level);
        this.levels.removeAt(index);
    }

    public levelChanged(index: number): void {
        if (this.depthsForm.invalid) {
            return;
        }

        const level = this.levelAt(index);
        const levelControl = this.levels.at(index) as FormGroup;
        const levelValue = levelControl.value;
        level.duration = Number(levelValue.duration);
        level.endDepth = Number(levelValue.endDepth);
        this.depths.levelChanged();
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public durationChanged(): void {
        if (this.depthsForm.invalid) {
            return;
        }

        const newValue = this.depthsForm.value.planDuration;
        this.depths.planDuration = Number(newValue);
    }

    public tankLabel(tank: Tank): string {
        return Level.tankLabel(this.units, tank);
    }

    private reload(): void {
        this.depths.updateLevels();

        this.depthsForm.patchValue({
            planDuration: InputControls.formatNumber(this.numberPipe, this.depths.planDuration)
        });
        this.levels.controls = this.createLevelControls();
    }

    private createLevelControls(): AbstractControl[] {
        const created: AbstractControl[] = [];
        for(const level of this.depths.levels) {
            const newControl = this.createLevelControl(level);
            created.push(newControl);
        }

        return created;
    }

    private createLevelControl(level: Level): AbstractControl {
        return this.fb.group({
            duration: this.createDurationControl(level.duration),
            endDepth: [InputControls.formatNumber(this.numberPipe, level.endDepth),
                [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]]
        });
    }

    private createDurationControl(duration: number): [string | null, Validators[]] {
        return [InputControls.formatNumber(this.numberPipe, duration),
            [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])]];
    }

    private levelAt(index: number): Level {
        return this.depths.levels[index];
    }
}
