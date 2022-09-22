import { DepthConverter } from './depth-converter';
import { Segment } from './Segments';
import { Time } from './Time';

/**
 * OTU - Oxygen Toxicity Units
 *
 * Oxygen Toxicity Calculations
 * Reference: https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf
 *
 */
export class OtuCalculator {
    public static readonly dailyLimit = 300;
    private readonly minPressure = 0.5;

    constructor(private depthConverter: DepthConverter) { }

    /** Calculates total OTU units for provided profile */
    public calculateForProfile(profile: Segment[]): number {
        let total = 0;

        profile.forEach(segment => {
            const o2 = segment.gas.fO2;
            const partOtu = this.calculate(segment.duration, o2, segment.startDepth, segment.endDepth);
            total += partOtu;
        });

        return total;
    }

    /**
     * Ascent or descent profile at a constant rate
     * AAP - Absolute Atmospheric Pressure
     *
     * @param duration - time in seconds
     * @param pO2 - partial oxygen concentration (EAN32 = 0.32)
     * @param startDepth - start depth in meters
     * @param endDepth - end depth in meters
     */
    public calculate(duration: number, pO2: number, startDepth: number, endDepth: number): number {
        let durationMinutes = Time.toMinutes(duration);
        const startAAP = this.depthConverter.toBar(startDepth);
        const endAAP = this.depthConverter.toBar(endDepth);
        let pO2Start = startAAP * pO2;
        let pO2End = endAAP * pO2;

        if ((pO2Start <= this.minPressure) && (pO2End <= this.minPressure)) {
            return 0;
        }

        // only part of the segment bellow limit
        if (pO2Start <= this.minPressure) {
            durationMinutes = durationMinutes * (pO2End - this.minPressure) / (pO2End - pO2Start);
            pO2Start = 0.501; // needs to go above limit
        } else if (pO2End <= this.minPressure) {
            durationMinutes = durationMinutes * (pO2Start - this.minPressure) / (pO2Start - pO2End);
            pO2End = 0.501;
        }

        // https://thetheoreticaldiver.org/wordpress/index.php/2018/12/05/a-few-thoughts-on-oxygen-toxicity/
        // simplified version of ((Pa + Pb) / 2 - 0.5) / 0.5
        const pm = (pO2Start + pO2End) - 1.0;
        const rate = Math.pow(pm, 5.0 / 6.0) * (1.0 - 5.0 * Math.pow((pO2End - pO2Start), 2) / 216 / Math.pow(pm, 2));
        return rate * durationMinutes;
    }
}
