import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faLayerGroup, faTrashAlt, faPlusSquare  } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Tank } from 'scuba-physics';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { Plan, Level, Dive } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.css']
})
export class DepthsComponent implements OnInit, OnDestroy {
    public plan: Plan;
    public cardIcon = faLayerGroup;
    public addIcon = faPlusSquare;
    public removeIcon = faTrashAlt;
    public depthsForm!: FormGroup;
    private dive: Dive;
    private subscription: Subscription;

    constructor(
        private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        public planner: PlannerService,
        public depths: DepthsService,
        public units: UnitConversion) {
        this.plan = this.planner.plan;
        this.dive = this.planner.dive;
        // data are already available, it is ok to generate the levels.
        this.depths.updateLevels();
        // TODO reload needs to rebind all user controls
        this.subscription = this.plan.reloaded.subscribe(() => this.depths.updateLevels());
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get minimumSegments(): boolean {
        return this.plan.minimumSegments;
    }

    // only to get their label, formatted in the tankLabel
    public get tanks(): Tank[] {
        return this.planner.tanks;
    }

    public get noDecoTime(): number {
        return this.plan.noDecoTime;
    }

    public get durationInvalid(): boolean {
        const duration = this.depthsForm.controls.planDuration;
        return InputControls.controlInValid(duration);
    }

    // TODO move to dive
    public get showMaxDuration(): boolean {
        return this.dive.calculated && this.dive.maxTime > 0;
    }

    public ngOnInit(): void {
        this.depthsForm = this.fb.group({
            planDuration: [InputControls.formatNumber(this.numberPipe, this.plan.duration),
                [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])]],
            // pO2: [InputControls.formatNumber(this.numberPipe, this.calc.pO2),
            //     [Validators.required, Validators.min(this.ranges.ppO2[0]), Validators.max(this.ranges.ppO2[1])]],
            // mod: [InputControls.formatNumber(this.numberPipe, this.calc.mod),
            //     [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]],
        });
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public durationChanged(): void {
        if(this.depthsForm.invalid) {
            return;
        }

        const newValue = this.depthsForm.value.planDuration as number;
        // TODO move to depths as property
        this.planner.assignDuration(newValue);
        this.depths.apply();
    }

    public tankLabel(tank: Tank): string {
        return Level.tankLabel(this.units, tank);
    }
}
