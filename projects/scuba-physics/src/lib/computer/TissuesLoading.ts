import { Tissues } from '../algorithm/Tissues';
import { LoadedTissues } from '../algorithm/Tissues.api';

/** Loading of the leading tissue shown by the dive computer */
export class TissuesLoading {
    private static readonly maxPercents = 100;

    /**
     * Percents 0-100 of the leading tissue loading relative to its surface M-value reduced by the gradient factor high.
     * 100 = no decompression limit reached, decompression starts.
     * Uses total inert gas pressure (nitrogen and helium).
     * @param tissues Not null tissues sample
     * @param ceiling in meters at the moment of the sample, tissues are fully loaded, when the ceiling is below surface
     * @param surfacePressure in bars
     * @param gfHigh gradient factor high in range 0-1
     */
    public static percents(tissues: LoadedTissues, ceiling: number, surfacePressure: number, gfHigh: number): number {
        if (ceiling > 0) {
            return TissuesLoading.maxPercents;
        }

        const surfaceGradient = Tissues.createLoaded(tissues).gradientFactor(surfacePressure);
        return Math.min(TissuesLoading.maxPercents, surfaceGradient / gfHigh * TissuesLoading.maxPercents);
    }
}
