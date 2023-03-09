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
    private toxicity: GasToxicity;

    constructor(
        private units: UnitConversion,
        private planner: PlannerService,
        private tanksService: TanksService,
        private delayedCalc: DelayedScheduleService,
        private plan: Plan) {
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

    private get firstTank(): Tank {
        return this.tanksService.firstTank.tank;
    }

    public set plannedDepth(newValue: number) {
        const depth = this.units.toMeters(newValue);
        this.assignDepth(depth);
        this.levelChanged();
    }

    public set planDuration(newValue: number) {
        this.assignDuration(newValue);
        this.apply();
    }

    public addSegment(): void {
        this.addSegmentToPlan();
        this.updateLevels();
        this.apply();
    }

    public removeSegment(level: Level): void {
        this.plan.removeSegment(level.segment);
        this.updateLevels();
        this.apply();
    }

    public applyMaxDuration(): void {
        const newValue = this.planner.dive.maxTime;
        this.assignDuration(newValue);
        this.apply();
    }

    public applyNdlDuration(): void {
        const newValue = this.plan.noDecoTime;
        this.assignDuration(newValue);
        this.apply();
    }

    public assignDuration(newDuration: number): void {
        this.plan.assignDuration(newDuration, this.firstTank, this.planner.options);
    }

    public applyMaxDepth(): void {
        const maxDepth = this.toxicity.maxDepth(this.firstTank);
        this.assignDepth(maxDepth);
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
            const tank = segment.tank as Tank;
            const boundTank = this.tanksService.firstBy(tank) as TankBound;
            const level = new Level(this.units, segment, boundTank);
            converted.push(level);
        });

        this._levels = converted;
    }

    public assignDepth(newDepth: number): void {
        const options = this.planner.options;
        this.plan.assignDepth(newDepth, this.firstTank, options);
    }

    private addSegmentToPlan(): void {
        const segments = this.plan.segments;
        const lastUsedTank = segments[segments.length - 1].tank;
        const tank = lastUsedTank as Tank;
        this.plan.addSegment(tank);
    }

    private apply(): void {
        this.delayedCalc.schedule();
    }
}
