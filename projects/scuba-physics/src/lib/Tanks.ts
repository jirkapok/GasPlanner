import { BuhlmannAlgorithm, Options } from './BuhlmannAlgorithm';
import { DepthConverter } from './depth-converter';
import { Diver } from './Diver';
import { Gas, Gases, StandardGases } from './Gases';
import { CalculatedProfile } from './Profile';
import { Segment, Segments, SegmentsFactory } from './Segments';
import { Time } from './Time';

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

    public static createDefault(): Tank {
        return new Tank(15, 200, StandardGases.o2InAir * 100);
    }

    public static resetConsumption(tanks: Tank[]): void {
        tanks.forEach(tank => {
            tank.consumed = 0;
            tank.reserve = 0;
        });
    }

    public get gas(): Gas {
        return this._gas;
    }

    /** o2 content in percent adjusted to iterate to Air*/
    public get o2(): number {
        const current = this._gas.fO2 * 100;

        if (this.isInAirRange(current)) {
            return Math.round(this.gas.fO2 * 100);
        }

        return current;
    }

    /** o2 content in percent adjusted to iterate to Air*/
    public set o2(newValue: number) {
        if (this.isInAirRange(newValue)) {
            this.gas.fO2 = StandardGases.o2InAir;
        } else {
            this._gas.fO2 = newValue / 100;
        }
    }

    public get volume(): number {
        return this.size * this.startPressure;
    }

    public get name(): string {
        return StandardGases.nameFor(this._gas.fO2);
    }

    public assignStandardGas(standard: string): void {
        const found = StandardGases.byName(standard);

        if (!found) {
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

    private isInAirRange(newO2: number): boolean {
        return 20.9 <= newO2 && newO2 <= 21 && this.gas.fHe === 0;
    }

    public get hasEnoughGas(): boolean {
        return this.endPressure >= this.reserve;
    }
}

class ConsumptionSegment {
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

    public static fromSegment(segment: Segment): ConsumptionSegment {
        return new ConsumptionSegment(segment.duration, segment.endDepth, segment.startDepth);
    }

    public static fromSegments(segments: Segment[]): ConsumptionSegment[] {
        const converted: ConsumptionSegment[] = [];

        segments.forEach((segment) => {
            const convertedSegment = ConsumptionSegment.fromSegment(segment);
            converted.push(convertedSegment);
        });

        return converted;
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

    private static calculateDecompression(planedDepth: number, duration: number, tanks: Tank[], options: Options): CalculatedProfile {
        const bGases = new Gases();
        const bGas = tanks[0].gas;
        bGases.addBottomGas(bGas);

        // everything except first gas is considered as deco gas
        tanks.slice(1, tanks.length).forEach((gas) => {
            const decoGas = gas.gas;
            bGases.addDecoGas(decoGas);
        });

        const segments: Segments = SegmentsFactory.createForPlan(planedDepth, duration, bGas, options);
        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, bGases, segments);
        return profile;
    }

    /**
     * We cant provide this method for multilevel dives, because we don't know which segment to extend
     * @param plannedDepth Maximum depth reached during the dive
     * @param tank The tank used during the dive to check available gas
     * @param diver Consumption SAC definition
     * @param options ppO2 definitions needed to estimate ascent profile
     * @param noDecoTime Known no decompression time for required depth to be able optimize the algorithm
     * @returns Number of minutes representing maximum time we can spend as bottom time.
     */
    public calculateMaxBottomTime(plannedDepth: number, tank: Tank, diver: Diver, options: Options, noDecoTime: number): number {
        const recreDuration = this.nodecoProfileBottomTime(plannedDepth, tank, diver, options);
        const noDecoSeconds = Time.toSeconds(noDecoTime);

        if (recreDuration > noDecoSeconds) {
            return this.estimateMaxDecotime(plannedDepth, tank, options, diver, noDecoTime);
        }

        const minutes = Time.toMinutes(recreDuration);
        return Math.floor(minutes);
    }

    private nodecoProfileBottomTime(plannedDepth: number, tank: Tank, diver: Diver, options: Options): number {
        const template = SegmentsFactory.buildNoDecoProfile(plannedDepth, tank.gas, options);
        const recreProfile = ConsumptionSegment.fromSegments(template);
        const ascent = SegmentsFactory.ascent(template);
        const rockBottom = this.calculateRockBottom(ascent, tank, diver);
        const consumed = this.consumedFromTank(recreProfile, tank, diver.sac);
        const remaining = tank.startPressure - consumed - rockBottom;

        if (remaining > 0) {
            const bottomSegments = [recreProfile[1]];
            const bottomConumption = this.consumedFromTank(bottomSegments, tank, diver.sac);
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
            const segments = ConsumptionSegment.fromSegments(profile.segments);
            const ascent = SegmentsFactory.ascent(profile.segments);
            rockBottom = this.calculateRockBottom(ascent, tank, diver);
            consumed = this.consumedFromTank(segments, tank, diver.sac);
        }

        return duration - 1; // we already passed the way
    }

    private hasEnoughGas(tank: Tank, consumed: number, rockBottom: number): boolean {
        return tank.startPressure - consumed >= rockBottom;
    }

    private calculateRockBottom(ascent: Segment[], tank: Tank, diver: Diver): number {
        const conSegments = ConsumptionSegment.fromSegments(ascent);
        this.addSolvingPressureSegment(conSegments);
        const stressSac = diver.stressSac;
        const result = this.consumedFromTank(conSegments, tank, stressSac);
        return result > Consumption.minimumRockBottom ? result : Consumption.minimumRockBottom;
    }

    private addSolvingPressureSegment(ascent: ConsumptionSegment[]): void {
        const solvingDuration = 2 * Time.oneMinute;
        const ascentDepth = ascent[0].startDepth;
        const problemSolving = new ConsumptionSegment(solvingDuration, ascentDepth, ascentDepth);
        ascent.unshift(problemSolving);
    }

    /**
     * Updates tanks consumption based on segments
     * @param segments Profile generated by algorithm including user defined + generated ascent,
     *                 the array needs have at least 3 items (descent, swim, ascent).
     * @param tanks: All tanks used to generate the profile, their gases need to fit all used in segments param
     * @param sac diver surface air consumption in Liters/minute.
     */
    public consumeFromTanks(segments: Segment[], tanks: Tank[], diver: Diver): void {
        if (segments.length < 3) {
            throw new Error('Profile needs to contain at least three segments.');
        }

        Tank.resetConsumption(tanks);
        this.updateConsumption(segments, tanks, diver.sac);
        const ascent = SegmentsFactory.ascent(segments);
        this.updateReserve(ascent, tanks, diver.stressSac);
    }

    private updateReserve(ascent: Segment[], tanks: Tank[], stressSac: number): void {
        const segments = ascent.slice();
        this.addSolvingSegment(segments);

        // here the consumed during emergency ascent means reserve
        const gasesConsumed: Map<number, number> = this.consumedByGases(segments, stressSac);
        // console.log(gasesConsumed);

        // add the reserve from opposite order than consumed gas
        for (let index = 0 ; index <= tanks.length - 1; index++) {
            const tank = tanks[index];
            const gasCode = this.gasCode(tank.gas);
            let consumedLiters = gasesConsumed.get(gasCode) || 0;
            consumedLiters = this.addReserveToTank(tank, consumedLiters);
            gasesConsumed.set(gasCode, consumedLiters);
        }

        // Add minimum reserve to first tank only as back gas? This doesn't look nice for side mount.
        if(tanks[0].reserve < Consumption.minimumRockBottom) {
            tanks[0].reserve = Consumption.minimumRockBottom;
        }
    }

    private addReserveToTank(tank: Tank, consumedLiters: number): number {
        const consumedBars =  Math.ceil(consumedLiters / tank.size);
        const tankConsumedBars = (consumedBars + tank.reserve) > tank.startPressure ? tank.startPressure - tank.reserve : consumedBars;
        tank.reserve += tankConsumedBars;
        return this.updateConsumedLiters(consumedLiters, tankConsumedBars, tank.size);
    }

    private addSolvingSegment(ascent: Segment[]): void {
        const solvingDuration = 2 * Time.oneMinute;
        const ascentDepth = ascent[0].startDepth;
        const problemSolving = new Segment(ascentDepth, ascentDepth, ascent[0].gas, solvingDuration);
        ascent.unshift(problemSolving);
    }

    private updateConsumption(segments: Segment[], tanks: Tank[], sac: number): void {
        const gasesConsumed: Map<number, number> = this.consumedByGases(segments, sac);

        // distribute the consumed liters across all tanks with that gas starting from last one
        // to consumed stages first. This simulates one of the back mounted system procedures.
        for (let index = tanks.length - 1; index >= 0; index--) {
            const tank = tanks[index];
            const gasCode = this.gasCode(tank.gas);
            let consumedLiters = gasesConsumed.get(gasCode) || 0;
            consumedLiters = this.consumeFromTank(tank, consumedLiters);
            gasesConsumed.set(gasCode, consumedLiters);
        }
    }

    private consumeFromTank(tank: Tank, consumedLiters: number): number {
        const consumedBars =  Math.ceil(consumedLiters / tank.size);
        const tankConsumedBars = consumedBars > tank.endPressure ? tank.endPressure : consumedBars;
        tank.consumed += tankConsumedBars;
        return this.updateConsumedLiters(consumedLiters, tankConsumedBars, tank.size);
    }

    private updateConsumedLiters(consumedLiters: number, tankConsumedBars: number, tankSize: number): number {
        consumedLiters = consumedLiters - (tankConsumedBars * tankSize);
        // because of previous rounding up the consumed bars
        consumedLiters = consumedLiters < 0 ? 0 : consumedLiters;
        return consumedLiters;
    }

    private consumedByGases(segments: Segment[], sac: number): Map<number, number> {
        const sacSeconds = Time.toMinutes(sac);
        const gasesConsumed = new Map<number, number>();

        segments.forEach((segment: Segment)  => {
            const gas = segment.gas;
            const gasCode = this.gasCode(gas);
            const converted = ConsumptionSegment.fromSegment(segment);
            const consumedLiters = this.consumedBySegment(converted, sacSeconds);
            let consumedByGas: number = gasesConsumed.get(gasCode) || 0;
            consumedByGas += consumedLiters;
            gasesConsumed.set(gasCode, consumedByGas);
        });

        return gasesConsumed;
    }

    private gasCode(gas: Gas): number {
        const fourK = 10000;
        // considered identical gas rounding on two decimal places
        return Math.round(gas.fO2 * fourK) * fourK + Math.round(gas.fHe * fourK);
    }

    private consumedFromTank(segments: ConsumptionSegment[], tank: Tank, sac: number): number {
        const liters = this.consumed(segments, sac);
        const bars = liters / tank.size;
        return Math.ceil(bars);
    }

    /** Returns consumed amount in liters, given all segments for the same gas */
    private consumed(segments: ConsumptionSegment[], sac: number): number {
        let liters = 0;
        const sacSeconds = Time.toMinutes(sac);

        for (const segment of segments) {
            const toAdd = this.consumedBySegment(segment, sacSeconds);
            liters += toAdd;
        }

        return liters;
    }

    /**
     * Returns consumption in Liters at given segment average depth
     * @param sacSeconds Liter/second
     */
    private consumedBySegment(segment: ConsumptionSegment, sacSeconds: number) {
        const averagePressure = this.depthConverter.toBar(segment.averageDepth);
        const consumed = segment.duration * averagePressure * sacSeconds;
        return consumed;
    }
}

