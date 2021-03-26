import { Component, OnInit, Input } from '@angular/core';
import { faLayerGroup, faTrashAlt, faPlusSquare, faTshirt  } from '@fortawesome/free-solid-svg-icons';

import { Plan } from '../shared/models';
import { Segment, StandardGases } from 'scuba-physics';
import { PlannerService } from '../shared/planner.service';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.css']
})
export class DepthsComponent implements OnInit {
    @Input()
    public formValid = true;
    public plan: Plan;
    public icon = faLayerGroup;
    public addIcon = faPlusSquare;
    public removeIcon = faTrashAlt;
    public segments: Segment[] = [
        new Segment(0, 30, StandardGases.air, 10)
    ];

    constructor(public planner: PlannerService) {
        this.plan = this.planner.plan;
    }

    ngOnInit(): void {
        this.planner.calculate();
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
        return this.segments.length > 1;
    }

    private counter = 10;

    public addSegment(): void {
        this.counter++;
        const newSegment = new Segment(0, 30, StandardGases.air, this.counter);
        this.segments.push(newSegment);
    }

    public removeSegment(segment: Segment): void {
        this.segments = this.segments.filter(s => s !== segment);
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
