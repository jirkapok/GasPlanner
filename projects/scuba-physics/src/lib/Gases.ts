import { DepthConverter } from './depth-converter';
import { AltitudePressure } from './pressure-converter';

/**
 * Returns list of messages if gases collection is incomplete to realize dive for required depth.
 * I.e. we need to cover all depths by breathable gas up to surface.
 * Deco gases are prefered for decompression, they don't have to be better.
 */
export class GasesValidator {
    public static validate(gases: Gases, options: GasOptions,
        depthConverter: DepthConverter, maxDepth: number): string[] {
        const messages = [];

        if (!gases.hasBottomGas) {
            messages.push('At least one bottom gas as to be defined.');
            return messages;
        }

        const allGases = gases.all;
        this.validateByMod(allGases, options, maxDepth, depthConverter, messages);

        allGases.sort((a, b) => a.ceiling(depthConverter) - b.ceiling(depthConverter));
        if (allGases[0].ceiling(depthConverter) > 0) {
            messages.push('No gas available to surface.');
        }

        return messages;
    }

    private static validateByMod(gases: Gas[], options: GasOptions, maxDepth: number, depthConverter: DepthConverter, messages: string[]) {
        gases.sort((a, b) => b.mod(options.maxppO2, depthConverter) - a.mod(options.maxppO2, depthConverter));

        if (gases[0].mod(options.maxppO2, depthConverter) < maxDepth) {
            messages.push('No gas available to maximum depth.');
        }

        for (let index = 0; index < gases.length - 1; index++) {
            if (gases.length > index) {
                const nextGas = gases[index + 1];
                const ceiling = gases[index].ceiling(depthConverter);
                const nextMod = nextGas.mod(options.maxppO2, depthConverter);
                if (nextMod < ceiling) {
                    messages.push('Gases don`t cover all depths.');
                    break;
                }
            }
        }
    }
}

export interface GasOptions {
    maxppO2: number;
    maxEND: number;
    isFreshWater: boolean;
}

export class Gases {
    private decoGases: Gas[] = [];
    private bottomGases: Gas[] = [];

    public get all(): Gas[] {
        return this.bottomGases.concat(this.decoGases);
    }

    public get hasBottomGas(): boolean {
        return this.bottomGases.length >= 1;
    }

    private static bestGas(gases: Gas[], depth: number, options: GasOptions, depthConverter: DepthConverter): Gas {
        let found = null;
        gases.forEach((element, index, source) => {
            const candidate = gases[index];
            const mod = Math.round(candidate.mod(options.maxppO2, depthConverter));
            const end = Math.round(candidate.end(depth, depthConverter));

            if (depth <= mod && end <= options.maxEND) {
                if (!found || found.fO2 < candidate.fO2) {
                    found = candidate;
                }
            }
        });
        return found;
    }

    public static switchGas(newGas: Gas, current: Gas): Gas {
        if (Gases.canSwitch(newGas, current)) {
            return newGas;
        }

        return current;
    }

    public static canSwitch(newGas: Gas, current: Gas): boolean {
        return newGas && newGas !== current;
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

    public bestDecoGas(depth: number, options: GasOptions, depthConverter: DepthConverter): Gas {
        const decoGas = Gases.bestGas(this.decoGases, depth, options, depthConverter);
        if (decoGas) {
            return decoGas;
        }

        return Gases.bestGas(this.bottomGases, depth, options, depthConverter);
    }

    /**
     * Calculates depth of next gas switch in meters
     */
    public nextGasSwitch(currentGas: Gas, fromDepth: number, toDepth: number, options: GasOptions, depthConverter: DepthConverter): number {
        let ceiling = toDepth; // ceiling is toDepth, unless there's a better gas to switch to on the way up.
        for (let nextDepth = fromDepth - 1; nextDepth >= ceiling; nextDepth--) {
            const nextDecoGas = this.bestDecoGas(nextDepth, options, depthConverter);
            if (Gases.canSwitch(nextDecoGas, currentGas)) {
                ceiling = nextDepth; // Only carry us up to the point where we can use this better gas.
                break;
            }
        }
        return ceiling;
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
     * @param depthConverter Converter used to translate the pressure.
     * @returns Depth in meters.
     */
    public static mod(ppO2: number, fO2: number, depthConverter: DepthConverter): number {
        const bars = ppO2 / fO2;
        return depthConverter.fromBar(bars);
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
        return pO2 / bar;
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
        return fN2 * (depth + 10) / 0.79 - 10;
    }

    /**
     * Calculates equivalent narcotic depth.
     *
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @param fN2 Fraction of nytrogen in gas mix (0-1).
     * @param depth Depth in meters.
     * @param depthConverter Converter used to translate the pressure.
     * @returns Depth in meters.
     */
    public static end(fO2: number, fN2: number, depth: number, depthConverter: DepthConverter): number {
        // Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1
        const narcIndex = fO2 + fN2;
        const bars = depthConverter.toBar(depth);
        const equivalentBars = bars * narcIndex;
        return depthConverter.fromBar(equivalentBars);
    }

    /**
     * Calculates minimum depth at which the gas is breathe able.
     *
     * @param fO2 Fraction of oxygen in gas mix (0-1).
     * @param depthConverter Converter used to translate the pressure.
     * @returns Depth in meters.
     */
    public static ceiling(fO2: number, depthConverter: DepthConverter): number {
        const minppO2 = 0.18;
        const ratio = minppO2 / fO2;
        const bars = ratio * depthConverter.surfacePressure;

        // hyperoxic gases have pressure bellow sea level, which cant be converted to depth
        // simplyfied untill altitude diving is implemented
        if (bars < depthConverter.surfacePressure) {
            return 0;
        }

        const depth = depthConverter.fromBar(bars);
        return depth;
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
     * @param depthConverter Converter used to translate the pressure.
     * @returns Depth in meters.
     */
    public mod(ppO2: number, depthConverter: DepthConverter): number {
        return GasMixtures.mod(ppO2, this.fO2, depthConverter);
    }

    /**
     * Calculates equivalent narcotic depth.
     *
     * @param depth Depth in meters.
     * @param depthConverter Converter used to translate the pressure.
     * @returns Depth in meters.
     */
    public end(depth: number, depthConverter: DepthConverter): number {
        return GasMixtures.end(this.fO2, this.fN2, depth, depthConverter);
    }

    public ceiling(depthConverter: DepthConverter): number {
        return GasMixtures.ceiling(this.fO2, depthConverter);
    }

    public compositionEquals(other: Gas): boolean {
        return !!other &&
          other.fO2 === this.fO2 &&
          other.fHe === this.fHe;
    }
}
