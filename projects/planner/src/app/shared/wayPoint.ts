import { UnitConversion } from './UnitConversion';
import { Precision, Segment, GasNames } from 'scuba-physics';

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
        const gasName = GasNames.nameFor(segment.gas.fO2, segment.gas.fHe);
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
