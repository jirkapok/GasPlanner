import { Segment } from './Segments';
import { Time } from './Time';

type OTU = number;

/**
 * OTU - Oxygen Toxicity Units
 *
 * Oxygen Toxicity Calculations
 * Reference: https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf
 *
 * @author Michael Czolko <michael@czolko.cz>
 */
export class OtuCalculator {
    public static readonly dailyLimit = 300;
    private static readonly minPressure = 0.5;
    private static readonly threeElevenths = 3 / 11;
    private static readonly elevenSixths = 11 / 6;

    /** Calculates total OTU units for provided profile */
    public calculateForProfile(profile: Segment[]): OTU {
        let total = 0;

        profile.forEach(segment => {
            const o2 = segment.gas.fO2;
            const minutes = Time.toMinutes(segment.duration);
            const partOtu = this.calculate(minutes, o2, segment.startDepth, segment.endDepth);
            total += partOtu;
        });

        return total;
    }

    /**
     * Ascent or descent profile at a constant rate
     * AAP - Absolute Atmospheric Pressure
     *
     * @param time - time in minutes
     * @param pO2 - partial oxygen concentration (EAN32 = 0.32)
     * @param startDepth - start depth in meters
     * @param endDepth - end depth in meters
     */
    public calculate(time: number, pO2: number, startDepth: number, endDepth: number): OTU {
        // consider merge into one formula as described:
        // https://thetheoreticaldiver.org/wordpress/index.php/2018/12/05/a-few-thoughts-on-oxygen-toxicity/
        if (startDepth === endDepth) {
            return this.calculateFlatWithDepth(time, pO2, startDepth);
        }

        return this.calculateDifference(time, pO2, startDepth, endDepth);
    }

    /**
     * only for start and end depths are equal
     */
    private calculateFlatWithDepth(time: number, pO2: number, depth: number): OTU {
        const pressure = this.depthToPressure(depth);
        const ppO2 = pO2 * pressure;
        return this.calculateFlat(time, ppO2);
    }

    private calculateFlat(time: number, ppO2: number): OTU {
        if (ppO2 < OtuCalculator.minPressure) {
            return 0;
        }

        return time * (Math.pow((.5 / (ppO2 - .5)), -5 / 6));
    }

    /**
     * Only for different start and end depths
     * (Ascent or descent profile at a constant rate)
     */
    private calculateDifference(time: number, pO2: number, startDepth: number, endDepth: number): OTU {
        // AP - Absolute Atmospheric Pressure
        const startAAP = this.depthToPressure(startDepth);
        const endAAP = this.depthToPressure(endDepth);
        const maxAAP = Math.max(startAAP, endAAP);
        const minAAP = Math.min(startAAP, endAAP);
        const maxPO2 = maxAAP * pO2;
        const minP02 = minAAP * pO2;

        if (maxPO2 <= OtuCalculator.minPressure) {
            return 0;
        }

        const lowPO2 = minP02 < OtuCalculator.minPressure ? OtuCalculator.minPressure : minP02;
        const oxygenTime = time * (maxPO2 - lowPO2) / (maxPO2 - minP02);
        return this.differenceEquation(oxygenTime, maxPO2, lowPO2);
    }

    /**
     * Formula written in FORTRAN:
     * OTU = 3.0/11.0*TIME/(maxPO2 - lowPO2)*(((maxPO2 - 0.5)/0.5)**(11.0/6.0) - ((lowPO2 - 0.5)/0.5)**(11.0/6.0))
     */
    private differenceEquation(time: number, maxPO2: number, lowPO2: number): OTU {
        return OtuCalculator.threeElevenths * time / (maxPO2 - lowPO2) * (this.pO2part(maxPO2) - this.pO2part(lowPO2));
    }

    private pO2part(pO2: number): number {
        return Math.pow((pO2 - .5) / .5, OtuCalculator.elevenSixths);
    }

    private depthToPressure(depthMeters: number): number {
        // TODO replace by depth converter
        return (depthMeters + 10) / 10;
    }
}
