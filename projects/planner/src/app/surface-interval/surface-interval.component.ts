import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { maskitoTimeOptionsGenerator } from '@maskito/kit';
import { DiveSchedules } from '../shared/dive.schedules';
import { Time } from 'scuba-physics';
import { takeUntil } from 'rxjs';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { Streamed } from '../shared/streamed';

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
        private dispatcher: ReloadDispatcher) {
        super();
    }

    public get surfaceIntervalInvalid(): boolean {
        return false; // TODO surfaceIntervalInvalid
    }

    public get surfaceReadOnly(): boolean {
        return this.schedules.selected.surfaceInterval === Number.POSITIVE_INFINITY;
    }

    public get placeHolder(): string {
        return this.surfaceReadOnly ? 'First dive' : 'HH:MM';
    }

    public get isFirstDive(): boolean {
        return this.schedules.selected.isFirst;
    }

    private get surfaceInterval(): string | null {
        const currentSeconds = this.schedules.selected.surfaceInterval;
        if(currentSeconds === Number.POSITIVE_INFINITY) {
            return null;
        }

        const resultHours = Math.floor(currentSeconds / (Time.oneHour));
        const resultHoursPad = resultHours.toString().padStart(2, '0');
        const resultMinutes = (currentSeconds % (Time.oneHour)) / Time.oneMinute;
        const resultMinutesPad = resultMinutes.toString().padStart(2, '0');
        const result = `${resultHoursPad}:${resultMinutesPad}`;
        console.log(`surface interval: ${ result }`);
        return result;
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

    public applyFirst(): void {
        this.setSurfaceIntervalSeconds(Number.POSITIVE_INFINITY);
        this.reload();
    }

    public applyOneHour(): void {
        this.setSurfaceIntervalSeconds(Time.oneHour);
        this.reload();
    }

    public apply30Minutes(): void {
        this.setSurfaceIntervalSeconds(Time.oneMinute * 30);
        this.reload();
    }

    public apply2Hour(): void {
        this.setSurfaceIntervalSeconds(Time.oneHour * 2);
        this.reload();
    }

    public surfaceIntervalChanged(): void {
        if (this.form.invalid) {
            return;
        }

        const field = this.form.get(this.controlName);
        const newValue: string | null = field?.value;
        this.setSurfaceInterval(newValue);
    }

    private setSurfaceInterval(newValue?: string | null) {
        const timeFormat = /(\d{2})[:](\d{2})/;
        // the only way how set first dive is by using the applyFirst method
        const candidate = newValue || '00:00';
        const parsed = candidate.match(timeFormat);
        if(parsed) {
            const newHours = Number(parsed[1]) * Time.oneHour;
            const newMinutes = Number(parsed[2]) * Time.oneMinute;
            const newSeconds = newHours + newMinutes;
            this.setSurfaceIntervalSeconds(newSeconds);
        }
    }

    private setSurfaceIntervalSeconds(newValue: number) {
        this.schedules.selected.surfaceInterval = newValue;
        console.log(`SET surface interval: ${ newValue }`);
    }

    private reload(): void {
        this.form.patchValue({
            [this.controlName]: this.surfaceInterval
        });
    }
}
