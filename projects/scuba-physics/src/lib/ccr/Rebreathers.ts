/**
 * Generic rebreather formulas shared by all rebreather types.
 * All rates are surface equivalent liters per minute, pressures are absolute in bars.
 */
export class Rebreathers {
    /**
     * Fresh gas added to a passive semi-closed rebreather loop.
     * @param ambientPressure absolute pressure in bars
     * @param rmv diver respiratory minute volume in liters/minute
     * @param injectionRatio ratio of breathed to dumped volume, e.g. 8 means 1/8 of each breath is dumped
     */
    public static pscrSupplyRate(ambientPressure: number, rmv: number, injectionRatio: number): number {
        if (injectionRatio <= 0) {
            throw new Error('Injection ratio needs to be positive number.');
        }

        return rmv * ambientPressure / injectionRatio;
    }

    /**
     * Oxygen used by manual CCR. Diver adds manually the missing oxygen,
     * when the needle valve flow is lower than the metabolic consumption.
     */
    public static mccrO2Rate(o2Flow: number, metabolicO2: number): number {
        return Math.max(o2Flow, metabolicO2);
    }

    /**
     * Oxygen used by electronic CCR including losses (mask clearing, leaks).
     * @param o2Loss fraction 0-1 of the metabolic consumption lost
     */
    public static eccrO2Rate(metabolicO2: number, o2Loss: number): number {
        return metabolicO2 * (1 + o2Loss);
    }

    /**
     * Diluent added to keep the loop volume during descent.
     * @param loopVolume loop volume in liters
     * @param startPressure absolute pressure in bars at start of the segment
     * @param endPressure absolute pressure in bars at end of the segment
     */
    public static diluentForDescent(loopVolume: number, startPressure: number, endPressure: number): number {
        const difference = endPressure - startPressure;
        return difference > 0 ? loopVolume * difference : 0;
    }
}
