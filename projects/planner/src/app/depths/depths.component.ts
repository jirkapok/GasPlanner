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
    private viewSubsription!: Subscription;

    constructor(
        private fb: FormBuilder,
        private inputs: InputControls,
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
        return this.inputs.controlInValid(duration);
    }

    public get levelControls(): FormArray {
        return this.depthsForm.controls.levels as FormArray;
    }

    public depthItemInvalid(index: number): boolean {
        const level = this.levelControls.at(index) as FormGroup;
        const endDepth = level.controls.endDepth;
        return this.inputs.controlInValid(endDepth);
    }

    public durationItemInvalid(index: number): boolean {
        const level = this.levelControls.at(index) as FormGroup;
        const duration = level.controls.duration;
        return this.inputs.controlInValid(duration);
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

        // this combination of event handlers isn't efficient, but leave it because its simple
        // for simple view, this is also kicked of when switching to simple view
        this.subscription = this.plan.reloaded.subscribe(() => {
            this.depths.updateLevels();
            this.reloadSimple();
            this.reloadComplex();
        });

        // for complex view only
        this.viewSubsription = this.planner.viewSwitched.subscribe(() => {
            this.depths.updateLevels();
            this.reloadComplex();
        });
    }

    public ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.viewSubsription?.unsubscribe();
    }

    public addLevel(): void {
        if (this.depthsForm.invalid) {
            return;
        }

        this.depths.addSegment();
        const index = this.depths.levels.length - 1;
        const newLevel = this.levelAt(index);
        const levelControls = this.createLevelControl(newLevel);
        this.levelControls.push(levelControls);
    }

    public removeLevel(index: number): void {
        if (this.depthsForm.invalid || !this.minimumSegments) {
            return;
        }

        const level = this.levelAt(index);
        this.depths.removeSegment(level);
        this.levelControls.removeAt(index);
    }

    public levelChanged(index: number): void {
        if (this.depthsForm.invalid) {
            return;
        }

        const level = this.levelAt(index);
        const levelControl = this.levelControls.at(index) as FormGroup;
        const levelValue = levelControl.value;
        level.duration = Number(levelValue.duration);
        level.endDepth = Number(levelValue.endDepth);
        this.depths.levelChanged();
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

    // for simple view only
    private reloadSimple(): void {
        // depth is reloaded in its nested component
        this.depthsForm.patchValue({
            planDuration: this.inputs.formatNumber(this.depths.planDuration)
        });
    }

    // for complex view only
    private reloadComplex(): void {
        this.levelControls.clear();
        this.createLevelControls().forEach(c => this.levelControls.push(c));
    }

    private createLevelControls(): AbstractControl[] {
        const created: AbstractControl[] = [];
        for (const level of this.depths.levels) {
            const newControl = this.createLevelControl(level);
            created.push(newControl);
        }

        return created;
    }

    private createLevelControl(level: Level): AbstractControl {
        return this.fb.group({
            duration: this.createDurationControl(level.duration),
            endDepth: [this.inputs.formatNumber(level.endDepth),
            [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]]
        });
    }

    private createDurationControl(duration: number): [string | null, Validators[]] {
        return [this.inputs.formatNumber(duration),
        [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])]];
    }

    private levelAt(index: number): Level {
        return this.depths.levels[index];
    }
}
