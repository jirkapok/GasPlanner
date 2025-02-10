import { LoadedTissues, TissueOverPressures } from "./Tissues.api";
import { Segments } from "./Segments";
import { Gas, Gases } from "./Gases";
import { Options } from "./Options";
import { Tissues, TissuesValidator } from "./Tissues";
import { Time } from "./Time";

// Speed in meters / min.
export const durationFor = (depthDifference: number, speed: number): number => {
    const meterPerSec = Time.toMinutes(speed);
    return depthDifference / meterPerSec;
};

export interface SurfaceIntervalApplied {
    /** Snapshot of the tissues at end of the applied surface interval */
    finalTissues: LoadedTissues;
}

/** Extends surface interval result by providing tissues statistics collected while resting at surface. */
export interface SurfaceIntervalAppliedStatistics extends SurfaceIntervalApplied {
    /** Only the over pressures collected when applying the surface interval. One sample per second. */
    tissueOverPressures: TissueOverPressures[];
}

/** Represents surface interval between two dives */
export class RestingParameters {
    /**
     * Creates new instance of algorithm parameters representing surface interval between two dives.
     * Used as input for repetitive dives.
     * @param current Not empty collection of tissues at end of previous dive (when surfacing).
     * If no tissues are provided, default (first dive) are created and surfaceInterval has no effect.
     * @param surfaceInterval Duration of diver rest between two dives in seconds, Infinity for first dive.
     */
    constructor(public current: LoadedTissues, public surfaceInterval: number) {
    }
}

/** Parameters to request application of surface interval */
export class SurfaceIntervalParameters {
    /**
     * Creates new instance of algorithm parameters representing surface interval between two dives.
     * Used as input for repetitive dives.
     * @param previousTissues Not empty collection of tissues at end of previous dive (when surfacing).
     * @param altitude Altitude at which the surface interval (resting) happened in m.a.s.l.
     * Usually altitude of the following dive.
     * @param surfaceInterval Duration of diver rest between two dives in seconds.
     */
    constructor(public previousTissues: LoadedTissues, public altitude: number, public surfaceInterval: number) {
    }
}

export class AlgorithmParams {
    private readonly _surface: RestingParameters;
    private constructor(
        private _segments: Segments,
        private _gases: Gases,
        private _options: Options,
        /** If no valid tissues are provided from previous dive,
         * then first dive default tissues are created, ignoring surface interval.
         **/
        surface?: RestingParameters
    ) {
        this._surface = this.resolveSurfaceParameters(surface);
    }

    public get segments(): Segments {
        return this._segments;
    }

    public get gases(): Gases {
        return this._gases;
    }

    public get options(): Options {
        return this._options;
    }

    public get surfaceInterval(): SurfaceIntervalParameters {
        return new SurfaceIntervalParameters(this._surface.current, this.options.altitude, this._surface.surfaceInterval);
    }

    /**
     * Creates not null new instance of parameters.
     * @param depth depth below surface in meters
     * @param gas gas to use as the only one during the plan
     * @param options conservatism options to be used
     * @param surface Surface resting definition, in case on repetitive dives. Undefined for first dive.
     */
    public static forSimpleDive(depth: number, gas: Gas, options: Options, surface?: RestingParameters): AlgorithmParams {
        const gases = new Gases();
        gases.add(gas);

        const segments = new Segments();
        const duration = durationFor(depth, options.descentSpeed);
        segments.add(depth, gas, duration);

        return new AlgorithmParams(segments, gases, options, surface);
    }

    /**
     * Creates not null new instance of parameters.
     * @param segments Already realized part of the dive
     * @param gases Gases used during the dive + additional gases to be considered during decompression ascent.
     * For nodeco limit only need to contain gases used in segments.
     * @param options conservatism options to be used
     * @param surface Surface resting definition, in case on repetitive dives. Undefined for first dive.
     */
    public static forMultilevelDive(segments: Segments, gases: Gases, options: Options, surface?: RestingParameters): AlgorithmParams {
        return new AlgorithmParams(segments, gases, options, surface);
    }

    private resolveSurfaceParameters(provided?: RestingParameters): RestingParameters {
        // helps calculator to don't generate tissues for first dive
        if(provided && TissuesValidator.valid(provided?.current)) {
            return provided;
        }

        const tissues = Tissues.createLoadedAt(this.options.altitude);
        return new RestingParameters(tissues, Number.POSITIVE_INFINITY);
    }
}
