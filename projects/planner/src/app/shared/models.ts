import { DepthConverter, Gas as BGas, Ceiling, Time, Event } from 'scuba-physics';

export enum StandardGas {
    Air = 21,
    EAN32 = 32,
    EAN36 = 36,
    EAN38 = 38,
    EAN50 = 50,
    OXYGEN = 100
}

export class Gases {
    public static gasNames(): string[] {
        return Object.keys(StandardGas)
            .filter(k => typeof StandardGas[k] === 'number') as string[];
    }
}

export class Gas {
    public consumed = 0;
    public reserve = 0;

    /**
     * Creates new instance of the Gas.
     *
     * @param size Volume in liters
     * @param o2 Percents of oxygen e.g. 20%
     * @param startPressure Filled in bars of gas
     */
    constructor(public size: number,
        public o2: number,
        public startPressure: number) {
    }

    public get volume(): number {
        return this.size * this.startPressure;
    }

    public get name(): string {
        const fromEnum = StandardGas[this.o2];
        if (fromEnum) {
            return fromEnum;
        }

        if (this.o2) {
            return 'EAN' + this.o2.toString();
        }

        return '';
    }

    public assignStandardGas(standard: string): void {
        this.o2 = StandardGas[standard];
    }

    public get endPressure(): number {
        const remaining = this.startPressure - this.consumed;

        if (remaining > 0) {
            return remaining;
        }

        return 0;
    }

    public get percentsRemaining(): number {
        return this.endPressure / this.startPressure * 100;
    }

    public get percentsReserve(): number {
        const result = this.reserve / this.startPressure * 100;

        if (result > 100) {
            return 100;
        }

        return result;
    }

    public get hasReserve(): boolean {
        return this.endPressure - this.reserve > 0;
    }

    public loadFrom(other: Gas): void {
        this.startPressure = other.startPressure;
        this.size = other.size;
        this.o2 = other.o2;
    }

    toGas(): BGas {
        return new BGas(this.o2 / 100, 0);
    }
}

export class Diver {
    /** default descent speed value in meter/min. */
    public static readonly descSpeed = 20;
    /** default ascent speed value in meter/min. */
    public static readonly ascSpeed = 10;

    /** Maximum ppO2 during decompression */
    public maxDecoPpO2 = 1.6;

    constructor(public sac: number, public maxPpO2: number) {
    }

    public get stressSac(): number {
        return this.sac * 3;
    }

    public static gasSac(sac: number, gasSize: number): number {
        return sac / gasSize;
    }

    public gasSac(gas: Gas): number {
        return Diver.gasSac(this.sac, gas.size);
    }

    public loadFrom(other: Diver): void {
        this.sac = other.sac;
    }
}

export enum Strategies {
    ALL = 1,
    HALF = 2,
    THIRD = 3
}

export class Plan {
    public noDecoTime: number;

    constructor(public duration: number, public depth: number, public strategy: Strategies) {
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

    public loadFrom(other: Plan): void {
        this.depth = other.depth;
        this.duration = other.duration;
        this.strategy = other.strategy;
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
    public depthExceeded = false;
    public notEnoughTime = false;
    public noDecoExceeded = false;
    public wayPoints: WayPoint[] = [];
    public ceilings: Ceiling[];
    public events: Event[];

    public get totalDuration(): number {
        return this.wayPoints[this.wayPoints.length - 1].endTime;
    }

    public get maxDepth(): number {
        const bottom = this.wayPoints[1]; // for single level dives second is always depth
        return bottom.startDepth;
    }

    // expecting single level dive
    public get descent(): WayPoint {
        return this.wayPoints[0];
    }

    public get hasErrors(): boolean {
        // the only errors preventing draw chart
        return this.calculated && (this.depthExceeded || this.notEnoughTime);
    }

    public get hasHoursRuntime(): boolean {
       const duration = Time.toDate(this.totalDuration);
       const hasHours = duration.getHours() > 0;
       return hasHours;
    }
}

export enum SwimAction {
    hover = 0,
    ascent = 1,
    descent = 2,
    switch = 3
}

export class WayPoint {
    /** in minutes */
    public startTime = 0;
    /** in minutes */
    public endTime = 0;
    /** in meters */
    private _startDepth = 0;
    /** in meters */
    public _endDepth = 0;

    private action: SwimAction;

    constructor(public duration: number, newDepth: number, previousDepth: number = 0) {
        this.endTime = Math.round(duration * 100) / 100;
        this._endDepth = newDepth;
        this._startDepth = previousDepth;
        this.updateAction();
    }

    private updateAction(): void {
        this.action = SwimAction.hover;

        if (this.startDepth < this.endDepth) {
            this.action = SwimAction.descent;
        }

        if (this.startDepth > this.endDepth) {
            this.action = SwimAction.ascent;
        }
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

    public get swimAction(): SwimAction {
        return this.action;
    }

    public get label(): string {
        if (this.startDepth !== this.endDepth) {
            return '';
        }

        const depth = this.endDepth + ' m';
        const durationText = Math.round(this.duration) + ' min.';
        return depth + ',' + durationText;
    }

    public get averagePressure(): number {
        const averageDepth = (this.startDepth + this.endDepth) / 2;
        return DepthConverter.forFreshWater().toBar(averageDepth);
    }

    public toLevel(duration: number, newDepth: number): WayPoint {
        const result = new WayPoint(duration, newDepth);
        result.startTime = this.endTime;
        const end = this.endTime + duration;
        result.endTime = Math.round(end * 100) / 100;
        result._startDepth = this.endDepth;
        result.updateAction();
        return result;
    }
}
