import { Precision } from './precision';
import { Gas } from './Gases';

export class StandardGases {
    /** Relative partial pressure of oxygen in air at surface */
    public static readonly o2InAir = 0.209;
    public static readonly nitroxInAir = 1 - StandardGases.o2InAir;

    // theoretical range for ppo2 1.3 test data (even not used all gases with these values)
    // Standard gases inspired by UTD standard gases

    // Hyperoxic

    /** 0 - 6 m, deco only */
    public static readonly oxygen = new Gas(1, 0);

    /** 0 - 21 m, deco only */
    public static readonly ean50 = new Gas(0.5, 0);

    /** 0 - 24.2 m */
    public static readonly ean38 = new Gas(0.38, 0);

    /** 0 - 26.1 m */
    public static readonly ean36 = new Gas(0.36, 0);

    /** 0 - 30.6 m */
    public static readonly ean32 = new Gas(0.32, 0);

    /** 0 - 27.1 m, deco only */
    public static readonly trimix3525 = new Gas(0.35, 0.25);

    /** 0 - 42 m */
    public static readonly trimix2525 = new Gas(0.25, 0.25);

    // Normooxic

    /** 0 - 52.2 m */
    public static readonly air = new Gas(StandardGases.o2InAir, 0);

    /** 0 - 51.9 m */
    public static readonly trimix2135 = new Gas(0.21, 0.35);

    /** 0 - 62.2 m */
    public static readonly trimix1845 = new Gas(0.18, 0.45);

    // Hypoxic

    /** 2 - 76.6 m */
    public static readonly trimix1555 = new Gas(0.15, 0.55);

    /** 5 - 98.3 m */
    public static readonly trimix1260 = new Gas(0.12, 0.6);

    /** 8 - 120 m */
    public static readonly trimix1070 = new Gas(0.1, 0.7);


    public static readonly airName = 'Air';
    public static readonly oxygenName = 'Oxygen';

    /** Parse EanXX group as oxygen of nitrox (e.g. Ean50) or O2 and He fractions of trimix (e.g. 10/70) */
    private static readonly namesRegEx = /[EAN](?<fO2>\d{2})|(?<fO2b>\d{2})\/(?<fHe>\d{2})/i;

    private static readonly map = new Map([
        [StandardGases.airName, StandardGases.air],
        ['EAN32', StandardGases.ean32],
        ['EAN36', StandardGases.ean36],
        ['EAN38', StandardGases.ean38],
        ['EAN50', StandardGases.ean50],
        [StandardGases.oxygenName, StandardGases.oxygen],
        ['Helitrox 35/25', StandardGases.trimix3525],
        ['Helitrox 25/25', StandardGases.trimix2525],
        ['Helitrox 21/35', StandardGases.trimix2135],
        ['Trimix 18/45', StandardGases.trimix1845],
        ['Trimix 15/55', StandardGases.trimix1555],
        ['Trimix 12/60', StandardGases.trimix1260],
        ['Trimix 10/70', StandardGases.trimix1070],
    ]);

    /**
     * Gets names of all predefined gases with 0 % helium (nitrox) only.
     * This is subset of allNames
     */
    public static nitroxNames(): string[] {
        return StandardGases.allNames()
            .slice(0, 6);
    }

    /** Gets names of all predefined gases including both nitrox and trimix gases */
    public static allNames(): string[] {
        return Array.from(StandardGases.map.keys());
    }

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
                return StandardGases.oxygenName;
            }

            if (percentO2 === simpleO2InAir) {
                return StandardGases.airName;
            }

            return 'EAN' + percentO2.toString();
        }

        const prefix = percentO2 >= simpleO2InAir ? 'Helitrox' : 'Trimix';
        return `${prefix} ${percentO2.toString()}/${percentHe.toString()}`;
    }

    // TODO consider to make it case insensitive
    /** Case sensitive search. If nothing found returns null */
    public static byName(name: string): Gas | null {
        if (StandardGases.map.has(name)) {
            const found = StandardGases.map.get(name);
            return found ?? null;
        }

        const match = StandardGases.namesRegEx.exec(name);

        if (match) {
            if (match[1]) {
                const parsedO2 = Number(match[1]) / 100;

                if (parsedO2 > 0) {
                    return new Gas(parsedO2, 0);
                }
            }

            if (!!match[2] && !!match[3]) {
                const trimO2 = Number(match[2]) / 100;
                const trimHe = Number(match[3]) / 100;

                if (trimO2 > 0 && trimHe > 0) {
                    return new Gas(trimO2, trimHe);
                }
            }
        }

        return null;
    }
}
