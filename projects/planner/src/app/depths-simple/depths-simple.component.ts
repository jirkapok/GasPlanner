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
import { maskitoTimeOptionsGenerator } from '@maskito/kit';

interface SimpleDepthsForm {
    planDuration: FormControl<number>;
    surfaceInterval: FormControl<number>;
    mask: FormControl<Date>;
}

@Component({
    selector: 'app-depths-simple',
    templateUrl: './depths-simple.component.html',
    styleUrls: ['./depths-simple.component.scss']
})
export class DepthsSimpleComponent extends Streamed implements OnInit {
    public cardIcon = faLayerGroup;
    public simpleForm!: FormGroup<SimpleDepthsForm>;
    public readonly maskitoTimeOptions = maskitoTimeOptionsGenerator({
        mode: 'HH:MM',
        timeSegmentMaxValues: { hours: 48 }
    });

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

    public get surfaceIntervalInvalid(): boolean {
        return false;
    }

    private get surfaceInterval(): number {
        return this.schedules.selected.surfaceInterval;
    }

    private set surfaceInterval(newValue: number) {
        this.schedules.selected.surfaceInterval = newValue;
    }

    public ngOnInit(): void {
        this.simpleForm = this.fb.group({
            planDuration: [Precision.round(this.depths.planDuration, 1), this.validators.duration],
            surfaceInterval: [this.surfaceInterval, this.validators.duration],
            mask: [new Date(), []]
        });

        // Reload is not relevant here
        // this combination of event handlers isn't efficient, but leave it because its simple
        // for simple view, this is also kicked of when switching to simple view
        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.reload();
            });

        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reload());
    }

    public valuesChanged(): void {
        if (this.simpleForm.invalid) {
            return;
        }

        const newValue = this.simpleForm.value;
        this.surfaceInterval = Number(newValue.surfaceInterval);
        this.depths.planDuration = Number(newValue.planDuration);
        console.log(newValue.mask);
    }

    private reload(): void {
        // depth is reloaded in its nested component
        this.simpleForm.patchValue({
            planDuration: Precision.round(this.depths.planDuration, 1),
            surfaceInterval: this.surfaceInterval
        });
    }
}
