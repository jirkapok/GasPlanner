import { Injectable } from '@angular/core';
import { Time, Segment, Segments, PlanFactory,
    Options, Tank } from 'scuba-physics';
import { Strategies } from './models';

@Injectable()
export class Plan {
    private static readonly defaultDuration = Time.oneMinute * 10;
    // TODO move strategy to Consumption algorithm selection
    public strategy: Strategies = Strategies.ALL;
    private _segments: Segments = new Segments();

    constructor() {
    }

    public get length(): number {
        return this._segments.length;
    }

    public get minimumSegments(): boolean {
        return this.length > 1;
    }

    public get notEnoughTime(): boolean {
        return this.length === 2 && this.segments[1].duration === 0;
    }

    public get segments(): Segment[] {
        return this._segments.items;
    }

    public get maxDepth(): number {
        return this._segments.maxDepth;
    }

    public get startAscentIndex(): number {
        return this._segments.startAscentIndex;
    }

    public get startAscentTime(): number {
        return this._segments.startAscentTime;
    }

    /** in minutes */
    public get duration(): number {
        const seconds = this._segments.duration;
        return Time.toMinutes(seconds);
    }

    public get availablePressureRatio(): number {
        return this.strategy === Strategies.THIRD ? 2 / 3 : 1;
    }

    public get needsReturn(): boolean {
        return this.strategy !== Strategies.ALL;
    }

    public copySegments(): Segments {
        return this._segments.copy();
    }

    public setSimple(depth: number, duration: number, tank: Tank, options: Options): void {
        this.reset(depth, duration, tank, options);
    }


    public assignDepth(newDepth: number, tank: Tank, options: Options): void {
        this._segments = PlanFactory.createPlan(newDepth, this.duration, tank, options);
    }

    public assignDuration(newDuration: number, tank: Tank, options: Options): void {
        this._segments = PlanFactory.createPlan(this.maxDepth, newDuration, tank, options);
    }

    public addSegment(tank: Tank): void {
        const last = this._segments.last();
        const created = this._segments.addChangeTo(last.endDepth, tank.gas, Plan.defaultDuration);
        created.tank = tank;
    }

    public removeSegment(segment: Segment): void {
        this._segments.remove(segment);
    }

    public fixDepths(): void {
        this._segments.fixStartDepths();
    }

    public loadFrom(other: Segment[]): void {
        if (other.length <= 1) {
            return;
        }

        // TODO restore Strategy
        // this.strategy = other.strategy;
        // cant use copy, since deserialized objects wouldn't have one.
        this._segments = Segments.fromCollection(other);
    }

    public resetSegments(removed: Tank, replacement: Tank): void {
        this.segments.forEach(segment => {
            if (segment.tank === removed) {
                segment.tank = replacement;
            }
        });
    }

    private reset(depth: number, duration: number, tank: Tank, options: Options): void {
        this._segments = PlanFactory.createPlan(depth, duration, tank, options);
    }
}
