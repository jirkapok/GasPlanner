import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { CnsCalculator } from './cnsCalculator';

/** Part of the oxygen exposure history, e.g. one profile segment or surface interval */
export interface CnsExposure {
    /** Duration of the exposure in seconds */
    duration: number;
    /** Consumed part of the daily CNS limit in % */
    cns: number;
}

/** One dive in series of dives */
export interface CnsDive {
    profile: Segment[];
    /** Duration of the surface interval before the dive in seconds, Infinity for first dive */
    surfaceInterval: number;
}

/**
 * Calculates CNS toxicity accumulated by all dives within last 24 hours against the NOAA 24 hour limits.
 * The daily CNS is not eliminated during surface intervals, only exposures older than 24 hours are removed.
 * Reference: NOAA Diving Manual, Oxygen partial pressure and exposure time limits.
 */
export class CnsDailyCalculator {
    /** Maximum daily CNS toxicity in % */
    public static readonly dailyLimit = CnsCalculator.limit;
    /** Time window of the daily limit */
    public static readonly window = Time.oneDay;
    private static readonly minimumPpO2 = 0.5;
    /** Maximum ppO2 in bars defined by the NOAA 24 hour limits */
    private static readonly maximumPpO2 = 1.6;
    /** NOAA 24 hour limits as pairs of [ppO2 in bars, limit in minutes] */
    private static readonly limits: number[][] = [
        [0.6, 720], [0.7, 570], [0.8, 450], [0.9, 360], [1.0, 300], [1.1, 270],
        [1.2, 240], [1.3, 210], [1.4, 180], [1.5, 180], [1.6, 150]
    ];

    private readonly singleExposure: CnsCalculator;

    constructor(private depthConverter: DepthConverter) {
        this.singleExposure = new CnsCalculator(depthConverter);
    }

    /**
     * Appends dive exposures to the exposures of previous dives and removes exposures older than 24 hours.
     * @param previous exposures at end of previous dive
     * @param surfaceInterval duration of the surface interval between the dives in seconds, Infinity for first dive
     * @param dive exposures of the new dive
     * @returns new collection of exposures within last 24 hours ending at end of the new dive
     */
    public static appendDive(previous: CnsExposure[], surfaceInterval: number, dive: CnsExposure[]): CnsExposure[] {
        if (surfaceInterval === Number.POSITIVE_INFINITY) {
            return CnsDailyCalculator.trimToWindow(dive);
        }

        const surface: CnsExposure = { duration: surfaceInterval, cns: 0 };
        return CnsDailyCalculator.trimToWindow([...previous, surface, ...dive]);
    }

    /** Sum of the daily CNS in % of all exposures */
    public static total(exposures: CnsExposure[]): number {
        return exposures.reduce((sum, exposure) => sum + exposure.cns, 0);
    }

    private static trimToWindow(exposures: CnsExposure[]): CnsExposure[] {
        const result: CnsExposure[] = [];
        let remaining = CnsDailyCalculator.window;

        for (let index = exposures.length - 1; index >= 0 && remaining > 0; index--) {
            const exposure = exposures[index];

            if (exposure.duration <= remaining) {
                result.unshift(exposure);
            } else {
                // only part of the exposure fits into the window
                const cns = exposure.duration > 0 ? exposure.cns * remaining / exposure.duration : 0;
                result.unshift({ duration: remaining, cns: cns });
            }

            remaining -= exposure.duration;
        }

        return result;
    }

    private static limitByPpO2(ppO2: number): number {
        const limits = CnsDailyCalculator.limits;

        if (ppO2 <= limits[0][0]) {
            return limits[0][1];
        }

        for (let index = 1; index < limits.length; index++) {
            const [upperPpO2, upperLimit] = limits[index];

            if (ppO2 <= upperPpO2) {
                const [lowerPpO2, lowerLimit] = limits[index - 1];
                const ratio = (ppO2 - lowerPpO2) / (upperPpO2 - lowerPpO2);
                return lowerLimit + ratio * (upperLimit - lowerLimit);
            }
        }

        return limits[limits.length - 1][1];
    }

    /**
     * Calculates daily CNS in % of all dives, where only last 24 hours ending at end of last dive are counted.
     * @param dives Not empty chronologically ordered dives.
     */
    public calculateForDives(dives: CnsDive[]): number {
        let exposures: CnsExposure[] = [];

        dives.forEach(dive => {
            const diveExposures = this.exposuresForProfile(dive.profile);
            exposures = CnsDailyCalculator.appendDive(exposures, dive.surfaceInterval, diveExposures);
        });

        return CnsDailyCalculator.total(exposures);
    }

    /** Creates exposure for each segment of the profile */
    public exposuresForProfile(profile: Segment[]): CnsExposure[] {
        return profile.map(segment => ({
            duration: segment.duration,
            cns: this.calculate(segment.gas.fO2, segment.startDepth, segment.endDepth, segment.duration)
        }));
    }

    /**
     * Calculates part of the daily CNS limit in % for provided profile segment
     * @param fO2 oxygen fraction
     * @param startDepth starting depth in meters
     * @param endDepth end depth in meters
     * @param duration duration in seconds
     */
    public calculate(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        const avgDepth = (startDepth + endDepth) / 2;
        const ppO2 = fO2 * this.depthConverter.toBar(avgDepth);

        if (ppO2 <= CnsDailyCalculator.minimumPpO2) {
            return 0;
        }

        // NOAA doesn't define daily limit above 1.6 bar, the single exposure limit is more conservative
        if (ppO2 > CnsDailyCalculator.maximumPpO2) {
            return this.singleExposure.calculate(fO2, startDepth, endDepth, duration);
        }

        const limit = Time.toSeconds(CnsDailyCalculator.limitByPpO2(ppO2));
        return duration / limit * 100;
    }
}
