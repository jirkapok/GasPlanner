import _ from 'lodash';
import { LoadedTissue, TissueOverPressures } from "./Tissues.api";
import { Tissues } from "./Tissues";

export class ProfileTissues {
    /**
     * Calculates current gradient factor from tissues state in range 0 - 1 (representing percents).
     * @param finalTissues last known state of the tissues
     * @param surfacePressure pressure at the surface in bars
     **/
    public surfaceGradient(finalTissues: LoadedTissue[], surfacePressure: number): number {
        const tissues = Tissues.createLoaded(finalTissues);
        const surfaceGradient = tissues.gradientFactor(surfacePressure);
        return surfaceGradient;
    }

    /**
     * Finds the first moment, where the 5th tissue starts off gasing.
     * Throws Error in case any sample has wrong number of tissues.
     * @param tissueOverPressures Not null array of over pressures.
     * Expects every sample to have 16 items representing the 16 tissues in range -1 .. +1,
     * The required values are calculated using Tissues.saturationRatio method.
     * @returns Index of first overpressure sample, where saturation speed is positive.
     **/
    public offgasingStart(tissueOverPressures: TissueOverPressures[]): number {
        const tissue5index = 4;

        // multilevel dives may switch multiple times between on/offgasing
        const lastLoading = _(tissueOverPressures).findLastIndex(op => {
            if (op.length !== 16) {
                throw new Error('Wrong number of tissues in any sample');
            }

            return op[tissue5index] < 0;
        });

        let foundIndex = _(tissueOverPressures).findIndex(op => op[tissue5index] > 0, lastLoading);

        // Not submerged or never offgased
        foundIndex = (foundIndex < 0 || foundIndex >= tissueOverPressures.length - 1) ? 0 : foundIndex;
        return foundIndex;
    }
}
