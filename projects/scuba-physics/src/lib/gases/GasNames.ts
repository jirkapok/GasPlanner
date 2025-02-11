import { Precision } from "../common/precision";

export class GasNames {
    public static readonly airName = 'Air';
    public static readonly oxygenName = 'Oxygen';

    /**
     * Returns label of ths standard nitrox gas based on its O2 content
     * @param fO2 partial pressure of O2 in range 0-1.
     * @param fHe partial pressure of He in range 0-1.
     */
    public static nameFor(fO2: number, fHe: number = 0): string {
        const simpleO2InAir = 21;
        // not sure, if this rounding is acceptable for the UI
        const percentO2 = Precision.round(fO2 * 100);
        const percentHe = Precision.round(fHe * 100);

        if (percentO2 <= 0) {
            return '';
        }

        if (percentHe <= 0) {
            // prevent best gas overflow
            if (percentO2 >= 100) {
                return GasNames.oxygenName;
            }

            if (percentO2 === simpleO2InAir) {
                return GasNames.airName;
            }

            return 'EAN' + percentO2.toString();
        }

        const prefix = percentO2 >= simpleO2InAir ? 'Helitrox' : 'Trimix';
        return `${prefix} ${percentO2.toString()}/${percentHe.toString()}`;
    }
}
