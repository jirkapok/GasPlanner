import { Injectable } from '@angular/core';
import { Segment, StandardGases, Tank } from 'scuba-physics';
import { DelayedScheduleService } from './delayedSchedule.service';
import { GasToxicity } from './gasToxicity.service';
import { Level, TankBound } from './models';
import { Plan } from '../shared/plan.service';
import { PlannerService } from './planner.service';
import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';

@Injectable()
export class DepthsService {
    private _levels: Level[] = [];
    private plan: Plan;
    private toxicity: GasToxicity;

    constructor(
        private units: UnitConversion,
        private planner: PlannerService,
        private tanksService: TanksService,
        private delayedCalc: DelayedScheduleService) {
        this.plan = this.planner.plan;
        this.toxicity = new GasToxicity(this.planner.options);
    }

    public get levels(): Level[] {
        return this._levels;
    }

    public get bestNitroxMix(): string {
        const o2 = this.toxicity.bestNitroxMix(this.plan.maxDepth) / 100;
        return StandardGases.nameFor(o2);
    }

    public get plannedDepth(): number {
        const depth = this.plan.maxDepth;
        return this.units.fromMeters(depth);
    }

    public get planDuration(): number {
        return this.plan.duration;
    }

    public set plannedDepth(newValue: number) {
        const depth = this.units.toMeters(newValue);
        this.planner.assignDepth(depth);
        this.levelChanged();
    }

    public set planDuration(newValue: number) {
        this.planner.assignDuration(newValue);
        this.apply();
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

    public applyMaxDuration(): void {
        this.planner.applyMaxDuration();
        this.apply();
    }

    public applyNdlDuration(): void {
        this.planner.applyNdlDuration();
        this.apply();
    }

    public applyMaxDepth(): void {
        const tank = this.tanksService.firstTank.tank;
        const maxDepth = this.toxicity.maxDepth(tank);
        this.planner.assignDepth(maxDepth);
        this.levelChanged();
    }

    public levelChanged(): void {
        this.plan.fixDepths();
        this.apply();
    }

    public assignTank(level: Level, tank: TankBound): void {
        level.tank = tank;
        this.apply();
    }

    public updateLevels(): void {
        const segments: Segment[] = this.plan.segments;
        const converted: Level[] = [];
        segments.forEach(segment => {
            const level = new Level(this.units, segment);
            converted.push(level);
        });

        this._levels = converted;
    }

    private apply(): void {
        this.delayedCalc.schedule();
    }
}
