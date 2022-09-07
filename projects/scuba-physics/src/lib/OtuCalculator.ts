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


    /**
     * Flat OTU calculation
     *
     * @param time - time in minutes
     * @param PO2 - partial oxygen concentration (EAN32 = 0.32)
     * @param depth - depth in meters
     */
    public calculateFlatWithDepth(time: number, PO2: number, depth: number): OTU {
        const absoluteAtmosphericPressure = (depth + 10) / 10;
        const ppO2 = PO2 * absoluteAtmosphericPressure;
        return this.calculateFlat(time, ppO2);
    }

    /**
     * Flat OTU calculation
     *
     * @param time - time in minutes
     * @param ppO2 - partial pressure of oxygen (1.4)
     */
    public calculateFlat(time: number, ppO2: number): OTU {
        return ppO2 < .5 ? 0.0 : time * (Math.pow((.5 / (ppO2 - .5)), -5.0 / 6.0));
    }

    /**
     * Ascent or descent profile at a constant rate
     * AAP - Absolute Atmospheric Pressure
     *
     * @param time - time in minutes
     * @param PO2 - partial oxygen concentration (EAN32 = 0.32)
     * @param startDepth - start depth in meters
     * @param endDepth - end depth in meters
     */
    public calculateDifference(time: number, PO2: number, startDepth: number, endDepth: number): OTU {
        const startAAP = (startDepth + 10) / 10;
        const endAAP = (endDepth + 10) / 10;
        const maxAAP = Math.max(startAAP, endAAP);
        const minAAP = Math.min(startAAP, endAAP);
        const maxPO2 = maxAAP * PO2;
        const minP02 = minAAP * PO2;

        if (maxPO2 <= .5) return 0.0;
        const lowPO2 = minP02 < 0.5 ? 0.5 : minP02;
        const oxygenTime = time * (maxPO2 - lowPO2) / (maxPO2 - minP02);

        return this.differenceEquation(oxygenTime, maxPO2, lowPO2);
    }

    /**
     * Ascent or descent profile at a constant rate
     *
     * Formula written in FORTRAN:
     * OTU = 3.0/11.0*TIME/(maxPO2 - lowPO2)*(((maxPO2 - 0.5)/0.5)**(11.0/6.0) - ((lowPO2 - 0.5)/0.5)**(11.0/6.0))
     */
    private differenceEquation(time: number, maxPO2: number, lowPO2: number): OTU {
        return 3.0 / 11.0 * time / (maxPO2 - lowPO2) * (this.pO2part(maxPO2) - this.pO2part(lowPO2));
    }

    private pO2part(pO2: number): number {
        return Math.pow((pO2 - .5) / .5, 11.0 / 6.0);
    }

}
