import { Component, Input, OnDestroy } from '@angular/core';
import { faLayerGroup, faTrashAlt, faPlusSquare  } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

import { Segment, StandardGases, Tank } from 'scuba-physics';
import { Plan, Level, Dive } from '../shared/models';
import { PlannerService } from '../shared/planner.service';

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
    private subscription: Subscription;
    private dive: Dive;


    constructor(public planner: PlannerService) {
        this.plan = this.planner.plan;
        this.dive = this.planner.dive;
        this.updateLevels();

        this.subscription = this.planner.calculated.subscribe(() => {
            this.updateLevels();
        });
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get planDuration(): number {
        return this.plan.duration;
    }

    public set planDuration(newValue: number) {
        this.planner.assignDuration(newValue);
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

    public tankLabel(tank: Tank): string {
        return Level.tankLabel(tank);
    }

    public addSegment(): void {
        this.planner.addSegment();
    }

    public removeSegment(level: Level): void {
        this.planner.removeSegment(level.segment);
    }

    public depthChanged(): void {
        this.plan.fixDepths();
        this.planner.calculate();
    }

    public durationChanged(): void {
        this.planner.calculate();
    }

    public assignTank(level: Level, tank: Tank): void {
        level.tank = tank;
        this.planner.calculate();
    }

    @Input()
    public get plannedDepth(): number {
        return this.plan.maxDepth;
    }

    public set plannedDepth(depth: number) {
        this.planner.assignDepth(depth);
    }

    public get noDecoTime(): number {
        const result = this.plan.noDecoTime;
        if (result >= PlannerService.maxAcceptableNdl) {
            return Infinity;
        }

        return result;
    }

    public get bestMix(): string {
        const o2 = this.planner.bestNitroxMix() / 100;
        return StandardGases.nameFor(o2);
    }

    public get showMaxDuration(): boolean {
        return this.dive.calculated && this.dive.maxTime > 0;
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
