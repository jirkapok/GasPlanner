import { Component, OnInit, Input } from '@angular/core';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { Plan } from '../shared/models';
import { StandardGases } from 'scuba-physics';
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

    constructor(private planner: PlannerService) {
        this.plan = this.planner.plan;
    }

    ngOnInit(): void {
        this.planner.calculate();
    }
    public get isTechnical(): boolean {
        return this.planner.isTechnical;
    }

    public get planDuration(): number {
        return this.plan.duration;
    }

    public set planDuration(newValue: number) {
        this.plan.duration = newValue;
        this.planner.calculate();
    }

    @Input()
    public get plannedDepth(): number {
        return this.plan.depth;
    }

    public set plannedDepth(depth: number) {
        this.plan.depth = depth;
        this.planner.calculate();
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
