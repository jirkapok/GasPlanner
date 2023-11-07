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
import {DiveSchedules} from '../shared/dive.schedules';

@Component({
    selector: 'app-depths-simple',
    templateUrl: './depths-simple.component.html',
    styleUrls: ['./depths-simple.component.scss']
})
export class DepthsSimpleComponent extends Streamed implements OnInit {
    public cardIcon = faLayerGroup;
    public simpleForm!: FormGroup<{
        planDuration: FormControl<number>;
    }>;

    constructor(
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion,
        private schedules: DiveSchedules) {
        super();
        // data are already available, it is ok to generate the levels.
        this.schedules.selected.depths.updateLevels();
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
        return this.schedules.selected.depths;
    }

    public get diveResult(): DiveResults {
        return this.schedules.selected.diveResult;
    }

    public ngOnInit(): void {
        this.simpleForm = this.fb.group({
            planDuration: [Precision.round(this.depths.planDuration, 1), this.validators.duration],
        });

        // TODO selected may change, values arent updated, fix the eventing
        // this combination of event handlers isn't efficient, but leave it because its simple
        // for simple view, this is also kicked of when switching to simple view
        this.schedules.selected.plan.reloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.depths.updateLevels();
                this.reloadSimple();
            });
    }

    public durationChanged(): void {
        if (this.simpleForm.invalid) {
            return;
        }

        const newValue = this.simpleForm.value.planDuration;
        this.depths.planDuration = Number(newValue);
    }

    private reloadSimple(): void {
        // depth is reloaded in its nested component
        this.simpleForm.patchValue({
            planDuration: Precision.round(this.depths.planDuration, 1)
        });
    }
}
