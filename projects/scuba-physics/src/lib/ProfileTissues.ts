import { LoadedTissue, ProfileMoment, TissueOverPressures } from "./Tissues.api";

export class ProfileTissues {
    /**
     * Calculates current gradient factor from tissues state in range 0 - 1 (representing percents).
     * @param finalTissues last known state of the tissues
     */
    public surfaceGradient(finalTissues: LoadedTissue[]): number {
        // TODO fill surfaceGF (from LoadedTissues)
        return 0;
    }

    public offgasingStart(tissueOverPressures: TissueOverPressures): ProfileMoment {
        // TODO offgasingStartTime and offgasingStartDepth
        //  (from Overpressures going from end take first, where saturation speed > 0 for all tissues)
        return { runtime: 0, depth: 0 };
    }
}
