import { Subject } from 'rxjs';
import { Ceiling, Time, Event, Segment, Segments, SegmentsFactory,
    StandardGases, Options, Tank } from 'scuba-physics';

export enum Strategies {
    ALL = 1,
    HALF = 2,
    THIRD = 3
}

export class Level {
    constructor(
        public segment: Segment
    ){
    }

    public static tankLabel(tank: Tank | undefined): string {
        if(!tank) {
            return '';
        }

        return `${tank.id}. ${tank.name}/${tank.size}/${tank.startPressure}`;
    }

    public get duration(): number {
        return Time.toMinutes(this.segment.duration);
    }

    /** in minutes */
    public set duration(newValue: number) {
        this.segment.duration = Time.toSeconds(newValue);
    }

    public get startDepth(): number {
        return this.segment.startDepth;
    }

    public get endDepth(): number {
        return this.segment.endDepth;
    }

    public set endDepth(newValue: number) {
        this.segment.endDepth = newValue;
    }

    public get tank(): Tank | undefined {
        return this.segment.tank;
    }

    public set tank(newValue: Tank | undefined) {
        this.segment.tank = newValue;
    }

    public get tankLabel(): string {
        return Level.tankLabel(this.segment.tank);
    }
}

export class Plan {
    private static readonly defaultDuration = Time.oneMinute * 10;
    public noDecoTime = 0;
    public changed;
    private _segments: Segments = new Segments();
    private onChanged = new Subject();

    /** provide the not necessary tank and options only to start from simple valid profile */
    constructor(public strategy: Strategies, depth: number, duration: number, tank: Tank, options: Options) {
        this.reset(depth, duration, tank, options);
        this.changed = this.onChanged.asObservable();
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

    public copySegments(): Segments {
        return this._segments.copy();
    }

    public get segments(): Segment[] {
        return this._segments.items;
    }

    public setSimple(depth: number, duration: number, tank: Tank, options: Options): void {
        this.reset(depth, duration, tank, options);
        this.onChanged.next({});
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

    public assignDepth(newDepth: number, tank: Tank, options: Options): void {
        this._segments = SegmentsFactory.createForPlan(newDepth, this.duration, tank, options);
        this.onChanged.next({});
    }

    /** in minutes */
    public get duration(): number {
        const seconds = this._segments.duration;
        return Time.toMinutes(seconds);
    }

    public assignDuration(newDuration: number, tank: Tank, options: Options): void {
        this._segments = SegmentsFactory.createForPlan(this.maxDepth, newDuration, tank, options);
        this.onChanged.next({});
    }

    public addSegment(tank: Tank): void {
        const last = this._segments.last();
        const created = this._segments.addChangeTo(last.endDepth, tank.gas, Plan.defaultDuration);
        created.tank = tank;
        this.onChanged.next({});
    }

    public removeSegment(segment: Segment): void {
        this._segments.remove(segment);
        this.onChanged.next({});
    }

    public fixDepths(): void {
        this._segments.fixStartDepths();
    }

    public get availablePressureRatio(): number {
        return this.strategy === Strategies.THIRD ? 2 / 3 : 1;
    }

    public get needsReturn(): boolean {
        return this.strategy !== Strategies.ALL;
    }

    public get noDecoExceeded(): boolean {
        return this.duration > this.noDecoTime;
    }

    public loadFrom(other: Segment[]): void {
        // TODO restore Strategy
        // this.strategy = other.strategy;
        // cant use copy, since deserialized objects wouldn't have one.
        this._segments = Segments.fromCollection(other);
        this.onChanged.next({});
    }

    public resetSegments(removed: Tank, replacement: Tank): void {
        this.segments.forEach(segment => {
            if (segment.tank === removed) {
                segment.tank = replacement;
            }
        });
    }

    private reset(depth: number, duration: number, tank: Tank, options: Options): void {
        this._segments = SegmentsFactory.createForPlan(depth, duration, tank, options);
    }
}

export class Dive {
    public calculated = false;
    public maxTime = 0;
    public timeToSurface = 0;
    public turnPressure = 0;
    public turnTime = 0;
    public needsReturn = false;
    public notEnoughGas = false;
    public notEnoughTime = false;
    public noDecoExceeded = false;
    public emergencyAscentStart = 0;
    public averageDepth = 0;
    public wayPoints: WayPoint[] = [];
    public ceilings: Ceiling[] = [];
    public events: Event[] = [];

    /** can't use plan duration, because it doesn't contain ascent */
    public get totalDuration(): number {
        if (this.wayPoints.length === 0) {
            return 0;
        }

        return this.wayPoints[this.wayPoints.length - 1].endTime;
    }

    public get hasErrors(): boolean {
        // the only errors preventing draw chart
        return this.calculated && this.notEnoughTime;
    }
}

export enum SwimAction {
    hover = 0,
    ascent = 1,
    descent = 2,
    switch = 3
}

export class WayPoint {
    public selected = false;

    /** in seconds */
    public startTime = 0;
    /** in seconds */
    public endTime = 0;
    /** in meters */
    private _startDepth = 0;
    /** in meters */
    private _endDepth = 0;
    /** meters per sec */
    private speed = 0;

    private action: SwimAction = SwimAction.hover;

    private _gasName = '';

    public get gasName(): string {
        return this._gasName;
    }

    /**
     * @param duration in seconds
     * @param newDepth in meters
     * @param previousDepth in meters
     */
    private constructor(public duration: number, newDepth: number, previousDepth: number = 0) {
        this.endTime = Math.round(duration * 100) / 100;
        this._endDepth = newDepth;
        this._startDepth = previousDepth;
        this.updateSwimAction();
    }

    public static fromSegment(segment: Segment): WayPoint {
        const newWayPoint = new WayPoint(segment.duration, segment.endDepth);
        const gasName = StandardGases.nameFor(segment.gas.fO2, segment.gas.fHe);
        newWayPoint._gasName = gasName;
        newWayPoint.speed = segment.speed;
        return newWayPoint;
    }

    public asGasSwitch(): void {
        this.action = SwimAction.switch;
    }

    /** in meters */
    public get startDepth(): number {
        return this._startDepth;
    }

    /** in meters */
    public get endDepth(): number {
        return this._endDepth;
    }

    /** in meters */
    public get averageDepth(): number {
        return (this.startDepth + this.endDepth) / 2;
    }

    public get swimAction(): SwimAction {
        return this.action;
    }

    public get label(): string {
        if (this.startDepth !== this.endDepth) {
            return '';
        }

        const depth = `${this.endDepth} m`;
        let durationText = Math.round(this.duration).toString();
        durationText += ' min.';
        return `${depth},${durationText}`;
    }

    public toLevel(segment: Segment): WayPoint {
        const result = WayPoint.fromSegment(segment);
        result.startTime = this.endTime;
        const end = this.endTime + segment.duration;
        result.endTime = Math.round(end * 100) / 100;
        result._startDepth = this.endDepth;
        result.updateSwimAction();
        return result;
    }

    public fits(timeStamp: number): boolean {
        return this.startTime <= timeStamp && timeStamp < this.endTime;
    }

    public depthAt(duration: number): number {
        return Segment.depthAt(this.startDepth, this.speed, duration);
    }

    private updateSwimAction(): void {
        this.action = SwimAction.hover;

        if (this.startDepth < this.endDepth) {
            this.action = SwimAction.descent;
        }

        if (this.startDepth > this.endDepth) {
            this.action = SwimAction.ascent;
        }
    }
}
