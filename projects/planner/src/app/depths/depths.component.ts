import { Component, Input, OnDestroy } from '@angular/core';
import { faLayerGroup, faTrashAlt, faPlusSquare  } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

import { Segment, StandardGases, Tank } from 'scuba-physics';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { Plan, Level, Dive } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.css']
})
export class DepthsComponent implements OnDestroy {
    @Input()
    public formValid = true;
    public plan: Plan;
    public cardIcon = faLayerGroup;
    public addIcon = faPlusSquare;
    public removeIcon = faTrashAlt;
    private _levels: Level[] = [];
    private dive: Dive;
    private subscription: Subscription;
    private toxicity: GasToxicity;

    constructor(
        public planner: PlannerService,
        public units: UnitConversion,
        private delayedCalc: DelayedScheduleService) {
        this.plan = this.planner.plan;
        this.dive = this.planner.dive;
        this.toxicity = new GasToxicity(this.planner.options);
        // data are already available, it is ok to generate the levels.
        this.updateLevels();
        this.subscription = this.plan.reloaded.subscribe(() => this.updateLevels());
    }

    @Input()
    public get plannedDepth(): number {
        return this.plan.maxDepth;
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

    public get levels(): Level[] {
        return this._levels;
    }

    public get tanks(): Tank[] {
        return this.planner.tanks;
    }

    public get noDecoTime(): number {
        const result = this.plan.noDecoTime;
        if (result >= PlannerService.maxAcceptableNdl) {
            return Infinity;
        }

        return result;
    }

    public get showMaxDuration(): boolean {
        return this.dive.calculated && this.dive.maxTime > 0;
    }

    public get planDuration(): number {
        return this.plan.duration;
    }

    public get bestNitroxMix(): string {
        const o2 = this.toxicity.bestNitroxMix(this.plan.maxDepth) / 100;
        return StandardGases.nameFor(o2);
    }

    public set planDuration(newValue: number) {
        this.planner.assignDuration(newValue);
    }

    public set plannedDepth(depth: number) {
        this.planner.assignDepth(depth);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public applyMaxDuration(): void {
        this.planner.applyMaxDuration();
        this.apply();
    }

    public applyNdlDuration(): void {
        this.planner.applyNdlDuration();
        this.apply();
    }

    public applyMaxDepth(): void {
        const tank = this.planner.firstTank;
        const maxDepth = this.toxicity.maxDepth(tank);
        this.planner.assignDepth(maxDepth);
        this.apply();
    }

    public tankLabel(tank: Tank): string {
        return Level.tankLabel(tank);
    }

    public addSegment(): void {
        this.planner.addSegment();
        this.updateLevels();
        this.apply();
    }

    public removeSegment(level: Level): void {
        this.planner.removeSegment(level.segment);
        this.updateLevels();
        this.apply();
    }

    public depthChanged(): void {
        this.plan.fixDepths();
        this.apply();
    }

    public assignTank(level: Level, tank: Tank): void {
        level.tank = tank;
        this.apply();
    }

    public apply(): void {
        this.delayedCalc.schedule();
    }

    private updateLevels(): void {
        const segments: Segment[] = this.plan.segments;
        const converted: Level[] = [];
        segments.forEach(segment => {
            const level = new Level(segment);
            converted.push(level);
        });

        this._levels = converted;
    }
}
