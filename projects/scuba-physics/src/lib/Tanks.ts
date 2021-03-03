import { DepthConverter } from "./depth-converter";
import { Diver } from "./Diver";
import { Gas, StandardGases } from "./Gases";
import { Time } from "./Time";

export class Tank {
    public consumed = 0;
    public reserve = 0;
    private _gas: Gas = StandardGases.air.copy();

    /**
     * Creates new instance of the Gas.
     *
     * @param size Volume in liters
     * @param o2Percent Percents of oxygen e.g. 20%
     * @param startPressure Filled in bars of gas
     */
    constructor(public size: number,
        public startPressure: number,
        o2Percent: number) {
        this.o2 = o2Percent;
    }

    public get gas(): Gas {
        return this._gas;
    }

    /** o2 content in percent */
    public get o2(): number {
        return this._gas.fO2 * 100;
    }

    /** o2 content in percent */
    public set o2(newValue) {
        this._gas.fO2 = newValue / 100;
    }

    public get volume(): number {
        return this.size * this.startPressure;
    }

    public get name(): string {
        return StandardGases.nameFor(this._gas.fO2);
    }

    public assignStandardGas(standard: string): void {
        const found = StandardGases.byName(standard);

        if(!found) {
            return;
        }

        this._gas.fO2 = found.fO2;
        this._gas.fHe = found.fHe;
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

    public loadFrom(other: Tank): void {
        this.startPressure = other.startPressure;
        this.size = other.size;
        this.o2 = other.o2;
    }
}

export class ConsumptionSegment {
    /** in seconds */
    public startTime = 0;
    /** in seconds */
    public endTime = 0;
    /** in meters */
    private _startDepth = 0;
    /** in meters */
    private _endDepth = 0;
    
    /**
     * @param duration in seconds
     * @param newDepth in meters
     * @param previousDepth in meters
     */
    constructor(public duration: number, newDepth: number, previousDepth: number = 0) {
        this.endTime = Math.round(duration * 100) / 100;
        this._endDepth = newDepth;
        this._startDepth = previousDepth;
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
}

/** 
 * Calculates tank consumptions during the dive and related variables
 * (e.g. rock bottom, turn pressure, turn time)
 */
export class Consumption {
    /** Minimum bars to keep in tank, even for shallow dives */
    public static readonly minimumRockBottom = 30;

    constructor(private depthConverter: DepthConverter) { }

    public calculateRockBottom(ascent: ConsumptionSegment[], tank: Tank, diver: Diver): number {
        const solvingDuration = 2 * Time.oneMinute;
        const problemSolving = new ConsumptionSegment(solvingDuration, ascent[0].startDepth, ascent[0].startDepth);
        ascent.unshift(problemSolving);
        const stressSac = diver.stressSac;
        const result = this.calculateConsumedOnWay(ascent, tank, stressSac);
        
        return result > Consumption.minimumRockBottom ? result : Consumption.minimumRockBottom;
    }

    private calculateConsumedOnWay(segment: ConsumptionSegment[], tank: Tank, sac: number): number {
        let result = 0;
        const sacSeconds = Time.toMinutes(sac);

        for (const wayPoint of segment) {
            result += wayPoint.duration * this.segmentConsumptionPerSecond(wayPoint, tank, sacSeconds);
        }

        const rounded = Math.ceil(result);
        return rounded;
    }

    /** bar/second */
    private segmentConsumptionPerSecond(wayPoint: ConsumptionSegment, tank: Tank, sacSeconds: number): number {
        const averagePressure = this.depthConverter.toBar(wayPoint.averageDepth);
        const consumed = averagePressure * Diver.gasSac(sacSeconds, tank.size);
        return consumed;
    }
}

