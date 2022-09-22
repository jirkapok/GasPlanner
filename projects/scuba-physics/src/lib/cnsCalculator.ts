import { DepthConverter } from './depth-converter';
import { Segment } from './Segments';

/**
 * Reference: https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf
 * Shortcuts for the most common operations:
 *   AAP = absolute atmospheric pressure
 *   ppO2 = partial pressure of oxygen
 *   fO2 = oxygen fraction
 */
export class CnsCalculator {
    private readonly minimumPpO2 = 0.5;

    constructor(private depthConverter: DepthConverter) { }

    /** Calculates total CNS % for provided profile */
    public calculateForProfile(profile: Segment[]): number {
        let total = 0;

        profile.forEach(segment => {
            const o2 = segment.gas.fO2;
            const partCns = this.calculate(o2, segment.startDepth, segment.endDepth, segment.duration);
            total += partCns;
        });

        return total;
    }

    /**
     * @param fO2 oxygen fraction
     * @param startDepth starting depth in meters
     * @param endDepth end depth in meters
     * @param duration duration in seconds
     */
    public calculate(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        const avgDepth = (startDepth + endDepth) / 2;
        const aap = this.depthConverter.toBar(avgDepth);
        const ppO2 = fO2 * aap;

        if(ppO2 <= this.minimumPpO2) {
            return 0;
        }

        // https://thetheoreticaldiver.org/wordpress/index.php/2019/08/15/calculating-oxygen-cns-toxicity/
        const exponent = this.exponentByPpO2(ppO2);
        const rate =  Math.exp(exponent);
        const cns = duration * rate;
        return cns;
    }

    // slope function as mentioned from the paper above
    private exponentByPpO2(ppO2: number): number {
        if(ppO2 <= 1.5) {
            return -11.7853 + 1.93873 * ppO2;
        }

        return -23.6349 + 9.80829 * ppO2;
    }
}
