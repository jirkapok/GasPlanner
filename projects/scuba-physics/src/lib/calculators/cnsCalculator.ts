import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';

/**
 * Reference: https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf
 * Shortcuts for the most common operations:
 *   AAP = absolute atmospheric pressure
 *   ppO2 = partial pressure of oxygen
 *   fO2 = oxygen fraction
 */
export class CnsCalculator {
    /** Surface elimination half time of CNS toxicity used by most dive computers */
    public static readonly halfTime = Time.oneMinute * 90;
    /** Maximum CNS toxicity in % */
    public static readonly limit = 100;
    private readonly minimumPpO2 = 0.5;
    private readonly breathing: BreathingModel;

    constructor(private depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }

    /**
     * Calculates remaining CNS toxicity in % after the surface interval.
     * The CNS is eliminated exponentially with 90 minutes half time.
     * @param cns CNS toxicity in % at end of previous dive
     * @param surfaceInterval duration of the surface interval in seconds, Infinity for first dive
     */
    public static residual(cns: number, surfaceInterval: number): number {
        if (cns <= 0 || surfaceInterval === Number.POSITIVE_INFINITY) {
            return 0;
        }

        return cns * Math.pow(0.5, surfaceInterval / CnsCalculator.halfTime);
    }

    /**
     * Calculates total CNS % for provided profile
     * @param startAscentIndex index of first segment of calculated ascent, Infinity if not known
     */
    public calculateForProfile(profile: Segment[], startAscentIndex: number = Number.POSITIVE_INFINITY): number {
        let total = 0;

        profile.forEach((segment, index) => {
            const avgDepth = (segment.startDepth + segment.endDepth) / 2;
            const ppO2 = this.breathing.ppO2(segment.gas, avgDepth, index >= startAscentIndex);
            total += this.calculateByPpO2(ppO2, segment.duration);
        });

        return total;
    }

    /**
     * Calculates total CNS % at end of provided dive profile,
     * including remaining CNS from previous dive after the surface interval.
     * @param profile the dive profile
     * @param previousCns CNS % at end of previous dive
     * @param surfaceInterval duration of the surface interval in seconds, Infinity for first dive
     * @param startAscentIndex index of first segment of calculated ascent, Infinity if not known
     */
    public calculateForRepetitiveDive(profile: Segment[], previousCns: number, surfaceInterval: number,
        startAscentIndex: number = Number.POSITIVE_INFINITY): number {
        const residual = CnsCalculator.residual(previousCns, surfaceInterval);
        return residual + this.calculateForProfile(profile, startAscentIndex);
    }

    /**
     * Calculates CNS in % for provided profile segment
     * @param fO2 oxygen fraction
     * @param startDepth starting depth in meters
     * @param endDepth end depth in meters
     * @param duration duration in seconds
     */
    public calculate(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        const avgDepth = (startDepth + endDepth) / 2;
        const aap = this.depthConverter.toBar(avgDepth);
        const ppO2 = fO2 * aap;
        return this.calculateByPpO2(ppO2, duration);
    }

    /**
     * Calculates CNS in % for constant oxygen partial pressure
     * @param ppO2 oxygen partial pressure in bars
     * @param duration duration in seconds
     */
    public calculateByPpO2(ppO2: number, duration: number): number {
        if(ppO2 <= this.minimumPpO2) {
            return 0;
        }

        // https://thetheoreticaldiver.org/wordpress/index.php/2019/08/15/calculating-oxygen-cns-toxicity/
        const exponent = this.exponentByPpO2(ppO2);
        const rate =  Math.exp(exponent);
        const cns = duration * rate;
        return cns * 100;
    }

    // slope function as mentioned from the paper above
    private exponentByPpO2(ppO2: number): number {
        if(ppO2 <= 1.5) {
            return -11.7853 + 1.93873 * ppO2;
        }

        return -23.6349 + 9.80829 * ppO2;
    }
}
