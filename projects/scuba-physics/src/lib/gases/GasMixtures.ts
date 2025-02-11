import { DepthConverter } from '../physics/depth-converter';

export class GasMixtures {
    /** Relative partial pressure of oxygen in air at surface */
    public static readonly o2InAir = 0.209;
    public static readonly nitroxInAir = 1 - GasMixtures.o2InAir;

    /** Defines minimum fraction of oxygen in gas mixture of breath able gas. */
    public static readonly minPpO2 = 0.18;

    /** Maximum recommended value of equivalent narcotic depth. */
    public static readonly maxEnd = 30;
    /**
     * Calculates the partial pressure of a gas component from the volume gas fraction and total pressure.
     *
     * @param absPressure - The total pressure P in bars (typically 1 bar of atmospheric pressure + x bars of water pressure).
     * @param volumeFraction - The volume fraction of gas component (typically 0.79 for 79%) measured as percentage in decimal.
     * @returns The partial pressure of gas component in bar absolute.
     */
    public static partialPressure(absPressure: number, volumeFraction: number): number {
        return absPressure * volumeFraction;
    }

    /**
     * Calculates Maximum operation depth for given mix.
     *
     * @param ppO2 - Partial pressure constant.
     * @param fO2 - Fraction of Oxygen in gas.
     * @returns Depth in bars.
     */
    public static mod(ppO2: number, fO2: number): number {
        const bars = ppO2 / fO2;
        return bars;
    }

    /**
     * Calculates best mix of nitrox gas for given depth.
     *
     * @param pO2 - Partial pressure constant.
     * @param depth - Current depth in meters.
     * @param depthConverter Converter used to translate the pressure.
     * @returns Fraction of oxygen in required gas (0-1).
     */
    public static bestMix(pO2: number, depth: number, depthConverter: DepthConverter): number {
        const bar = depthConverter.toBar(depth);
        const result = pO2 / bar;

        if (result > 1) {
            return 1;
        }

        return result;
    }

    /**
     * Calculates equivalent air depth for given nitrox gas mix.
     * https://en.wikipedia.org/wiki/Equivalent_air_depth
     *
     * @param fO2 Fraction of Oxygen in gas mix (0-1).
     * @param depth Current depth in bars.
     * @param o2InAir Theoretical/default fraction of oxygen content in air.
     * @returns Depth in bars. May return pressure lower than surface pressure!
     */
    public static ead(fO2: number, depth: number, o2InAir: number = GasMixtures.o2InAir): number {
        const fN2 = 1 - fO2; // here we are interested only in nitrogen toxicity
        const nitroxInAir = 1 - o2InAir;
        const result = GasMixtures.end(depth, fN2) / nitroxInAir;
        return result;
    }

    /**
     * Calculates equivalent narcotic depth as the depth which would produce the same narcotic effect when breathing air.
     * Define which gas (nitrogen or oxygen) is narcotic by setting is part to 0.
     * https://en.wikipedia.org/wiki/Equivalent_narcotic_depth
     * See also MND.
     *
     * @param currentDepth Current depth in bars for which you want to calculate the end.
     * @param fN2 Fraction of nitrogen in gas mix (0-1).
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @returns Depth in bars. May return pressure lower than surface pressure!
     */
    public static end(currentDepth: number, fN2: number, fO2: number = 0): number {
        const narcIndex = this.narcoticIndex(fO2, fN2);
        return currentDepth * narcIndex;
    }

    /**
     * Calculates maximum depth, at which the narcotic effect corresponds to the given narcotic depth.
     * Define which gas (nitrogen or oxygen) is narcotic by setting is part to 0.
     * Also called maximum narcotic depth.
     * Sea also END.
     *
     * @param narcoticDepth END in bars for which you want to calculate the mnd.
     * @param fN2 Fraction of nitrogen in gas mix (0-1).
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @returns Depth in bars.
     */
    public static mnd(narcoticDepth: number, fN2: number, fO2: number = 0): number {
        const narcIndex = this.narcoticIndex(fO2, fN2);
        return narcoticDepth / narcIndex;
    }

    /**
     * Calculates minimum depth at which the gas is breathe able.
     *
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @param surfacePressure surface pressure in bars.
     * @returns Depth in bars.
     */
    public static ceiling(fO2: number, surfacePressure: number): number {
        const ratio = GasMixtures.minPpO2 / fO2;
        const bars = ratio * surfacePressure;

        // hyperoxic gases have pressure bellow sea level, which cant be converted to depth
        if (bars < surfacePressure) {
            return surfacePressure;
        }

        return bars;
    }

    /** Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1 */
    private static narcoticIndex(fN2: number, fO2: number = 0): number {
        return fO2 + fN2;
    }
}
