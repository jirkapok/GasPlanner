import { DepthConverter } from "./depth-converter";

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
        //console.log("Finding best deco gas for depth " + depth + " with max ppO2 of " + maxppO2 + "  and max END of " + maxEND);
        //best gas is defined as: a ppO2 at depth <= maxppO2,
        // the highest ppO2 among all of these.
        // END <= 30 (equivalent narcotic depth < 30 meters)
        var winner;
        for (var gasName in this.decoGasses) {
            var candidateGas = this.decoGasses[gasName];
            var mod = Math.round(candidateGas.modInMeters(maxppO2, isFreshWater));
            var end = Math.round(candidateGas.endInMeters(depth, isFreshWater));
            //console.log("Found candidate deco gas " + gasName + ": " + (candidateGas.fO2) + "/" + (candidateGas.fHe) + " with mod " + mod + " and END " + end);
            if (depth <= mod && end <= maxEND) {
                //console.log("Candidate " + gasName + " fits within MOD and END limits.");
                if (typeof winner == 'undefined' || //either we have no winner yet
                    winner.fO2 < candidateGas.fO2) { //or previous winner is a lower O2
                    //console.log("Replaced winner: " + candidateGas);
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

    public modInMeters(ppO2: number, isFreshWater: boolean) {
        return DepthConverter.fromBar(ppO2 / this.fO2, isFreshWater);
    };

    public endInMeters(depth: number, isFreshWater: boolean) {

        // Helium has a narc factor of 0 while N2 and O2 have a narc factor of 1
        var narcIndex = (this.fO2) + (this.fN2);

        var bars = DepthConverter.toBar(depth, isFreshWater);
        var equivalentBars = bars * narcIndex;
        //console.log("Depth: " + depth + " Bars:" + bars + "Relation: " + narcIndex + " Equivalent Bars:" +equivalentBars);
        return  DepthConverter.fromBar(equivalentBars, isFreshWater);
    };
}