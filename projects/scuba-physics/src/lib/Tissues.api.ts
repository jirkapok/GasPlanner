/**
 * List of 16 tissues over pressure snapshots.
 * Saturation ratio for all tissues is percents relative to ambient pressure.
 * -1..0: is offgasing, -1 = surface pressure.
 *    =0: is equilibrium (tissue is not offgasing or ongasing), at ambient pressure.
 *    >0: is ongasing, +1 = 100% gradient i.e. at m-value, more means exceeded limit.
 **/
export type TissueOverPressures = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
];

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
