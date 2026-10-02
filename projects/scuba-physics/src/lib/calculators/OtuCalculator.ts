import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';

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
    private readonly breathing: BreathingModel;

    constructor(private depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }

    /**
     * Calculates total OTU units for provided profile
     * @param startAscentIndex index of first segment of calculated ascent, Infinity if not known
     */
    public calculateForProfile(profile: Segment[], startAscentIndex: number = Number.POSITIVE_INFINITY): number {
        let total = 0;

        profile.forEach((segment, index) => {
            const isAscent = index >= startAscentIndex;
            const pO2Start = this.breathing.ppO2(segment.gas, segment.startDepth, isAscent);
            const pO2End = this.breathing.ppO2(segment.gas, segment.endDepth, isAscent);
            total += this.calculateByPpO2(segment.duration, pO2Start, pO2End);
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
        const startAAP = this.depthConverter.toBar(startDepth);
        const endAAP = this.depthConverter.toBar(endDepth);
        return this.calculateByPpO2(duration, startAAP * pO2, endAAP * pO2);
    }

    /**
     * Ascent or descent profile at a constant rate of oxygen partial pressure change
     * @param duration - time in seconds
     * @param pO2Start - oxygen partial pressure in bars at start of the segment
     * @param pO2End - oxygen partial pressure in bars at end of the segment
     */
    public calculateByPpO2(duration: number, pO2Start: number, pO2End: number): number {
        let durationMinutes = Time.toMinutes(duration);

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
