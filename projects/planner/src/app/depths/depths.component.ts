import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray,
    UntypedFormBuilder, UntypedFormGroup, Validators
} from '@angular/forms';
import { faLayerGroup, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { Level, Dive, TankBound } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Plan } from '../shared/plan.service';
import { TanksService } from '../shared/tanks.service';
import { ViewSwitchService } from '../shared/viewSwitchService';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.scss']
})
export class DepthsComponent extends Streamed implements OnInit {
    public cardIcon = faLayerGroup;
    public addIcon = faPlus;
    public removeIcon = faMinus;
    public complexForm!: UntypedFormGroup;
    public simpleForm!: UntypedFormGroup;
    public dive: Dive;

    constructor(
        private fb: UntypedFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public planner: PlannerService,
        private tanksService: TanksService,
        public depths: DepthsService,
        private viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        private plan: Plan) {
        super();
        this.dive = this.planner.dive;
        // data are already available, it is ok to generate the levels.
        this.depths.updateLevels();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get minimumSegments(): boolean {
        return this.plan.minimumSegments;
    }

    // only to get their label, formatted in the tankLabel
    public get tanks(): TankBound[] {
        return this.tanksService.tanks;
    }

    public get noDecoTime(): number {
        return this.plan.noDecoTime;
    }

    public get durationInvalid(): boolean {
        const duration = this.simpleForm.controls.planDuration;
        return this.inputs.controlInValid(duration);
    }

    public get levelControls(): UntypedFormArray {
        return this.complexForm.controls.levels as UntypedFormArray;
    }

    public depthItemInvalid(index: number): boolean {
        const level = this.levelControls.at(index) as UntypedFormGroup;
        const endDepth = level.controls.endDepth;
        return this.inputs.controlInValid(endDepth);
    }

    public durationItemInvalid(index: number): boolean {
        const level = this.levelControls.at(index) as UntypedFormGroup;
        const duration = level.controls.duration;
        return this.inputs.controlInValid(duration);
    }

    public startDepth(index: number): number {
        return this.levelAt(index).startDepth;
    }

    public tankLabelFor(index: number): string {
        return this.levelAt(index).tankLabel;
    }

    public assignTank(index: number, tank: TankBound): void {
        const level = this.levelAt(index);
        this.depths.assignTank(level, tank);
    }

    public ngOnInit(): void {
        this.complexForm = this.fb.group({
            levels: this.fb.array(this.createLevelControls())
        });

        this.simpleForm = this.fb.group({
            planDuration: this.createDurationControl(this.depths.planDuration),
        });

        // this combination of event handlers isn't efficient, but leave it because its simple
        // for simple view, this is also kicked of when switching to simple view
        this.plan.reloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.depths.updateLevels();
                this.reloadSimple();
                this.reloadComplex();
            });

        // for complex view only
        this.viewSwitch.viewSwitched.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.depths.updateLevels();
                this.reloadComplex();
            });
    }

    public addLevel(): void {
        if (this.complexForm.invalid) {
            return;
        }

        this.depths.addSegment();
        const index = this.depths.levels.length - 1;
        const newLevel = this.levelAt(index);
        const levelControls = this.createLevelControl(newLevel);
        this.levelControls.push(levelControls);
    }

    public removeLevel(index: number): void {
        if (this.complexForm.invalid || !this.minimumSegments) {
            return;
        }

        const level = this.levelAt(index);
        this.depths.removeSegment(level);
        this.levelControls.removeAt(index);
    }

    public levelChanged(index: number): void {
        if (this.complexForm.invalid) {
            return;
        }

        const level = this.levelAt(index);
        const levelControl = this.levelControls.at(index) as UntypedFormGroup;
        const levelValue = levelControl.value;
        level.duration = Number(levelValue.duration);
        level.endDepth = Number(levelValue.endDepth);
        this.depths.levelChanged();
    }

    public durationChanged(): void {
        if (this.simpleForm.invalid) {
            return;
        }

        const newValue = this.simpleForm.value.planDuration;
        this.depths.planDuration = Number(newValue);
    }

    // for simple view only
    private reloadSimple(): void {
        // depth is reloaded in its nested component
        this.simpleForm.patchValue({
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
            endDepth: [this.inputs.formatNumber(level.endDepth), this.validators.depth]
        });
    }

    private createDurationControl(duration: number): [string | null, Validators[]] {
        return [this.inputs.formatNumber(duration), this.validators.duration];
    }

    private levelAt(index: number): Level {
        return this.depths.levels[index];
    }
}
