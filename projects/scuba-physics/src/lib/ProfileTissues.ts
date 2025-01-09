import { LoadedTissue, ProfileMoment, TissueOverPressures } from "./Tissues.api";
import { Tissues } from "./Tissues";

export class ProfileTissues {
    /**
     * Calculates current gradient factor from tissues state in range 0 - 1 (representing percents).
     * @param finalTissues last known state of the tissues
     * @param surfacePressure pressure at the surface in bars
     */
    public surfaceGradient(finalTissues: LoadedTissue[], surfacePressure: number): number {
        const tissues = Tissues.createLoaded(finalTissues);
        const surfaceGradient = tissues.gradientFactor(surfacePressure);
        return surfaceGradient;
    }

    public offgasingStart(tissueOverPressures: TissueOverPressures): ProfileMoment {
        // TODO offgasingStartTime and offgasingStartDepth
        // 5th tissue goes from ongasing to offgasing?
        // (from Overpressures going from end take first, where saturation speed > 0 for all tissues)
        return { runtime: 0, depth: 0 };
    }
}
