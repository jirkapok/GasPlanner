import { Component, OnDestroy } from '@angular/core';
import { faLayerGroup, faTrashAlt, faPlusSquare  } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Tank } from 'scuba-physics';
import { DepthsService } from '../shared/depths.service';
import { Plan, Level, Dive } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depths',
    templateUrl: './depths.component.html',
    styleUrls: ['./depths.component.css']
})
export class DepthsComponent implements OnDestroy {
    public plan: Plan;
    public cardIcon = faLayerGroup;
    public addIcon = faPlusSquare;
    public removeIcon = faTrashAlt;
    private dive: Dive;
    private subscription: Subscription;

    constructor(
        public planner: PlannerService,
        public depths: DepthsService,
        public units: UnitConversion) {
        this.plan = this.planner.plan;
        this.dive = this.planner.dive;
        // data are already available, it is ok to generate the levels.
        this.depths.updateLevels();
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

    public get showMaxDuration(): boolean {
        return this.dive.calculated && this.dive.maxTime > 0;
    }

    public get planDuration(): number {
        return this.plan.duration;
    }

    public set planDuration(newValue: number) {
        this.planner.assignDuration(newValue);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public tankLabel(tank: Tank): string {
        return Level.tankLabel(this.units, tank);
    }
}
