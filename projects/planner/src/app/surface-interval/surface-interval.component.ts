import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { maskitoTimeOptionsGenerator } from '@maskito/kit';
import { DiveSchedules } from '../shared/dive.schedules';
import { takeUntil } from 'rxjs';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { Streamed } from '../shared/streamed';
import { DateFormats } from '../shared/formaters';
import { InputControls } from '../shared/inputcontrols';

@Component({
    selector: 'app-surface-interval',
    templateUrl: './surface-interval.component.html',
    styleUrls: ['./surface-interval.component.scss']
})
export class SurfaceIntervalComponent extends Streamed implements OnInit {
    @Input() public form!: FormGroup;
    @Input() public controlName = 'surfaceInterval';

    public readonly maskitoTimeOptions = maskitoTimeOptionsGenerator({
        mode: 'HH:MM',
        timeSegmentMaxValues: { hours: 48 }
    });

    constructor(
        private schedules: DiveSchedules,
        private fb: NonNullableFormBuilder,
        private dispatcher: ReloadDispatcher,
        private inputs: InputControls) {
        super();
    }

    public get surfaceIntervalInvalid(): boolean {
        const surfaceControl = this.form.get(this.controlName) as AbstractControl;
        const parsed = DateFormats.parseToShortTime(this.formControlValue);
        return this.inputs.controlInValid(surfaceControl) || (!parsed && !this.schedules.selected.primary);
    }

    public get surfaceReadOnly(): boolean {
        return this.schedules.selected.primary;
    }

    public get placeHolder(): string {
        return this.surfaceReadOnly ? 'First dive' : 'HH:MM';
    }

    public get isFirstDive(): boolean {
        return this.schedules.selected.isFirst;
    }

    private get surfaceInterval(): string | null {
        if(this.schedules.selected.primary) {
            return null;
        }

        const currentSeconds = this.schedules.selected.surfaceInterval;
        return DateFormats.formatShortTime(currentSeconds);
    }

    private get formControlValue(): string | null {
        const field = this.form.get(this.controlName) as FormControl<string | null>;
        return field?.value;
    }

    public ngOnInit(): void {
        if(!this.form) {
            this.form = new FormGroup([]);
        }

        const control = this.fb.control(this.surfaceInterval);
        this.form.addControl(this.controlName, control);

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.reload();
            });
    }

    public applyPrimary(): void {
        this.schedules.selected.applyPrimarySurfaceInterval();
        this.reload();
    }

    public applyOneHour(): void {
        this.schedules.selected.applyOneHourSurfaceInterval();
        this.reload();
    }

    public apply30Minutes(): void {
        this.schedules.selected.apply30MinutesSurfaceInterval();
        this.reload();
    }

    public apply2Hour(): void {
        this.schedules.selected.apply2HourSurfaceInterval();
        this.reload();
    }

    public surfaceIntervalChanged(): void {
        if (this.form.invalid) {
            return;
        }

        this.setSurfaceInterval(this.formControlValue);
    }

    private setSurfaceInterval(newValue?: string | null) {
        const parsed = DateFormats.parseToShortTime(newValue);

        if(parsed) {
            this.schedules.selected.surfaceInterval = parsed;
        }
    }

    private reload(): void {
        this.form.patchValue({
            [this.controlName]: this.surfaceInterval
        });
    }
}
