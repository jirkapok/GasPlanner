import { Component, effect, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoTime } from '@maskito/kit';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { takeUntil } from 'rxjs';
import { Streamed } from '../../shared/streamed';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { DateFormats } from '../../shared/formaters';

@Component({
    selector: 'app-rest-interval',
    templateUrl: './rest-interval.component.html',
    styleUrls: ['./rest-interval.component.scss'],
    imports: [
        MaskitoDirective,
        FormField,
        MdbDropdownModule,
        MdbFormsModule,
        TranslatePipe
    ]
})
export class RestIntervalComponent extends Streamed {
    protected restModel = signal({
        restInterval: '00:00'
    });

    protected restForm = form(this.restModel, path => {
        this.validators.restInterval(path.restInterval)
    });
    protected readonly maskitoTimeOptions = maskitoTime({
        mode: 'HH:MM',
        timeSegmentMaxValues: { hours: 24 }
    });

    constructor(
        private schedules: DiveSchedules,
        private dispatcher: ReloadDispatcher,
        private validators: ValidatorGroups
    ) {
        super();

        this.restModel.set({ restInterval: this.restInterval });

        this.setupRestIntervalSync();

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reload());
    }

    protected get restIntervalInvalid(): boolean {
        const restField = this.restForm.restInterval();
        return InputControls.isFieldInvalid(restField);
    }

    private get restInterval(): string {
        return DateFormats.formatShortTime(this.schedules.restInterval);
    }

    protected apply0Minutes(): void {
        this.schedules.apply0MinutesRestInterval();
        this.reload();
    }

    protected applyOneHour(): void {
        this.schedules.applyOneHourRestInterval();
        this.reload();
    }

    protected apply30Minutes(): void {
        this.schedules.apply30MinutesRestInterval();
        this.reload();
    }

    protected apply2Hours(): void {
        this.schedules.apply2HoursRestInterval();
        this.reload();
    }

    private setupRestIntervalSync(): void {
        effect(() => {
            const field = this.restForm.restInterval();

            if (field.valid()) {
                this.setRestInterval(field.value());
            }
        });
    }

    private setRestInterval(newValue: string) {
        const parsed = DateFormats.parseToShortTime(newValue);

        if (parsed !== null && parsed !== undefined) {
            this.schedules.restInterval = parsed;
        }
    }

    private reload(): void {
        this.restModel.set({ restInterval: this.restInterval });
    }}
