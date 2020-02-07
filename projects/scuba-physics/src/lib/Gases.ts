import { DepthConverter } from "./depth-converter";

export class GasesValidator {
    public validate(gases: Gases): string[] {
        const messages = [];



        return messages;
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

    public addBottomGas(gas: Gas) {
        this.bottomGases.push(gas);
    }

    public addDecoGas(gas: Gas) {
        this.decoGases.push(gas);
    }

    public isRegistered(gas: Gas): Boolean {
        return this.bottomGases.includes(gas) || this.decoGases.includes(gas);
    }

    public bestDecoGas(depth: number, options: GasOptions): Gas {
        let decoGas = Gases.bestGas(this.decoGases, depth, options);
        if(decoGas)
            return decoGas;
        
        return Gases.bestGas(this.bottomGases, depth, options);
    }

    private static bestGas(gases: Gas[], depth: number, options: GasOptions): Gas {
        let found = null;
        for (let index in gases) {
            let candidate = gases[index];
            let mod = Math.round(candidate.mod(options.maxppO2, options.isFreshWater));
            let end = Math.round(candidate.end(depth, options.isFreshWater));

            if (depth <= mod && end <= options.maxEND) {
                if (!found || found.fO2 < candidate.fO2) {
                    found = candidate;
                }
            }
        }
        return found;
    }

    /**
     * Calculates depth of next gas switch in meters
     */
    public nextGasSwitch(currentGas: Gas, fromDepth: number, toDepth: number, options: GasOptions): number {
        let ceiling = toDepth; //ceiling is toDepth, unless there's a better gas to switch to on the way up.
        for (let nextDepth = fromDepth - 1; nextDepth >= ceiling; nextDepth--) {
            let nextDecoGas = this.bestDecoGas(nextDepth, options);
            if (Gases.canSwitch(nextDecoGas, currentGas)) {
                ceiling = nextDepth; //Only carry us up to the point where we can use this better gas.
                break;
            }
        }
        return ceiling;
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
}

export class Gas {
    public get fN2(): number {
        return 1 - this.fO2 - this.fHe;
    };

    constructor(public fO2: number, public fHe: number) { }

    /**
     * Calculates maximum operation depth.
     * 
     * @param ppO2 Partial pressure of oxygen.
     * @param isFreshWater True, if fresh water should be used.
     * @returns Depth in meters.
     */
    public mod(ppO2: number, isFreshWater: boolean): number {
        const bars = ppO2 / this.fO2;
        return DepthConverter.fromBar(bars, isFreshWater);
    };

    /**
     * Calculates equivalent narcotic depth.
     * 
     * @param depth Depth in meters.
     * @param isFreshWater True, if fresh water should be used.
     * @returns Depth in meters.
     */
    public end(depth: number, isFreshWater: boolean): number {
        // Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1
        const narcIndex = this.fO2 + this.fN2;
        const bars = DepthConverter.toBar(depth, isFreshWater);
        const equivalentBars = bars * narcIndex;
        return DepthConverter.fromBar(equivalentBars, isFreshWater);
    };
}