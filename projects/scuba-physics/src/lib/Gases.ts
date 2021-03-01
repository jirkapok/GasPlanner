import { DepthConverter } from './depth-converter';
import { Event, EventsFactory } from './Profile';

/**
 * Returns list of messages if gases collection is covers all depths.
 * I.e. we need to cover all depths by breathable gas up to surface.
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

        const allGases = gases.all;
        this.validateAllDepths(allGases, options, surfacePressure, events);
        return events;
    }

    private static validateAllDepths(gases: Gas[], options: GasOptions, surfacePressure: number, events: Event[]) {
        // we don't have to check gas with ceiling to surface, because it is covered by first descent segment.
        gases.sort((a, b) => b.mod(options.maxPpO2) - a.mod(options.maxPpO2));

        for (let index = 0; index < gases.length - 1; index++) {
            if (gases.length > index) {
                const nextGas = gases[index + 1];
                const ceiling = gases[index].ceiling(surfacePressure);
                const nextMod = nextGas.mod(options.maxPpO2);
                if (nextMod < ceiling) {
                    const error = EventsFactory.createError('Gases don`t cover all depths.');
                    events.push(error);
                    break;
                }
            }
        }
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

    /** We are searching for better gas than the current */
    currentGas: Gas;
}

export class Gases {
    // TODO do we need to distinguish the gas usage?
    private decoGases: Gas[] = [];
    private bottomGases: Gas[] = [];

    private static bestGas(gases: Gas[], depthConverter: DepthConverter, options: BestGasOptions): Gas {
        const currentPressure = depthConverter.toBar(options.currentDepth);        
        let found = options.currentGas;

        gases.forEach((element, index, source) => {
            const candidate = gases[index];
            const modPressure = candidate.mod(options.maxDecoPpO2);
            // e.g. oxygen at 6m wouldn't be best for 6m without rounding
            const mod = depthConverter.toDecoStop(modPressure);
            const end = candidate.end(currentPressure);

            // TODO add test case for 10/70 only at 3 m, together with 18/35
            // TODO add warning about switch to gas with higher nitrogen content
            // TODO move maxEND exceeded to validator as warning
            // TODO add option to enforce narcotic depth in the UI
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
    
     /**
     * Finds better gas to switch to from current depth, returns current gas, if no better gas was found.
     * Better gas is breathable at current depth and with higher O2.
     */
    public bestDecoGas(depthConverter: DepthConverter,  options: BestGasOptions): Gas {
        const decoGas = Gases.bestGas(this.decoGases, depthConverter, options);
        if (decoGas !== options.currentGas) {
            return decoGas;
        }

        return Gases.bestGas(this.bottomGases, depthConverter, options);
    }

    public get all(): Gas[] {
        return this.bottomGases.concat(this.decoGases);
    }

    public get hasBottomGas(): boolean {
        return this.bottomGases.length >= 1;
    }

    public addBottomGas(gas: Gas) {
        this.bottomGases.push(gas);
    }

    public addDecoGas(gas: Gas) {
        this.decoGases.push(gas);
    }

    public isRegistered(gas: Gas): Boolean {
        return this.bottomGases.includes(gas) || this.decoGases.includes(gas);
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

        if(result > 1) {
            return 1;
        }

        return result;
    }

    /**
    * Calculates equivalent air depth for given nitrox gas mix.
    *
    * @param fO2 - Fraction of Oxygen in gas mix (0-1).
    * @param depth - Current depth in meters.
    * @returns Depth in meters.
    */
    public static ead(fO2: number, depth: number): number {
        const fN2 = 1 - fO2;
        const result = fN2 * (depth + 10) / 0.79 - 10;

        if(result < 0) {
            return 0;
        }

        return result;
    }

    /**
     * Calculates equivalent narcotic depth.
     *
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @param fN2 Fraction of nitrogen in gas mix (0-1).
     * @param depth Depth in bars.
     * @returns Depth in bars.
     */
    public static end(fO2: number, fN2: number, depth: number): number {
        // Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1
        const narcIndex = fO2 + fN2;
        return depth * narcIndex;
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
        // simplyfied untill altitude diving is implemented
        if (bars < surfacePressure) {
            return surfacePressure;
        }

        return bars;
    }
}

export class Gas {
    public get fN2(): number {
        return 1 - this.fO2 - this.fHe;
    }

    constructor(public fO2: number, public fHe: number) { }

    /**
     * Calculates maximum operation depth.
     *
     * @param ppO2 Partial pressure of oxygen.
     * @returns Depth in bars.
     */
    public mod(ppO2: number): number {
        return GasMixtures.mod(ppO2, this.fO2);
    }

    /**
     * Calculates equivalent narcotic depth.
     *
     * @param depth Depth in bars.
     * @returns Depth in bars.
     */
    public end(depth: number): number {
        return GasMixtures.end(this.fO2, this.fN2, depth);
    }

     /**
     * Calculates minimum depth at which the gas is breathe able.
     *
     * @param surfacePressure surface pressure in bars.
     * @returns Depth in bars.
     */
    public ceiling(surfacePressure: number): number {
        return GasMixtures.ceiling(this.fO2, surfacePressure);
    }

    public compositionEquals(other: Gas): boolean {
        return !!other &&
            this.fO2 === other.fO2 &&
            this.fHe === other.fHe;
    }
}

export enum StandardGas {
    Air = 21,
    EAN32 = 32,
    EAN36 = 36,
    EAN38 = 38,
    EAN50 = 50,
    OXYGEN = 100
}

export class StandardGases {
    public static gasNames(): string[] {
        return Object.keys(StandardGas)
            .filter(k => typeof StandardGas[k] === 'number') as string[];
    }
}
