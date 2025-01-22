import { Precision } from './precision';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { DepthConverter } from './depth-converter';
import { Diver } from './Diver';
import { Gases } from './Gases';
import { Options } from './Options';
import { CalculatedProfile } from './CalculatedProfile';
import { Segment, Segments } from './Segments';
import { Tank, Tanks } from './Tanks';
import { Time } from './Time';
import { BinaryIntervalSearch, SearchContext } from './BinaryIntervalSearch';
import { PlanFactory } from './PlanFactory';
import { AlgorithmParams } from "./BuhlmannAlgorithmParameters";

class GasVolumes {
    private remaining: Map<number, number> = new Map<number, number>();

    public get(gasCode: number): number {
        return this.remaining.get(gasCode) || 0;
    }

    public set(gasCode: number, value: number): void {
        const newValue = value > 0 ? value : 0;
        this.remaining.set(gasCode, newValue);
    }
}

export interface ConsumptionOptions {
    diver: Diver;
    /** Minimum tank reserve for first tank in bars */
    primaryTankReserve: number;
    /** Minimum tank reserve for all other stage tanks in bars */
    stageTankReserve: number;
}

/**
 * Calculates tank consumptions during the dive and related variables
 * (e.g. rock bottom, turn pressure, turn time)
 */
export class Consumption {
    /** Minimum bars to keep in first tank, even for shallow dives */
    public static readonly defaultPrimaryReserve = 30;
    /** Minimum bars to keep in stage tank, even for shallow dives */
    public static readonly defaultStageReserve = 20;

    constructor(private depthConverter: DepthConverter) { }

    private static calculateDecompression(segments: Segments, tanks: Tank[], options: Options): CalculatedProfile {
        const bGases = Gases.fromTanks(tanks);

        const algorithm = new BuhlmannAlgorithm();
        const segmentsCopy = segments.copy();
        const parameters = AlgorithmParams.forMultilevelDive(segmentsCopy, bGases, options);
        const profile = algorithm.decompression(parameters);
        return profile;
    }

    /**
     * Updates tanks consumption based on segments, also calculates emergency profile using the decompression algorithm.
     * So it is time consuming => Performance hit.
     * @param segments Profile generated by algorithm including user defined + generated ascent,
     *                 the array needs have at least 3 items (descent, swim, ascent).
     * @param options Not null profile behavior options.
     * @param tanks All tanks used to generate the profile, their gases need to fit all used in segments param
     * @param consumptionOptions Not null definition how to consume the gases.
     */
    public consumeFromTanks(segments: Segment[], options: Options, tanks: Tank[], consumptionOptions: ConsumptionOptions): void {
        if (segments.length < 2) {
            throw new Error('Profile needs to contain at least 2 segments.');
        }

        const emergencyAscent = PlanFactory.emergencyAscent(segments, options, tanks);
        this.consumeFromTanks2(segments, emergencyAscent, tanks, consumptionOptions);
    }

    /**
     * Updates tanks consumption based on segments, uses already calculated emergency ascent.
     * So it is time consuming => Performance hit.
     * @param segments Profile generated by algorithm including user defined + generated ascent,
     *                 the array needs have at least 3 items (descent, swim, ascent).
     * @param emergencyAscent Not null array of segments representing the special ascent.
     *                 Doesn't have to be part of the segments parameter value, since in emergency we need current state.
     * @param tanks All tanks used to generate the profile, their gases need to fit all used in segments param
     * @param consumptionOptions Not null consumption definition.
     */
    public consumeFromTanks2(segments: Segment[], emergencyAscent: Segment[], tanks: Tank[], consumptionOptions: ConsumptionOptions): void {
        if (segments.length < 2) {
            throw new Error('Profile needs to contain at least 2 segments.');
        }

        Tanks.resetConsumption(tanks);
        // Reserve needs to be first to be able to preserve it.
        this.updateReserve(emergencyAscent, tanks, consumptionOptions);
        const tankMinimum = (t: Tank) => t.reserve;
        const rmv = consumptionOptions.diver.rmv;
        let remainToConsume: GasVolumes = this.toBeConsumedYet(segments, rmv, new GasVolumes(), (s) => !!s.tank);
        // First satisfy user defined segments where tank is assigned (also in ascent).
        // assigned tank will be consumed from that tank directly
        remainToConsume = this.consumeByTanks(segments, remainToConsume, rmv, tankMinimum);
        remainToConsume = this.consumeByTanksRemaining(segments, remainToConsume, () => 0);

        // and only now we can consume the remaining gas from all other segments
        remainToConsume = this.toBeConsumedYet(segments, rmv, remainToConsume, (s) => !s.tank);
        remainToConsume = this.consumeByGases(tanks, remainToConsume, tankMinimum);
        this.consumeByGases(tanks, remainToConsume, () => 0);
        this.roundTanksConsumedToBars(tanks);
    }

    /**
     * We cant provide this method for multilevel dives, because we don't know which segment to extend
     * @param sourceSegments User defined profile
     * @param tanks The tanks used during the dive to check available gases
     * @param consumptionOptions Not null consumption definition
     * @param options ppO2 definitions needed to estimate ascent profile
     * @returns Number of minutes representing maximum time we can spend as bottom time.
     * Returns 0 in case the duration is shorter than user defined segments.
     */
    public calculateMaxBottomTime(sourceSegments: Segments, tanks: Tank[],
        consumptionOptions: ConsumptionOptions, options: Options): number {
        const testSegments = this.createTestProfile(sourceSegments);
        const addedSegment = testSegments.last();

        const context: SearchContext = {
            // choosing the step based on typical dive duration
            estimationStep: Time.oneMinute * 40,
            initialValue: 0,
            maxValue: Time.oneDay,
            doWork: (newValue: number) => {
                addedSegment.duration = newValue;
                this.consumeFromProfile(testSegments, tanks, consumptionOptions, options);
            },
            meetsCondition: () => Tanks.haveReserve(tanks)
        };

        const interval = new BinaryIntervalSearch();
        const addedDuration = interval.search(context);

        // the estimated max. duration is shorter, than user defined segments
        if (addedDuration === 0) {
            return 0;
        }

        // Round down to minutes directly to ensure we are in range of enough value
        const totalDuration = Time.toMinutes(sourceSegments.duration + addedDuration);
        return Precision.floor(totalDuration);
    }

    private consumeFromProfile(testSegments: Segments, tanks: Tank[], consumptionOptions: ConsumptionOptions, options: Options) {
        const profile = Consumption.calculateDecompression(testSegments, tanks, options);
        this.consumeFromTanks(profile.segments, options, tanks, consumptionOptions);
    }

    private createTestProfile(sourceSegments: Segments): Segments {
        const testSegments = sourceSegments.copy();
        const lastUserSegment = sourceSegments.last();
        testSegments.addFlat(lastUserSegment.gas, 0);
        return testSegments;
    }

    private updateReserve(emergencyAscent: Segment[], tanks: Tank[], options: ConsumptionOptions): void {
        // here the consumed during emergency ascent means reserve
        // take all segments, because we expect all segments are not user defined => don't have tank assigned
        const gasesConsumed: GasVolumes = this.toBeConsumedYet(emergencyAscent, options.diver.teamStressRmv,
            new GasVolumes(), () => true);

        // add the reserve from opposite order than consumed gas
        for (let index = 0; index <= tanks.length - 1; index++) {
            const tank = tanks[index];
            const gasCode = tank.gas.contentCode;
            const consumedLiters = gasesConsumed.get(gasCode);
            this.updateTankReserve(tank, index, options, consumedLiters);
            const remaining = consumedLiters - (tank.reserve * tank.size);
            gasesConsumed.set(gasCode, remaining);
        }
    }

    private updateTankReserve(tank: Tank, index: number, options: ConsumptionOptions, consumedLiters: number): void {
        // here we update only once, so we can directly round up
        const consumedBars = Precision.ceil(consumedLiters / tank.size);
        const tankConsumedBars = consumedBars > tank.startPressure ? tank.startPressure : consumedBars;
        tank.reserve = this.ensureMinimalReserve(tankConsumedBars, index, options);
    }

    private ensureMinimalReserve(reserve: number, tankIndex: number, options: ConsumptionOptions): number {
        // maybe use the tank.id instead of index
        const minimalReserve = tankIndex === 0 ? options.primaryTankReserve : options.stageTankReserve;

        if(reserve < minimalReserve) {
            return minimalReserve;
        }

        return reserve;
    }

    private consumeByGases(tanks: Tank[], remainToConsume: GasVolumes, minimum: (t: Tank) => number): GasVolumes {
        // distribute the consumed liters across all tanks with that gas starting from last one
        // to consumed stages first. This simulates open circuit procedure: First consume, what you can drop.
        for (let index = tanks.length - 1; index >= 0; index--) {
            const tank = tanks[index];
            const gasCode = tank.gas.contentCode;
            let remaining = remainToConsume.get(gasCode);
            let reallyConsumed = this.consumeFromTank(tank, remaining, minimum);
            reallyConsumed = reallyConsumed < 0 ? 0 : reallyConsumed;
            remaining -= reallyConsumed;
            remainToConsume.set(gasCode, remaining);
        }

        return remainToConsume;
    }

    private consumeByTanks(segments: Segment[], remainToConsume: GasVolumes, rmv: number, minimum: (t: Tank) => number): GasVolumes {
        const rmvSeconds = Time.toMinutes(rmv);
        return this.consumeBySegmentTank(segments, remainToConsume, minimum, (s) => this.consumedBySegment(s, rmvSeconds));
    }

    private consumeByTanksRemaining(segments: Segment[], remainToConsume: GasVolumes, minimum: (t: Tank) => number): GasVolumes {
        return this.consumeBySegmentTank(segments, remainToConsume, minimum, (_: Segment, remaining: number) => remaining);
    }

    private consumeBySegmentTank(segments: Segment[], remainToConsume: GasVolumes,
        minimum: (t: Tank) => number,
        getConsumed: (s: Segment, remaining: number) => number): GasVolumes {
        segments.forEach((segment: Segment) => {
            if (segment.tank) {
                const gasCode = segment.gas.contentCode;
                let remaining: number = remainToConsume.get(gasCode);
                const consumeLiters = getConsumed(segment, remaining);
                let reallyConsumed = this.consumeFromTank(segment.tank, consumeLiters, minimum);
                reallyConsumed = reallyConsumed < 0 ? 0 : reallyConsumed;
                remaining -= reallyConsumed;
                remainToConsume.set(gasCode, remaining);
            }
        });

        return remainToConsume;
    }

    /** Requires already calculated reserve */
    private consumeFromTank(tank: Tank, consumedLiters: number, minimum: (t: Tank) => number): number {
        let available = tank.endPressure - minimum(tank);
        available = available > 0 ? available : 0;
        const availableLiters = available * tank.size;
        const reallyConsumedLiters = consumedLiters > availableLiters ? availableLiters : consumedLiters;
        tank.consumed += reallyConsumedLiters / tank.size;
        return reallyConsumedLiters;
    }

    /** The only method which add gas */
    private toBeConsumedYet(segments: Segment[], rmv: number,
        remainToConsume: GasVolumes,
        includeSegment: (segment: Segment) => boolean): GasVolumes {

        const rmvSeconds = Time.toMinutes(rmv);

        for (let index = 0; index < segments.length; index++) {
            const segment = segments[index];

            if (includeSegment(segment)) {
                const gas = segment.gas;
                const gasCode = gas.contentCode;
                const consumedLiters = this.consumedBySegment(segment, rmvSeconds);
                let consumedByGas: number = remainToConsume.get(gasCode);
                consumedByGas += consumedLiters;
                remainToConsume.set(gasCode, consumedByGas);
            }
        }

        return remainToConsume;
    }

    /**
     * Returns consumption in Liters at given segment average depth
     * @param rmvSeconds Liter/second
     */
    private consumedBySegment(segment: Segment, rmvSeconds: number) {
        const averagePressure = this.depthConverter.toBar(segment.averageDepth);
        const duration = Precision.roundTwoDecimals(segment.duration);
        const consumed = duration * averagePressure * rmvSeconds;
        return consumed;
    }

    private roundTanksConsumedToBars(tanks: Tank[]) {
        tanks.forEach((tank: Tank) => tank.consumed = Precision.ceil(tank.consumed));
    }
}

