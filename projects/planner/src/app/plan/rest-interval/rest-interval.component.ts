import { Component, effect, model, signal, untracked } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { MaskitoDirective } from '@maskito/angular';
import { maskitoTime } from '@maskito/kit';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { Time } from 'scuba-physics';
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
export class RestIntervalComponent {
    /** Rest interval after the dive in seconds, two-way bound by the hosting chart */
    public readonly restInterval = model<number>(0);

    protected readonly restModel = signal({
        restInterval: '00:00'
    });

    protected readonly restForm = form(this.restModel, path => {
        this.validators.restInterval(path.restInterval);
    });

    protected readonly maskitoTimeOptions = maskitoTime({
        mode: 'HH:MM',
        timeSegmentMaxValues: { hours: 24 }
    });

    constructor(private validators: ValidatorGroups) {
        this.syncModelToText();
        this.syncTextToModel();
    }

    protected get restIntervalInvalid(): boolean {
        const restField = this.restForm.restInterval();
        return InputControls.isFieldInvalid(restField);
    }

    protected apply0Minutes(): void {
        this.restInterval.set(0);
    }

    protected apply30Minutes(): void {
        this.restInterval.set(Time.oneMinute * 30);
    }

    protected applyOneHour(): void {
        this.restInterval.set(Time.oneHour);
    }

    protected apply2Hours(): void {
        this.restInterval.set(Time.oneHour * 2);
    }

    /** Shows the bound value, unless the text already represents it */
    private syncModelToText(): void {
        effect(() => {
            const seconds = this.restInterval();

            untracked(() => {
                const current = DateFormats.parseToShortTime(this.restModel().restInterval);

                if (current !== seconds) {
                    this.restModel.set({ restInterval: DateFormats.formatShortTime(seconds) });
                }
            });
        });
    }

    /** Writes only valid text back to the bound value */
    private syncTextToModel(): void {
        effect(() => {
            const field = this.restForm.restInterval();

            if (!field.valid()) {
                return;
            }

            const parsed = DateFormats.parseToShortTime(field.value());

            if (parsed !== null && parsed !== untracked(this.restInterval)) {
                this.restInterval.set(parsed);
            }
        });
    }
}
