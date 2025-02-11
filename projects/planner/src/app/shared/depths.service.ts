import { Injectable } from '@angular/core';
import { Level, TankBound } from './models';
import { Plan } from './plan.service';
import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { Streamed } from './streamed';
import { takeUntil } from 'rxjs';
import { OptionsService } from './options.service';
import {
    Tank, Segment, GasNames, Precision, GasToxicity
} from 'scuba-physics';
import { DiveResults } from './diveresults';
import { ReloadDispatcher } from './reloadDispatcher';

@Injectable()
export class DepthsService extends Streamed {
    private _levels: Level[] = [];
    private toxicity: GasToxicity;
    private plan = new Plan();

    constructor(
        private units: UnitConversion,
        private tanksService: TanksService,
        private dive: DiveResults,
        private optionsService: OptionsService,
        private dispatcher: ReloadDispatcher) {
        super();
        this.toxicity = this.optionsService.toxicity;

        // this enforces to initialize the levels, needs to be called after subscribe to plan
        if(this.plan.maxDepth === 0) {
            let requiredDepth = this.units.defaults.stopsDistance * 10; // 30 m or 100 ft
            requiredDepth = this.units.toMeters(requiredDepth);
            const options = this.optionsService.getOptions();
            this.plan.setSimple(requiredDepth, 12,  this.firstTank, options);
        }

        this.dispatcher.tankRemoved$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((removed: Tank) => this.tankRemoved(removed));

        this.updateLevels();
    }

    public get levels(): Level[] {
        return this._levels;
    }

    public get segments(): Segment[] {
        return this.plan.segments;
    }

    public get bestNitroxMix(): string {
        const o2 = this.toxicity.bestNitroxMix(this.plan.maxDepth) / 100;
        return GasNames.nameFor(o2);
    }

    public get plannedDepth(): number {
        return this.units.fromMeters(this.plannedDepthMeters);
    }

    public get plannedDepthMeters(): number {
        return this.plan.maxDepth;
    }

    /** in minutes */
    public get planDuration(): number {
        return this.plan.duration;
    }

    public get notEnoughTime(): boolean {
        return this.plan.notEnoughTime;
    }

    public get startAscentTime(): number {
        return this.plan.startAscentTime;
    }

    public get needsReturn(): boolean {
        return this.plan.needsReturn;
    }

    public get startAscentIndex(): number {
        return this.plan.startAscentIndex;
    }

    public get minimumSegments(): boolean {
        return this.plan.minimumSegments;
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
        this.plan.assignDuration(newValue, this.firstTank, this.optionsService.getOptions());
        this.updateLevels();
        this.apply();
    }

    public addSegment(): void {
        this.addSegmentToPlan();
        this.updateLevels();
        this.levelChanged();
    }

    public removeSegment(level: Level): void {
        this.plan.removeSegment(level.segment);
        this.updateLevels();
        this.levelChanged();
    }

    public applyMaxDuration(): void {
        this.planDuration = this.dive.maxTime;
    }

    public applyNdlDuration(): void {
        this.planDuration = this.dive.noDecoTime;
    }

    public applyMaxDepth(): void {
        let maxDepth = this.toxicity.maxDepth(this.firstTank);
        let maxUnit = this.units.fromMeters(maxDepth);
        maxUnit = Precision.floor(maxUnit, 1);
        maxDepth = this.units.toMeters(maxUnit);
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

    public loadFrom(other: Segment[]): void {
        this.plan.loadFrom(other);
        this.depthsReloaded();
    }

    /** does not send any vent since it needs to be handled for all dives at once */
    public setSimple(): void {
        this.plan.setSimple(this.plan.maxDepth, this.plan.duration, this.firstTank, this.optionsService.getOptions());
        this.updateLevels();
    }

    public fixDepths(): void {
        this.plan.fixDepths();
    }

    private assignDepth(newDepth: number): void {
        const options = this.optionsService.getOptions();
        this.plan.assignDepth(newDepth, this.firstTank, options);
        this.updateLevels();
    }

    private addSegmentToPlan(): void {
        const segments = this.plan.segments;
        const lastUsedTank = segments[segments.length - 1].tank;
        const tank = lastUsedTank as Tank;
        this.plan.addSegment(tank);
    }

    private apply(): void {
        this.dispatcher.sendDepthChanged();
    }

    private tankRemoved(removed: Tank): void {
        this.plan.resetSegments(removed, this.firstTank);
        this.dispatcher.sendDepthChanged();
    }

    private updateLevels(): void {
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

    private depthsReloaded(): void {
        this.updateLevels();
        this.dispatcher.sendDepthsReloaded(this);
    }
}
