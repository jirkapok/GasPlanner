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
import { Precision, Time } from 'scuba-physics';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { maskitoTimeOptionsGenerator } from '@maskito/kit';

interface SimpleDepthsForm {
    planDuration: FormControl<number>;
    surfaceInterval: FormControl<string>;
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

    public get surfaceReadOnly(): boolean {
        return this.schedules.selected.surfaceInterval === Number.POSITIVE_INFINITY;
    }

    public get isFirstDive(): boolean {
        return this.schedules.selected.isFirst;
    }

    public get placeHolder(): string {
        return this.surfaceReadOnly ? 'First dive' : 'HH:MM';
    }

    private get surfaceInterval(): string {
        const currentSeconds = this.schedules.selected.surfaceInterval;
        if(currentSeconds === Number.POSITIVE_INFINITY) {
            return '00:00';
        }

        const resultHours = Math.floor(currentSeconds / (Time.oneMinute * 60));
        const resultHoursPad = resultHours.toString().padStart(2, '0');
        const resultMinutes = (currentSeconds % (Time.oneMinute * 60)) / Time.oneMinute;
        const resultMinutesPad = resultMinutes.toString().padStart(2, '0');
        const result = `${resultHoursPad}:${resultMinutesPad}`;
        console.log(`surface interval: ${ result }`);
        return result;
    }

    public ngOnInit(): void {
        this.simpleForm = this.fb.group({
            planDuration: [Precision.round(this.depths.planDuration, 1), this.validators.duration],
            surfaceInterval: [this.surfaceInterval]
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

    public durationChanged(): void {
        if (this.simpleForm.invalid) {
            return;
        }

        const newValue = this.simpleForm.value;
        this.depths.planDuration = Number(newValue.planDuration);
    }

    public surfaceIntervalChanged(): void {
        if (this.simpleForm.invalid) {
            return;
        }

        const newValue = this.simpleForm.value;
        this.setSurfaceInterval(newValue.surfaceInterval);
    }

    public applyFirst(): void {
        this.setSurfaceIntervalSeconds(Number.POSITIVE_INFINITY);
        this.reload();
    }

    public applyOneHour(): void {
        this.setSurfaceIntervalSeconds(Time.oneMinute * 60);
        this.reload();
    }

    private reload(): void {
        // depth is reloaded in its nested component
        this.simpleForm.patchValue({
            planDuration: Precision.round(this.depths.planDuration, 1),
            surfaceInterval: this.surfaceInterval
        });
    }

    // TODO it is really time to use moment.js - parse short time string in UTC
    private setSurfaceInterval(newValue: string | undefined) {
        const timeFormat = /(\d{2})[:](\d{2})/;
        const candidate = newValue || '00:00';
        const parsed = candidate.match(timeFormat);
        if(parsed) {
            const newHours = Number(parsed[1]) * Time.oneMinute * 60;
            const newMinutes = Number(parsed[2]) * Time.oneMinute;
            const newSeconds = newHours + newMinutes;
            this.setSurfaceIntervalSeconds(newSeconds);
        }
    }

    private setSurfaceIntervalSeconds(newValue: number) {
        this.schedules.selected.surfaceInterval = newValue;
        console.log(`SET surface intreval: ${ newValue }`);
    }
}
