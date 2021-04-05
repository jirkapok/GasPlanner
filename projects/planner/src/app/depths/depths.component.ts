import { Component, Input, OnDestroy } from '@angular/core';
import { faLayerGroup, faTrashAlt, faPlusSquare  } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

import { Segment, StandardGases } from 'scuba-physics';
import { Plan, Level } from '../shared/models';
import { PlannerService } from '../shared/planner.service';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.css']
})
export class DepthsComponent implements OnDestroy {
    private levels: Level[] = [];
    private subscription: Subscription;
    @Input()
    public formValid = true;
    public plan: Plan;
    public cardIcon = faLayerGroup;
    public addIcon = faPlusSquare;
    public removeIcon = faTrashAlt;

    constructor(public planner: PlannerService) {
        this.plan = this.planner.plan;
        this.updateLevels();

        this.subscription = this.planner.calculated.subscribe(() => {
            this.updateLevels();
        });
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private updateLevels(): void {
        const segments: Segment[] = this.plan.items;
        const converted: Level[] = [];
        segments.forEach(segment => {
            const level = new Level(segment);
            converted.push(level);
        });

        this.levels = converted;
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

    public get segments(): Level[] {
        return this.levels;
    }

    public addSegment(): void {
        this.planner.addSegment();
    }

    public removeSegment(level: Level): void {
        // TODO multilevel: prevent remove of first segment starting from 0m.
        this.planner.removeSegment(level.segment);
    }

    public depthChanged(level: Level): void {
        this.planner.calculate();
    }

    public durationChanged(level: Level): void {
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
        if (result >= 1000) {
            return Infinity;
        }

        return result;
    }

    public get bestMix(): string {
        const o2 = this.planner.bestNitroxMix() / 100;
        return StandardGases.nameFor(o2);
    }
}
