/**
 * Set of 16 tissues over pressure snapshots.
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

/** Set of 16 tissues. */
export type LoadedTissues = [
    LoadedTissue, LoadedTissue, LoadedTissue, LoadedTissue,
    LoadedTissue, LoadedTissue, LoadedTissue, LoadedTissue,
    LoadedTissue, LoadedTissue, LoadedTissue, LoadedTissue,
    LoadedTissue, LoadedTissue, LoadedTissue, LoadedTissue
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
