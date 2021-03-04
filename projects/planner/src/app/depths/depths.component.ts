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

    constructor(private planer: PlannerService) {
        this.plan = this.planer.plan;
    }

    ngOnInit(): void {
        this.planer.calculate();
    }

    public get planDuration(): number {
        return this.plan.duration;
    }

    public set planDuration(newValue: number) {
        this.plan.duration = newValue;
        this.planer.calculate();
    }

    @Input()
    public get plannedDepth(): number {
        return this.plan.depth;
    }

    public set plannedDepth(depth: number) {
        this.plan.depth = depth;
        this.planer.calculate();
    }

    public get noDecoTime(): number {
        const result = this.plan.noDecoTime;
        if (result >= 1000) {
            return Infinity;
        }

        return result;
    }

    public get bestMix(): string {
        const o2 = this.planer.bestNitroxMix() / 100;
        return StandardGases.nameFor(o2);
    }
}
