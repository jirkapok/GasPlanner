import _ from 'lodash';
import { LoadedTissues } from "./Tissues.api";
import { Tissue, Tissues } from "./Tissues";

export class ProfileTissues {
    /**
     * Creates tissues loaded at the surface based on the altitude in meters above sea level.
     **/
    public static createAtSurface(altitude: number = 0): LoadedTissues {
        return Tissues.createLoadedAt(altitude);
    }

    /**
     * Calculates current gradient factor from tissues state in range 0 - 1 (representing percents).
     * @param finalTissues last known state of the tissues
     * @param surfacePressure pressure at the surface in bars
     **/
    public surfaceGradient(finalTissues: LoadedTissues, surfacePressure: number): number {
        const tissues = Tissues.createLoaded(finalTissues);
        const surfaceGradient = tissues.gradientFactor(surfacePressure);
        return surfaceGradient;
    }

    /**
     * Finds the first moment, where the 5th tissue starts off gasing.
     * Throws Error in case any sample has wrong number of tissues.
     * @param loadedTissues Not null array of tissues history, (usually one sample per second).
     * The required values are calculated using BuhlmannAlgorithm.decompressionStatistics method.
     * @returns Index of first overpressure sample, where saturation speed is positive.
     **/
    public offgasingStart(loadedTissues: LoadedTissues[]): number {
        const tissue5index = 4;
        const tissueHistory = _(loadedTissues).map(ts => {
            if (ts.length !== 16) {
                throw new Error('Wrong number of tissues in any sample');
            }

            return Tissue.totalPressure(ts[tissue5index]);
        });

        // multilevel dives may switch multiple times between on/offgasing
        const lastLoading = tissueHistory.findLastIndex((op, index, items) => {
            let previous = index > 0 ? items[index - 1] : op;
            return previous < op;
        });

        if(lastLoading < 0) {
            return loadedTissues.length === 0 ? -1 : loadedTissues.length - 1;
        }

        let foundIndex = tissueHistory.findIndex((op, index, items) => {
            let previous = index > 0 ? items[index - 1] : op;
            return previous > op;
        }, lastLoading);

        return foundIndex < 0 ? lastLoading : foundIndex;
    }
}
