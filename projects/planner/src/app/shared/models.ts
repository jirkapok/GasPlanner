import {
    Ceiling, Time, Event, Segment,
    StandardGases, Tank, OtuCalculator,
    Precision
} from 'scuba-physics';
import { UnitConversion } from './UnitConversion';

export enum Strategies {
    ALL = 1,
    HALF = 2,
    THIRD = 3
}

export class Level {
    constructor(
        private units: UnitConversion,
        public segment: Segment,
        private tankBound: TankBound
    ) {
    }

    public get duration(): number {
        return Time.toMinutes(this.segment.duration);
    }

    public get startDepth(): number {
        const depth = this.segment.startDepth;
        return this.units.fromMeters(depth);
    }

    public get endDepth(): number {
        const depth = this.segment.endDepth;
        return this.units.fromMeters(depth);
    }

    public get tank(): TankBound {
        return this.tankBound;
    }

    public get tankLabel(): string {
        return this.tank.label;
    }

    /** in minutes */
    public set duration(newValue: number) {
        this.segment.duration = Time.toSeconds(newValue);
    }

    public set endDepth(newValue: number) {
        const meters = this.units.toMeters(newValue);
        this.segment.endDepth = meters;
    }

    public set tank(newValue: TankBound) {
        this.segment.tank = newValue.tank;
        this.tankBound = newValue;
    }
}

export class TankBound {
    private _workingPressure: number;

    constructor(public tank: Tank, private units: UnitConversion) {
        const newWorkPressure = this.units.defaults.primaryTankWorkPressure;
        this._workingPressure = this.units.toBar(newWorkPressure);
    }

    public get id(): number {
        return this.tank.id;
    }

    public get size(): number {
        return this.units.fromTankLiters(this.tank.size, this._workingPressure);
    }

    public get startPressure(): number {
        return this.units.fromBar(this.tank.startPressure);
    }

    public get workingPressure(): number {
        return this.units.fromBar(this._workingPressure);
    }

    public get workingPressureBars(): number {
        return this._workingPressure;
    }

    public get o2(): number {
        return this.tank.o2;
    }

    public get he(): number {
        return this.tank.he;
    }

    public get label(): string {
        let volume = this.units.fromTankLiters(this.tank.size, this._workingPressure);
        volume = Precision.round(volume, 1);
        let startPressure = this.units.fromBar(this.tank.startPressure);
        startPressure = Precision.round(startPressure, 1);
        return `${this.tank.id}. ${this.tank.name}/${volume}/${startPressure}`;
    }

    public set id(newValue: number) {
        this.tank.id = newValue;
    }

    public set size(newValue: number) {
        this.tank.size = this.units.toTankLiters(newValue, this._workingPressure);
    }

    public set startPressure(newValue: number) {
        this.tank.startPressure = this.units.toBar(newValue);
    }

    public set workingPressure(newValue: number) {
        const sizeBackup = this.size;
        this._workingPressure = this.units.toBar(newValue);
        this.size = sizeBackup;
    }

    /** For serialization purpose only */
    public set workingPressureBars(newValue: number) {
        const sizeBackup = this.size;
        this._workingPressure = newValue;
        this.size = sizeBackup;
    }

    public set o2(newValue: number) {
        this.tank.o2 = newValue;
    }

    public set he(newValue: number) {
        this.tank.he = newValue;
    }
}


export class Dive {
    public calculated = false;
    public diveInfoCalculated = false;
    public profileCalculated = false;
    public calculationFailed = false;
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
    // TODO add event in case otu and CNS reached 80% of single exposure limits
    public otu = 0;
    public cns = 0;
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

    /** the only errors preventing draw chart */
    public get hasErrors(): boolean {
        return this.calculated && (this.calculationFailed || this.notEnoughTime);
    }

    public get showResults(): boolean {
        return this.calculated && !this.hasErrors;
    }

    public get otuExceeded(): boolean {
        return this.otu > (.8 * OtuCalculator.dailyLimit);
    }

    public get cnsExeeded(): boolean {
        return this.cns > 0.8;
    }

    public get showMaxDuration(): boolean {
        return this.calculated && this.maxTime > 0;
    }

    public emptyProfile(): void {
        this.wayPoints = [];
        this.ceilings = [];
        this.events = [];
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

    /**
     * @param duration in seconds
     * @param newDepth in meters
     * @param previousDepth in meters
     */
    private constructor(private units: UnitConversion, public duration: number, newDepth: number, previousDepth: number = 0) {
        this.endTime = Precision.roundTwoDecimals(duration);
        this._endDepth = newDepth;
        this._startDepth = previousDepth;
        this.updateSwimAction();
    }

    public get gasName(): string {
        return this._gasName;
    }

    /** in respective units */
    public get startDepth(): number {
        return this.units.fromMeters(this._startDepth);
    }

    /** in meters */
    public get startDepthMeters(): number {
        return this._startDepth;
    }

    /** in respective units */
    public get endDepth(): number {
        return this.units.fromMeters(this._endDepth);
    }

    /** in meters */
    public get endDepthMeters(): number {
        return this._endDepth;
    }

    public get swimAction(): SwimAction {
        return this.action;
    }

    public static fromSegment(units: UnitConversion, segment: Segment): WayPoint {
        const newWayPoint = new WayPoint(units, segment.duration, segment.endDepth);
        const gasName = StandardGases.nameFor(segment.gas.fO2, segment.gas.fHe);
        newWayPoint._gasName = gasName;
        newWayPoint.speed = segment.speed;
        return newWayPoint;
    }

    public asGasSwitch(): void {
        this.action = SwimAction.switch;
    }

    public toLevel(segment: Segment): WayPoint {
        const result = WayPoint.fromSegment(this.units, segment);
        result.startTime = this.endTime;
        const end = this.endTime + segment.duration;
        result.endTime = Precision.roundTwoDecimals(end);
        result._startDepth = this._endDepth;
        result.updateSwimAction();
        return result;
    }

    public fits(timeStamp: number): boolean {
        return this.startTime <= timeStamp && timeStamp < this.endTime;
    }

    public depthAt(duration: number): number {
        return Segment.depthAt(this._startDepth, this.speed, duration);
    }

    private updateSwimAction(): void {
        this.action = SwimAction.hover;

        if (this._startDepth < this._endDepth) {
            this.action = SwimAction.descent;
        }

        if (this._startDepth > this._endDepth) {
            this.action = SwimAction.ascent;
        }
    }
}
