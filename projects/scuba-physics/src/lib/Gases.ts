import { DepthConverter } from "./depth-converter";

export class GasesValidator {
    public validate(gases: Gases): string[] {
      const messages = [];



      return messages;
    }
}

export class Gases {
    private decoGasses: Gas[] = [];
    private bottomGasses: Gas[] = [];

    public addBottomGas(gas: Gas) {
        this.bottomGasses.push(gas);
    }

    public addDecoGas(gas: Gas) {
        this.decoGasses.push(gas);
    }

    public isRegistered(gas: Gas): Boolean {
        return this.bottomGasses.includes(gas) || this.decoGasses.includes(gas);
    }

    public bestDecoGasName(depth: number, maxppO2: number, maxEND: number, isFreshWater: boolean): Gas {
        let winner;
        for (var gasName in this.decoGasses) {
            var candidateGas = this.decoGasses[gasName];
            var mod = Math.round(candidateGas.modInMeters(maxppO2, isFreshWater));
            var end = Math.round(candidateGas.endInMeters(depth, isFreshWater));
            
            if (depth <= mod && end <= maxEND) {
                if (typeof winner == 'undefined' || //either we have no winner yet
                    winner.fO2 < candidateGas.fO2) { //or previous winner is a lower O2
                    winner = candidateGas;
                }
            }
        }
        return winner;
    }
}

export class Gas {
    public get fN2(): number {
        return 1 - this.fO2 - this.fHe;
    };

    constructor(public fO2: number, public fHe: number) {}

    public modInMeters(ppO2: number, isFreshWater: boolean): number {
        const bars = ppO2 / this.fO2;
        return DepthConverter.fromBar(bars, isFreshWater);
    };

    public endInMeters(depth: number, isFreshWater: boolean): number {
        // Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1
        var narcIndex = this.fO2 + this.fN2;
        var bars = DepthConverter.toBar(depth, isFreshWater);
        var equivalentBars = bars * narcIndex;
        return  DepthConverter.fromBar(equivalentBars, isFreshWater);
    };
}