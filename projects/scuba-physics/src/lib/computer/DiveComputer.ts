import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { Ceiling, Event } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { ComputerData, ComputerEvent, RunTimePoint } from './ComputerData';
import { ComputerProfile } from './ComputerProfile';

/** The whole dive: its definition and already calculated results */
export interface CalculatedDive {
    /** Definition of the dive: plan defined by user, gases, options, breathing model and surface interval */
    dive: AlgorithmParams;
    /** Already calculated profile: user defined segments followed by the calculated ascent, see BuhlmannAlgorithm.decompression */
    profile: Segment[];
    /** Ceilings of the profile, sampled every second */
    ceilings: Ceiling[];
    /** All events of the profile calculated by the algorithm */
    events: Event[];
}

/**
 * Dive computer data of already calculated dive.
 * Everything except the slow no decompression limit is sampled when started,
 * the points with no decompression limit are provided one by one.
 */
export class DiveComputer {
    private constructor(private readonly data: ComputerData, private readonly noDecoLimits: Iterable<number>) {
    }

    /** Events of the dive sorted by run time */
    public get events(): ComputerEvent[] {
        return this.data.events;
    }

    /** Count of points, one for every second of the dive */
    public get total(): number {
        return this.data.profile.length;
    }

    /** Samples the calculated dive, nothing already calculated is calculated again */
    public static start(calculated: CalculatedDive): DiveComputer {
        const data = ComputerProfile.sample({
            profile: calculated.profile,
            ceilings: calculated.ceilings,
            events: calculated.events,
            userSegments: calculated.dive.segments.length
        });
        const noDecoLimits = new BuhlmannAlgorithm().noDecoLimitsOfProfile(calculated.dive, calculated.profile);
        return new DiveComputer(data, noDecoLimits);
    }

    /** Complete computer data of the whole dive including no decompression limits */
    public static calculate(calculated: CalculatedDive): ComputerData {
        const computer = DiveComputer.start(calculated);
        return {
            profile: Array.from(computer.points()),
            events: computer.events
        };
    }

    /** Yields every point as soon as its no decompression limit is calculated. Can be iterated only once. */
    public *points(): Generator<RunTimePoint, void, undefined> {
        const profile = this.data.profile;
        let index = 0;
        let lastLimit = 0;

        for (const limit of this.noDecoLimits) {
            // limits are calculated for every started second of each segment, so there may be more of them than points
            if (index >= profile.length) {
                break;
            }

            lastLimit = limit;
            yield this.withNoDecoLimit(index, limit);
            index++;
        }

        // defensive: in case there are less limits than points, the last limit is used
        for (; index < profile.length; index++) {
            yield this.withNoDecoLimit(index, lastLimit);
        }
    }

    private withNoDecoLimit(index: number, limit: number): RunTimePoint {
        const point = this.data.profile[index];
        point.ndl = limit;
        return point;
    }
}
