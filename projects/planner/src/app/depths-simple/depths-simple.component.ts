import { Component, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup, FormControl
} from '@angular/forms';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { DiveResults } from '../shared/diveresults';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Precision } from 'scuba-physics';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

interface SimpleDepthsForm {
    planDuration: FormControl<number>;
    depth: FormControl<number>;
}

@Component({
    selector: 'app-depths-simple',
    templateUrl: './depths-simple.component.html',
    styleUrls: ['./depths-simple.component.scss']
})
export class DepthsSimpleComponent extends Streamed implements OnInit {
    public cardIcon = faLayerGroup;
    public simpleForm!: FormGroup<SimpleDepthsForm>;

    constructor(
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion,
        private schedules: DiveSchedules,
        private dispatcher: ReloadDispatcher) {
        super();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get noDecoTime(): number {
        return this.diveResult.noDecoTime;
    }

    public get durationInvalid(): boolean {
        const duration = this.simpleForm.controls.planDuration;
        return this.inputs.controlInValid(duration);
    }

    public get depths(): DepthsService {
        return this.schedules.selectedDepths;
    }

    public get diveResult(): DiveResults {
        return this.schedules.selectedResult;
    }

    public get isFirstDive(): boolean {
        return this.schedules.selected.isFirst;
    }

    public ngOnInit(): void {
        this.simpleForm = this.fb.group({
            planDuration: [Precision.round(this.depths.planDuration, 1), this.validators.duration],
            depth: [Precision.round(this.depths.plannedDepth, 1), this.validators.depth]
        });

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.reload();
            });

        this.dispatcher.depthsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((source: DepthsService) => {
                if(this.depths === source) {
                    this.reload();
                }
            });

        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reload());
    }

    public valuesChanged(): void {
        if (this.simpleForm.invalid) {
            return;
        }

        const newValue = this.simpleForm.value;
        this.depths.planDuration = Number(newValue.planDuration);
        this.depths.plannedDepth = Number(newValue.depth);
    }

    public depthChanged(newValue: number): void {
        this.depths.plannedDepth = newValue;
    }

    public assignMaxDepth(): void {
        this.depths.applyMaxDepth();
        this.reload();
    }

    private reload(): void {
        this.simpleForm.patchValue({
            planDuration: Precision.round(this.depths.planDuration, 1),
            depth: Precision.round(this.depths.plannedDepth, 1)
        });
    }
}
