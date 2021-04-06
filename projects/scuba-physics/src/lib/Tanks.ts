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

    /**
     * Returns true, if remaining gas is greater or equal to reserve; otherwise false.
     * See also Consumption.haveReserve()
     */
    public get hasReserve(): boolean {
        return this.endPressure >= this.reserve;
    }

    public loadFrom(other: Tank): void {
        this.startPressure = other.startPressure;
        this.size = other.size;
        this.o2 = other.o2;
    }

    private isInAirRange(newO2: number): boolean {
        return 20.9 <= newO2 && newO2 <= 21 && this.gas.fHe === 0;
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
    /** we know the profile uses one depth level => 2 user segments */
    private static readonly userNoDecoSegments = 2;

    constructor(private depthConverter: DepthConverter) { }

    /**
     * Checks, if all tanks have more remaining gas than their reserve.
     * See also Tank.hasReserve
     */
    public static haveReserve(tanks: Tank[]): boolean {
        let result = true;

        tanks.forEach((tank: Tank) => {
            if(!tank.hasReserve) {
                result = false;
            }
        });

        return result;
    }

    private static calculateDecompression(planedDepth: number, duration: number, tanks: Tank[], options: Options): CalculatedProfile {
        const bGases = new Gases();
        const firstTank = tanks[0];
        const bGas = firstTank.gas;
        bGases.addBottomGas(bGas);

        // everything except first gas is considered as deco gas
        tanks.slice(1, tanks.length).forEach((gas) => {
            const decoGas = gas.gas;
            bGases.addDecoGas(decoGas);
        });

        const segments: Segments = SegmentsFactory.createForPlan(planedDepth, duration, firstTank, options);
        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, bGases, segments);
        return profile;
    }

    /**
     * We cant provide this method for multilevel dives, because we don't know which segment to extend
     * @param plannedDepth Maximum depth reached during the dive
     * @param tanks The tanks used during the dive to check available gases
     * @param diver Consumption SAC definition
     * @param options ppO2 definitions needed to estimate ascent profile
     * @param noDecoTime Known no decompression time in minutes for required depth
     * @returns Number of minutes representing maximum time we can spend as bottom time.
     */
    public calculateMaxBottomTime(plannedDepth: number, tanks: Tank[], diver: Diver, options: Options, noDecoTime: number): number {
        Tank.resetConsumption(tanks);
        const recreDuration = this.nodecoProfileBottomTime(plannedDepth, tanks, diver, options);

        if (recreDuration > noDecoTime) {
            return this.estimateMaxDecotime(plannedDepth, tanks, options, diver, noDecoTime);
        }

        return Math.floor(recreDuration);
    }

    private nodecoProfileBottomTime(plannedDepth: number, tanks: Tank[], diver: Diver, options: Options): number {
        const descentDuration = SegmentsFactory.descentDuration(plannedDepth, options);
        const duration = Time.toMinutes(descentDuration); // to enforce swim (2.) segment to zero seconds duration.
        const profile = Consumption.calculateDecompression(plannedDepth, duration, tanks, options);
        const segments = profile.segments;
        this.consumeFromTanks(segments, Consumption.userNoDecoSegments, tanks, diver); // updates all tanks including reserve
        const firstTank = tanks[0];
        const remaining = firstTank.endPressure - firstTank.reserve;

        if (remaining > 0) {
            // TODO multilevel dive: take the deepest segment and use its tank to prolong the duration
            const bottomSegment = ConsumptionSegment.fromSegment(segments[1]);
            bottomSegment.duration = Time.oneMinute;
            const bottomConsumption = this.consumedFromTank(bottomSegment, firstTank, diver.sac);
            const swimDuration = remaining / bottomConsumption;
            const recreDuration = duration + swimDuration;
            return recreDuration;
        }

        return descentDuration;
    }

    /**
     * We need to repeat the calculation by increasing duration, until there is enough gas
     * because increase of duration means also change in the ascent plan.
     * This method is performance hit, since it needs to calculate the profile.
     */
    private estimateMaxDecotime(plannedDepth: number, tanks: Tank[], options: Options, diver: Diver, noDecoTime: number): number {
        let duration = noDecoTime;

        while (Consumption.haveReserve(tanks)) {
            duration++;
            const profile = Consumption.calculateDecompression(plannedDepth, duration, tanks, options);
            this.consumeFromTanks(profile.segments, Consumption.userNoDecoSegments, tanks, diver);
        }

        return duration - 1; // we already passed the way
    }

    /**
     * Updates tanks consumption based on segments
     * @param segments Profile generated by algorithm including user defined + generated ascent,
     *                 the array needs have at least 3 items (descent, swim, ascent).
     * @param userSegments The number of segments from the profile defined by user, the rest is counted as calculated ascent.
     * @param tanks: All tanks used to generate the profile, their gases need to fit all used in segments param
     * @param sac diver surface air consumption in Liters/minute.
     */
    public consumeFromTanks(segments: Segment[], userSegments: number, tanks: Tank[], diver: Diver): void {
        if (segments.length < 3) {
            throw new Error('Profile needs to contain at least three segments.');
        }

        Tank.resetConsumption(tanks);
        this.updateConsumption(segments, tanks, diver.sac);
        const ascent = SegmentsFactory.ascent(segments, userSegments);
        this.updateReserve(ascent, tanks, diver.stressSac);
    }

    private updateReserve(ascent: Segment[], tanks: Tank[], stressSac: number): void {
        const segments = ascent.slice();
        this.addSolvingSegment(segments);

        // here the consumed during emergency ascent means reserve
        const gasesConsumed: Map<number, number> = this.consumedByGases(segments, stressSac);

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

    private consumedFromTank(segment: ConsumptionSegment, tank: Tank, sac: number): number {
        const sacSeconds = Time.toMinutes(sac);
        const liters = this.consumedBySegment(segment, sacSeconds);
        const bars = liters / tank.size;
        return bars;
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

