import { BuhlmannAlgorithm, Options } from "./BuhlmannAlgorithm";
import { DepthConverter } from "./depth-converter";
import { Diver } from "./Diver";
import { Gas, Gases, StandardGases } from "./Gases";
import { CalculatedProfile } from "./Profile";
import { Segment, Segments, SegmentsFactory } from "./Segments";
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

    public calculateMaxBottomTime(plannedDepth: number, tank: Tank, diver: Diver, options: Options, noDecoTime: number): number {
        const recreDuration = this.nodecoProfileBottomTime(plannedDepth, tank, diver, options);
        const noDecoSeconds = Time.toSeconds(noDecoTime);
    
        if(recreDuration > noDecoSeconds) {
           return this.estimateMaxDecotime(plannedDepth, tank, options, diver, noDecoTime);
        }
    
        const minutes = Time.toMinutes(recreDuration);
        return Math.floor(minutes);
      }

    private nodecoProfileBottomTime(plannedDepth: number, tank: Tank, diver: Diver, options: Options): number {
        const template = SegmentsFactory.buildNoDecoProfile(plannedDepth, tank.gas, options);
        const recreProfile = Consumption.toSegments(template);
        let ascent = Consumption.ascent(template);
        let rockBottom = this.calculateRockBottom(ascent, tank, diver);
        let consumed = this.consumed(recreProfile, tank, diver.sac);
        const remaining = tank.startPressure - consumed - rockBottom;

        if (remaining > 0) {
            const sacSeconds = Time.toMinutes(diver.sac);
            const bottomConumption = this.segmentConsumptionPerSecond(recreProfile[1], tank, sacSeconds);
            const swimDuration = remaining / bottomConumption;
            const recreDuration = recreProfile[0].duration + swimDuration;
            return recreDuration;
        }

        return recreProfile[0].duration; // descent only
    }

    /**
     * We need to repeat the calculation by increasing duration, until there is enough gas
     * because increase of duration means also change in the ascent plan.
     * This method is performance hit, since it needs to calculate the profile.
     */
    private estimateMaxDecotime(plannedDepth: number, tank: Tank, options: Options, diver: Diver, noDecoTime: number): number {
        let duration = noDecoTime;
        let consumed = 0;
        let rockBottom = 0;

        while (this.hasEnoughGas(tank, consumed, rockBottom)) {
            duration++;
            const profile = Consumption.calculateDecompression(plannedDepth, duration, [tank], options);
            const segments = Consumption.toSegments(profile.segments);
            const ascent = Consumption.ascent(profile.segments);
            rockBottom = this.calculateRockBottom(ascent, tank, diver);
            consumed = this.consumed(segments, tank, diver.sac);
        }

        return duration - 1; // we already passed the way
    }

    private static toSegments(segments: Segment[]): ConsumptionSegment[] {
        const converted: ConsumptionSegment[] = [];

        segments.forEach((segment, index, source) => {
            const convertedSegment = new ConsumptionSegment(segment.duration, segment.endDepth, segment.startDepth);
            converted.push(convertedSegment);
        });

        return converted;
    }

    private static calculateDecompression(planedDepth: number, duration: number, tanks: Tank[], options: Options): CalculatedProfile {
        const bGases = new Gases();
        const bGas = tanks[0].gas;
        bGases.addBottomGas(bGas);

        // everything except first gas is considered as deco gas
        tanks.slice(1, tanks.length).forEach((gas, index, items) => {
            const decoGas = gas.gas;
            bGases.addDecoGas(decoGas);
        });

        const segments: Segments = SegmentsFactory.createForPlan(planedDepth, duration, bGas, options)
        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, bGases, segments);
        return profile;
    }
    
    // TODO multilevel diving
    public static ascent(segments: Segment[]): Segment[] {
        // first two are descent and bottom
        return segments.slice(2, segments.length);
    }

    private hasEnoughGas(tank: Tank, consumed: number, rockBottom: number): boolean {
        return tank.startPressure - consumed >= rockBottom;
    }

    public calculateRockBottom(ascent: Segment[], tank: Tank, diver: Diver): number {
      const conSegments = Consumption.toSegments(ascent);
      return this.rockBottom(conSegments, tank, diver);
    }

    private rockBottom(ascent: ConsumptionSegment[], tank: Tank, diver: Diver): number {
        const solvingDuration = 2 * Time.oneMinute;
        const problemSolving = new ConsumptionSegment(solvingDuration, ascent[0].startDepth, ascent[0].startDepth);
        ascent.unshift(problemSolving);
        const stressSac = diver.stressSac;
        const result = this.consumed(ascent, tank, stressSac);
        
        return result > Consumption.minimumRockBottom ? result : Consumption.minimumRockBottom;
    }

    public consumedOnWay(segments: Segment[], tank: Tank, sac: number): number {
        const conSegments = Consumption.toSegments(segments);
        return this.consumed(conSegments, tank, sac);
    }

    private consumed(segments: ConsumptionSegment[], tank: Tank, sac: number): number {
        let result = 0;
        const sacSeconds = Time.toMinutes(sac);

        for (const wayPoint of segments) {
            result += wayPoint.duration * this.segmentConsumptionPerSecond(wayPoint, tank, sacSeconds);
        }

        const rounded = Math.ceil(result);
        return rounded;
    }

    /** bar/second */
    private segmentConsumptionPerSecond(segment: ConsumptionSegment, tank: Tank, sacSeconds: number): number {
        const averagePressure = this.depthConverter.toBar(segment.averageDepth);
        const consumed = averagePressure * Diver.gasSac(sacSeconds, tank.size);
        return consumed;
    }
}

