/** First dimension are the snapshots in time, second dimension are 16 tissues */
export type TissueOverPressures = number[][];

/**
 * Represents state of the body after performed dive.
 */
export interface LoadedTissue {
    /**
     * partial pressure of nitrogen in bars
     */
    pN2: number;

    /**
     * partial pressure of helium in bars
     */
    pHe: number;
}

export interface ProfileMoment {
    /** In seconds from start of the dive */
    runtime: number;
    /** In meters */
    depth: number;
}
