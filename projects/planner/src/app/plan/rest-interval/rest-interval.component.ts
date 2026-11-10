import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
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
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        MaskitoDirective,
        ReactiveFormsModule,
        MdbDropdownModule,
        MdbFormsModule,
        TranslatePipe
    ]
})
export class RestIntervalComponent extends Streamed implements OnInit {
    @Input() public form!: FormGroup;
    @Input() public controlName = 'restInterval';

    public readonly maskitoTimeOptions = maskitoTime({
        mode: 'HH:MM',
        timeSegmentMaxValues: { hours: 48 }
    });

    constructor(
        private schedules: DiveSchedules,
        private fb: NonNullableFormBuilder,
        private dispatcher: ReloadDispatcher,
        private inputs: InputControls,
        private validators: ValidatorGroups) {
        super();
    }

    public get restIntervalInvalid(): boolean {
        const restControl = this.form.get(this.controlName) as AbstractControl;
        return this.inputs.controlInValid(restControl);
    }

    private get restInterval(): string {
        return this.schedules.selected.restIntervalText;
    }

    public ngOnInit(): void {
        if(!this.form) {
            this.form = this.fb.group([]);
            const control = this.fb.control(this.restInterval, [
                this.validators.restInterval()
            ]);
            this.form.addControl(this.controlName, control);
        }

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.reload();
            });
    }

    public apply0Minutes(): void {
        this.schedules.selected.apply0MinutesRestInterval();
        this.reload();
    }

    public applyOneHour(): void {
        this.schedules.selected.applyOneHourRestInterval();
        this.reload();
    }

    public apply30Minutes(): void {
        this.schedules.selected.apply30MinutesRestInterval();
        this.reload();
    }

    public apply2Hours(): void {
        this.schedules.selected.apply2HoursRestInterval();
        this.reload();
    }

    public restIntervalChanged(): void {
        if (this.form.invalid) {
            return;
        }

        const field = this.form.get(this.controlName) as FormControl<string | null>;
        this.setRestInterval(field.value);
    }

    private setRestInterval(newValue?: string | null) {
        const parsed = DateFormats.parseToShortTime(newValue);

        if(parsed) {
            this.schedules.selected.restInterval = parsed;
        }
    }

    private reload(): void {
        this.form.patchValue({
            [this.controlName]: this.restInterval
        });
    }}
