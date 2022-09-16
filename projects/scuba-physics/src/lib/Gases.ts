import { Precision } from './precision';
import { DepthConverter } from './depth-converter';
import { DepthLevels } from './DepthLevels';
import { Event, EventsFactory } from './Profile';
import { Tank } from './Tanks';

/**
 * The only issue with gases is, that there is no gas.
 * If the depths aren't covered by gases, than the last selected gas is used, even it results in other events.
 * Deco gases are preferred for decompression, they don't have to be better.
 */
export class GasesValidator {
    /**
     * @param gases not null list of gases to validate
     * @param surfacePressure surfaces pressure in bars
     */
    public static validate(gases: Gases, options: GasOptions, surfacePressure: number): Event[] {
        const events: Event[] = [];

        if (!gases.hasBottomGas) {
            const event: Event = EventsFactory.createError('At least one bottom gas has to be defined.');
            events.push(event);
            return events;
        }

        return events;
    }
}

export interface GasOptions {
    maxPpO2: number;
    maxDecoPpO2: number;
    /** Maximum narcotic depth in meters */
    maxEND: number;
}

export interface BestGasOptions {
    /** depth in meters */
    currentDepth: number;

    maxDecoPpO2: number;

    /** Maximum narcotic depth in bars */
    maxEndPressure: number;

    /** True, if oxygen fraction should be considered narcotic, otherwise false */
    oxygenNarcotic: boolean;

    /** We are searching for better gas than the current */
    currentGas: Gas;
}

export class Gases {
    private bottomGases: Gas[] = [];

    public get all(): Gas[] {
        return this.bottomGases.slice();
    }

    public get hasBottomGas(): boolean {
        return this.bottomGases.length >= 1;
    }

    public static fromTanks(tanks: Tank[]): Gases {
        const gases = new Gases();

        // everything except first gas is considered as deco gas
        tanks.forEach((tank) => {
            gases.add(tank.gas);
        });

        return gases;
    }

    /**
    * Finds better gas to switch to from current depth. Returns current gas, if no better gas was found.
    * Better gas is breathable at current depth and with higher O2, because during decompression we need to offgass both He and N2.
    * Use this method to find decompression gas during ascent.
    */
    public bestGas(depthLevels: DepthLevels, depthConverter: DepthConverter, options: BestGasOptions): Gas {
        const currentPressure = depthConverter.toBar(options.currentDepth);
        let found = options.currentGas;

        this.bottomGases.forEach((element, index) => {
            const candidate = this.bottomGases[index];
            const modPressure = candidate.mod(options.maxDecoPpO2);
            // e.g. oxygen at 6m wouldn't be best for 6m without rounding
            const mod = depthLevels.toDecoStop(modPressure);
            const end = candidate.end(currentPressure, options.oxygenNarcotic);

            // We allow switch to gas with higher nitrogen content, if no better gas is available, but at least show warning
            if (options.currentDepth <= mod && end <= options.maxEndPressure) {
                // We don't care about gas ceiling, because it is covered by higher O2 content
                // only oxygen content is relevant for decompression => EAN50 is better than TRIMIX 25/25
                if (!found || found.fO2 < candidate.fO2) {
                    found = candidate;
                }
            }
        });
        return found;
    }

    public add(gas: Gas): void {
        this.bottomGases.push(gas);
    }

    public isRegistered(gas: Gas): boolean {
        return this.bottomGases.includes(gas);
    }
}

export class GasMixtures {
    /**
     * Calculates the partial pressure of a gas component from the volume gas fraction and total pressure.
     *
     * @param absPressure - The total pressure P in bars (typically 1 bar of atmospheric pressure + x bars of water pressure).
     * @param volumeFraction - The volume fraction of gas component (typically 0.79 for 79%) measured as percentage in decimal.
     * @returns The partial pressure of gas component in bar absolute.
     */
    public static partialPressure(absPressure: number, volumeFraction: number): number {
        return absPressure * volumeFraction;
    }

    /**
     * Calculates Maximum operation depth for given mix.
     *
     * @param ppO2 - Partial pressure constant.
     * @param fO2 - Fraction of Oxygen in gas.
     * @returns Depth in bars.
     */
    public static mod(ppO2: number, fO2: number): number {
        const bars = ppO2 / fO2;
        return bars;
    }

    /**
     * Calculates best mix of nitrox gas for given depth.
     *
     * @param pO2 - Partial pressure constant.
     * @param depth - Current depth in meters.
     * @param depthConverter Converter used to translate the pressure.
     * @returns Fraction of oxygen in required gas (0-1).
     */
    public static bestMix(pO2: number, depth: number, depthConverter: DepthConverter): number {
        const bar = depthConverter.toBar(depth);
        const result = pO2 / bar;

        if (result > 1) {
            return 1;
        }

        return result;
    }

    /**
    * Calculates equivalent air depth for given nitrox gas mix.
    * https://en.wikipedia.org/wiki/Equivalent_air_depth
    *
    * @param fO2 - Fraction of Oxygen in gas mix (0-1).
    * @param depth - Current depth in bars.
    * @returns Depth in bars.
    */
    public static ead(fO2: number, depth: number): number {
        const fN2 = 1 - fO2; // here we are interested only in nitrogen toxicity
        const result = GasMixtures.end(depth, fN2) / StandardGases.nitroxInAir;
        return result;
    }

    /**
     * Calculates equivalent narcotic depth as the depth which would produce the same narcotic effect when breathing air.
     * Define which gas (nitrogen or oxygen) is narcotic by setting is part to 0.
     * https://en.wikipedia.org/wiki/Equivalent_narcotic_depth
     * See also MND.
     *
     * @param currentDepth Current depth in bars for which you want to calculate the end.
     * @param fN2 Fraction of nitrogen in gas mix (0-1).
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @returns Depth in bars.
     */
    public static end(currentDepth: number, fN2: number, fO2: number = 0): number {
        const narcIndex = this.narcoticIndex(fO2, fN2);
        return currentDepth * narcIndex;
    }

    /**
     * Calculates maximum depth, at which the narcotic effect corresponds to the given narcotic depth.
     * Define which gas (nitrogen or oxygen) is narcotic by setting is part to 0.
     * Also called maximum narcotic depth.
     * Sea also END.
     *
     * @param narcoticDepth END in bars for which you want to calculate the mnd.
     * @param fN2 Fraction of nitrogen in gas mix (0-1).
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @returns Depth in bars.
     */
    public static mnd(narcoticDepth: number, fN2: number, fO2: number = 0): number {
        const narcIndex = this.narcoticIndex(fO2, fN2);
        return narcoticDepth / narcIndex;
    }

    /**
    * Calculates minimum depth at which the gas is breathe able.
    *
    * @param fO2 Fraction of oxygen in gas mix (0-1).
    * @param surfacePressure surface pressure in bars.
    * @returns Depth in bars.
    */
    public static ceiling(fO2: number, surfacePressure: number): number {
        const minppO2 = 0.18;
        const ratio = minppO2 / fO2;
        const bars = ratio * surfacePressure;

        // hyperoxic gases have pressure bellow sea level, which cant be converted to depth
        if (bars < surfacePressure) {
            return surfacePressure;
        }

        return bars;
    }

    /** Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1 */
    private static narcoticIndex(fN2: number, fO2: number = 0): number {
        return fO2 + fN2;
    }
}

export class Gas {
    /**
     * @param _fO2 partial pressure of O2 in the mix, range 0-1
     * @param _fHe partial pressure of He in the mix, range 0-1
     */
    constructor(private _fO2: number, private _fHe: number) {
        if (this.contentExceeds100percent()) {
            throw new Error('O2 + He can\'t exceed 100 %');
        }
    }

    public get fN2(): number {
        return 1 - this._fO2 - this._fHe;
    }

    public get fO2(): number {
        return this._fO2;
    }

    public get fHe(): number {
        return this._fHe;
    }

    public set fO2(newValue: number) {
        this._fO2 = newValue > 1 ? 1 : newValue;

        if (this.contentExceeds100percent()) {
            this._fHe = this.countRemaining(this._fO2);
        }
    }

    public set fHe(newValue: number) {
        this._fHe = newValue > 0.99 ? 0.99 : newValue;

        if (this.contentExceeds100percent()) {
            this._fO2 = this.countRemaining(this._fHe);
        }
    }

    public copy(): Gas {
        return new Gas(this._fO2, this._fHe);
    }

    /**
     * Calculates maximum operation depth.
     *
     * @param ppO2 Partial pressure of oxygen.
     * @returns Depth in bars.
     */
    public mod(ppO2: number): number {
        return GasMixtures.mod(ppO2, this._fO2);
    }

    /**
     * Calculates equivalent narcotic depth as the depth which would produce the same narcotic effect when breathing air.
     *
     * @param currentDepth Current depth in bars for which you want to calculate the end.
     * @param oxygenNarcotic True, if oxygen is considered narcotic, otherwise false.
     * @returns Depth in bars.
     */
    public end(currentDepth: number, oxygenNarcotic: boolean): number {
        const fO2 = oxygenNarcotic ? this._fO2 : 0;
        return GasMixtures.end(currentDepth, this.fN2, fO2);
    }

    /**
     * Calculates maximum depth, at which the narcotic effect corresponds to the given narcotic depth.
     *
     * @param narcoticDepth END in bars for which you want to calculate the mnd.
     * @param oxygenNarcotic True, if oxygen is considered narcotic, otherwise false.
     * @returns Depth in bars.
     */
    public mnd(narcoticDepth: number, oxygenNarcotic: boolean): number {
        const fO2 = oxygenNarcotic ? this._fO2 : 0;
        return GasMixtures.mnd(narcoticDepth, this.fN2, fO2);
    }

    /**
    * Calculates minimum depth at which the gas is breathe able.
    *
    * @param surfacePressure surface pressure in bars.
    * @returns Depth in bars.
    */
    public ceiling(surfacePressure: number): number {
        return GasMixtures.ceiling(this._fO2, surfacePressure);
    }

    public compositionEquals(other: Gas): boolean {
        return !!other &&
            this._fO2 === other._fO2 &&
            this._fHe === other._fHe;
    }

    /** Unique identifier of content */
    public contentCode(): number {
        const fourK = 10000;
        // considered identical gas rounding on two decimal places
        return Precision.round(this._fO2 * fourK * fourK) +
            Precision.round(this._fHe * fourK);
    }

    private contentExceeds100percent(): boolean {
        return this._fO2 + this._fHe > 1;
    }

    private countRemaining(part: number): number {
        const rest = 1 - part;
        return Precision.round(rest, 5);
    }
}

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


    private static readonly airName = 'Air';
    private static readonly oxygenName = 'Oxygen';

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
