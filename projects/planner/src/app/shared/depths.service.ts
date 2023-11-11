import { Injectable } from '@angular/core';
import { GasToxicity } from './gasToxicity.service';
import { Level, TankBound } from './models';
import { Plan } from './plan.service';
import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { Streamed } from './streamed';
import {Observable, Subject, takeUntil} from 'rxjs';
import { OptionsService } from './options.service';
import { Tank, Segment, StandardGases, Precision } from 'scuba-physics';
import { DiveResults } from './diveresults';

@Injectable()
export class DepthsService extends Streamed {
    // TODO rebind changed$ to delayedCalc.schedule()
    public changed$: Observable<void>;
    private _levels: Level[] = [];
    private toxicity: GasToxicity;
    private onChanged = new Subject<void>();
    private plan = new Plan();

    constructor(
        private units: UnitConversion,
        private tanksService: TanksService,
        private dive: DiveResults,
        private optionsService: OptionsService) {
        super();

        this.changed$ = this.onChanged.asObservable();
        this.toxicity = this.optionsService.toxicity;
        this.plan.reloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.updateLevels());

        // this enforces to initialize the levels, needs to be called after subscribe to plan
        if(this.plan.maxDepth === 0) {
            let requiredDepth = this.units.defaults.stopsDistance * 10; // 30 m or 100 ft
            requiredDepth = this.units.toMeters(requiredDepth);
            const options = this.optionsService.getOptions();
            this.plan.setSimple(requiredDepth, 12,  this.firstTank, options);
        }

        this.tanksService.tankRemoved.pipe(takeUntil(this.unsubscribe$))
            .subscribe((removed: Tank) => this.plan.resetSegments(removed, this.firstTank));
    }

    public get levels(): Level[] {
        return this._levels;
    }

    public get segments(): Segment[] {
        return this.plan.segments;
    }

    public get bestNitroxMix(): string {
        const o2 = this.toxicity.bestNitroxMix(this.plan.maxDepth) / 100;
        return StandardGases.nameFor(o2);
    }

    public get plannedDepth(): number {
        return this.units.fromMeters(this.plannedDepthMeters);
    }

    public get plannedDepthMeters(): number {
        return this.plan.maxDepth;
    }

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
        const newValue = this.dive.maxTime;
        this.assignDuration(newValue);
        this.apply();
    }

    public applyNdlDuration(): void {
        const newValue = this.dive.noDecoTime;
        this.assignDuration(newValue);
        this.apply();
    }

    public assignDuration(newDuration: number): void {
        this.plan.assignDuration(newDuration, this.firstTank, this.optionsService.getOptions());
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

    // TODO replace by stream
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
        const options = this.optionsService.getOptions();
        this.plan.assignDepth(newDepth, this.firstTank, options);
    }

    public loadFrom(other: Segment[]): void {
        this.plan.loadFrom(other);
    }

    public setSimple(): void {
        this.plan.setSimple(this.plan.maxDepth, this.plan.duration, this.firstTank, this.optionsService.getOptions());
    }

    private addSegmentToPlan(): void {
        const segments = this.plan.segments;
        const lastUsedTank = segments[segments.length - 1].tank;
        const tank = lastUsedTank as Tank;
        this.plan.addSegment(tank);
    }

    private apply(): void {
        this.onChanged.next();
    }
}
