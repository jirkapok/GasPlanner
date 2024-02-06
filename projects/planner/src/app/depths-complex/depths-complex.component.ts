import { Component, OnInit } from '@angular/core';
import { FormArray,  FormControl,
    NonNullableFormBuilder, FormGroup
} from '@angular/forms';
import { takeUntil } from 'rxjs';
import { faLayerGroup, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { InputControls } from '../shared/inputcontrols';
import { Level, TankBound } from '../shared/models';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Precision } from 'scuba-physics';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { DepthsService } from '../shared/depths.service';

interface LevelRow {
    duration: FormControl<number>;
    endDepth: FormControl<number>;
}

interface DepthsForm {
    surfaceInterval: FormControl<string | null>;
    levels: FormArray<FormGroup<LevelRow>>;
}

@Component({
    selector: 'app-depths-complex',
    templateUrl: './depths-complex.component.html',
    styleUrls: ['./depths-complex.component.scss']
})
export class DepthsComplexComponent extends Streamed implements OnInit {
    public cardIcon = faLayerGroup;
    public addIcon = faPlus;
    public removeIcon = faMinus;
    public complexForm!: FormGroup<DepthsForm>;

    constructor(
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion,
        private schedules: DiveSchedules,
        public dispatcher: ReloadDispatcher) {
        super();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get isFirstDive(): boolean {
        return this.schedules.selected.isFirst;
    }

    public get minimumSegments(): boolean {
        return this.depths.minimumSegments;
    }

    // only to get their label, formatted in the tankLabel
    public get tanks(): TankBound[] {
        return this.schedules.selectedTanks.tanks;
    }

    public get levelControls(): FormArray<FormGroup<LevelRow>> {
        return this.complexForm.controls.levels;
    }

    public get depths(): DepthsService {
        return this.schedules.selectedDepths;
    }

    private get surfaceInterval(): string | null {
        return this.schedules.selected.surfaceIntervalText;
    }

    public depthItemInvalid(index: number): boolean {
        const level = this.levelControls.at(index);
        const endDepth = level.controls.endDepth;
        return this.inputs.controlInValid(endDepth);
    }

    public durationItemInvalid(index: number): boolean {
        const level = this.levelControls.at(index);
        const duration = level.controls.duration;
        return this.inputs.controlInValid(duration);
    }

    public startDepth(index: number): number {
        return this.levelAt(index).startDepth;
    }

    public labelFor(index: number): string {
        const level = this.levelAt(index);
        return `${level.startDepth}-${level.endDepth} ${this.units.length} ${level.duration} min`;
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
            surfaceInterval: [this.surfaceInterval, this.validators.surfaceInterval()],
            levels: this.fb.array(this.createLevelControls())
        });

        // for simple view, this is also kicked of when switching to simple view
        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.reload();
            });

        this.dispatcher.depthsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((source: DepthsService) => {
                if(this.depths === source) {
                    this.reload();
                }
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
        const levelControl = this.levelControls.at(index);
        const levelValue = levelControl.value;
        level.duration = Number(levelValue.duration);
        level.endDepth = Number(levelValue.endDepth);
        this.depths.levelChanged();
    }

    private reload(): void {
        this.complexForm.patchValue({
            surfaceInterval: this.surfaceInterval
        });
        this.levelControls.clear();
        this.createLevelControls().forEach(c => this.levelControls.push(c));
    }

    private createLevelControls(): FormGroup<LevelRow>[] {
        const created: FormGroup<LevelRow>[] = [];
        for (const level of this.depths.levels) {
            const newControl = this.createLevelControl(level);
            created.push(newControl);
        }

        return created;
    }

    private createLevelControl(level: Level): FormGroup<LevelRow> {
        return this.fb.group({
            duration: [Precision.round(level.duration, 1), this.validators.duration],
            endDepth: [Precision.round(level.endDepth, 1), this.validators.depthFromSurface]
        });
    }

    private levelAt(index: number): Level {
        return this.depths.levels[index];
    }
}
