import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray,
    UntypedFormBuilder, UntypedFormGroup, Validators
} from '@angular/forms';
import { faLayerGroup, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { Dive } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { Streamed } from '../shared/streamed';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Plan } from '../shared/plan.service';

@Component({
    selector: 'app-depths-simple',
    templateUrl: './depths-simple.component.html',
    styleUrls: ['./depths-simple.component.scss']
})
export class DepthsSimpleComponent extends Streamed implements OnInit {
    public cardIcon = faLayerGroup;
    public addIcon = faPlus;
    public removeIcon = faMinus;
    public simpleForm!: UntypedFormGroup;
    public dive: Dive;

    constructor(
        private fb: UntypedFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public planner: PlannerService,
        public depths: DepthsService,
        public units: UnitConversion,
        private plan: Plan) {
        super();
        this.dive = this.planner.dive;
        // data are already available, it is ok to generate the levels.
        this.depths.updateLevels();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get noDecoTime(): number {
        return this.plan.noDecoTime;
    }

    public get durationInvalid(): boolean {
        const duration = this.simpleForm.controls.planDuration;
        return this.inputs.controlInValid(duration);
    }

    public ngOnInit(): void {
        this.simpleForm = this.fb.group({
            planDuration: this.createDurationControl(this.depths.planDuration),
        });

        // this combination of event handlers isn't efficient, but leave it because its simple
        // for simple view, this is also kicked of when switching to simple view
        this.plan.reloaded$.pipe(takeUntil(this.unsubscribe$))
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

    // for simple view only
    private reloadSimple(): void {
        // depth is reloaded in its nested component
        this.simpleForm.patchValue({
            planDuration: this.inputs.formatNumber(this.depths.planDuration)
        });
    }

    private createDurationControl(duration: number): [string | null, Validators[]] {
        return [this.inputs.formatNumber(duration), this.validators.duration];
    }
}
