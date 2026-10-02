import { DepthConverter } from '../physics/depth-converter';
import { Diver } from './Diver';
import { Segment } from '../depths/Segments';
import { Tank } from './Tanks';
import { Time } from '../physics/Time';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';

export interface ConsumptionOptions {
    diver: Diver;
    /** Minimum tank reserve for bottom gas tank in bars */
    primaryTankReserve: number;
    /** Minimum tank reserve for all other stage/deco tanks in bars */
    stageTankReserve: number;
}

/** Liters of gas grouped by gas content code */
export class GasVolumes {
    private remaining: Map<number, number> = new Map<number, number>();

    public get(gasCode: number): number {
        return this.remaining.get(gasCode) || 0;
    }

    public add(gasCode: number, toAdd: number): void {
        toAdd = toAdd > 0 ? toAdd : 0;
        const newValue = this.get(gasCode) + toAdd;
        this.remaining.set(gasCode, newValue);
    }

    public subtract(gasCode: number, tosSubtract: number): void {
        const current = this.get(gasCode);
        tosSubtract = tosSubtract > 0 ? tosSubtract : 0;
        let remaining = current - tosSubtract;
        remaining = remaining < 0 ? 0 : remaining;
        this.remaining.set(gasCode, remaining);
    }
}

export class RmvContext {
    public readonly rmvPerSecond: number;
    private readonly _stressRmvPerSecond: number;
    private readonly _teamStressRmvPerSecond: number;

    constructor(private options: ConsumptionOptions, public readonly bottomTank: Tank) {
        this.rmvPerSecond = Time.toMinutes(options.diver.rmv);
        this._teamStressRmvPerSecond = Time.toMinutes(options.diver.teamStressRmv);
        this._stressRmvPerSecond = Time.toMinutes(options.diver.stressRmv);
    }

    /**
     * Creates context for the dive, where the bottom tank is taken from the emergency ascent.
     * Not all segments have tank assigned, but the emergency ascent is calculated
     * from last user defined segment, so there should be a tank, otherwise we have no other option.
     */
    public static create(options: ConsumptionOptions, emergencyAscent: Segment[], tanks: Tank[]): RmvContext {
        const bottomTank = emergencyAscent[0]?.tank ?? tanks[0];
        return new RmvContext(options, bottomTank);
    }

    public stressRmvPerSecond(segment: Segment): number {
        // Bottom gas = team stress rmv, deco gas = diver stress rmv,
        // Consider separate stage tank RMV
        // User is on bottom tank, or calculated ascent using bottom gas.
        // The only issue is breathing bottom gas as travel and in such case it is user defined segment with tank assigned.
        if (segment.tank === this.bottomTank || segment.gas.compositionEquals(this.bottomTank.gas)) {
            return this._teamStressRmvPerSecond;
        }

        return this._stressRmvPerSecond;
    }

    public ensureMinimalReserve(tank: Tank, reserveVolume: number): number {
        const isBottomTank = tank === this.bottomTank;
        const minimalReserve = isBottomTank ? this.options.primaryTankReserve : this.options.stageTankReserve;
        const minimalReserveVolume = Tank.realVolume2(tank.size, minimalReserve, tank.gas);

        if(reserveVolume < minimalReserveVolume) {
            return minimalReserveVolume;
        }

        return reserveVolume;
    }
}

/** Shared validation and liters calculation of segments used by all consumption calculators */
export class SegmentsConsumption {
    private readonly breathing: BreathingModel;

    constructor(depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }

    public static validate(segments: Segment[], emergencyAscent: Segment[]): void {
        if (segments.length < 2) {
            throw new Error('Profile needs to contain at least 2 segments.');
        }

        if (emergencyAscent.length < 1) {
            throw new Error('Emergency ascent needs to contain at least 1 segment.');
        }
    }

    /** The only method which adds gas to GasVolumes */
    public toBeConsumedYet(
        segments: Segment[],
        remainToConsume: GasVolumes,
        getRmvPerSecond: (segment: Segment) => number,
        includeSegment: (segment: Segment) => boolean,
    ): GasVolumes {
        for (let index = 0; index < segments.length; index++) {
            const segment = segments[index];

            if (includeSegment(segment)) {
                const gas = segment.gas;
                const gasCode = gas.contentCode;
                const rmvPerSecond = getRmvPerSecond(segment);
                const consumedLiters = this.consumedBySegment(segment, rmvPerSecond);
                remainToConsume.add(gasCode, consumedLiters);
            }
        }

        return remainToConsume;
    }

    /**
     * Returns consumption in Liters of the segment source tank
     * @param rmvPerSecond Liter/second
     */
    public consumedBySegment(segment: Segment, rmvPerSecond: number): number {
        return this.breathing.consumedLiters(segment, rmvPerSecond);
    }
}
