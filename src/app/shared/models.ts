import { DepthConverterService } from "./depth-converter.service";

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
        return this.startPressure - this.consumed;
    }

    public loadFrom(other: Gas): void {
        this.startPressure = other.startPressure;
        this.size = other.size;
        this.o2 = other.o2;
    }
}

export class Diver {
    // meter/min.
    public static readonly descSpeed = 20;
    public static readonly ascSpeed = 10;

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
    constructor(public duration: number, public depth: number, public strategy: Strategies) {
    }

    public get availablePressureRatio(): number {
        return this.strategy === Strategies.THIRD ? 2 / 3 : 1;
    }

    public get needsReturn(): boolean {
        return this.strategy !== Strategies.ALL;
    }

    public get needsSafetyStop(): boolean {
        return this.depth >= SafetyStop.mandatoryDepth;
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
    public rockBottom = 0;
    public timeToSurface = 0;
    public turnPressure = 0;
    public turnTime = 0;
    public needsReturn = false;
    public notEnoughGas = false;
    public depthExceeded = false;
    public notEnoughTime = false;
    public wayPoints: WayPoint[] = [];

    public get totalDuration(): number{
        return this.wayPoints[this.wayPoints.length - 1].endTime;
    }

    public get maxDepth(): number {
        return this.bottom.startDepth;
    }

    public get descent(): WayPoint {
        return this.wayPoints[0];
    }

    public get bottom(): WayPoint {
        // for single level dives second is always depth
        return this.wayPoints[1];
    }

    public get ascent(): WayPoint[] {
        // first two are descent and bottom
        return this.wayPoints.slice(2, this.wayPoints.length);
    }

    public get hasErrors(): boolean {
        return this.calculated && (this.notEnoughGas || this.depthExceeded || this.notEnoughTime);
    }
}

export class WayPoint {
    public startTime = 0;
    public startDepth = 0;
    public endTime = 0;
    public endDepth = 0;

    constructor(public duration: number, newDepth: number, previousDepth: number = 0) {
        this.endTime = Math.round(duration);
        this.endDepth = newDepth;
        this.startDepth = previousDepth;
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
        return DepthConverterService.toAtm(averageDepth);
    }

    public toLevel(duration: number, newDepth: number): WayPoint {
        const result = new WayPoint(duration, newDepth);
        result.startTime = this.endTime;
        result.endTime = this.endTime + Math.round(duration);
        result.startDepth = this.endDepth;
        return result;
    }
}

export class SafetyStop {
    public static readonly depth = 5;
    public static readonly duration = 3;
    public static readonly mandatoryDepth = 20;
}
