import { Tissues } from "./Tissues";

export class Gas {
    constructor(public fO2: number, public fHe: number) {}
}

class Segment {
    constructor (
        public startDepth: number, 
        public endDepth: number, 
        public gas: Gas, 
        public time: number) {}
}

export class BuhlmannAlgorithm {
    private tissues = new Tissues();
    private segments: Segment[] = [];

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;

        var ceiling = this.getCeiling(gf, isFreshWater);
        // we can have already some loading, so backup the state to be able restore later
        var origTissues = JSON.stringify(this.tissues);

        var time = 0;
        var change = 1;
        while (ceiling <= 0 && change > 0) {
            change = this.addFlat(depth, gas, 1, isFreshWater);
            ceiling = this.getCeiling(gf, isFreshWater);
            time++;
        }

        this.tissues = JSON.parse(origTissues);
        
        if (change == 0) {
            console.log("NDL is practically infinity. Returning largest number we know of.");
            return Number.POSITIVE_INFINITY;
        }
        return time - 1; //We went one minute past a ceiling of "0"
    };

    private getCeiling(gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0
        var ceiling = 0;
        for (var index = 0; index < this.tissues.compartments.length; index++) {
            var tissueCeiling = this.tissues.compartments[index].calculateCeiling(gf, isFreshWater);
            if (!ceiling || tissueCeiling > ceiling) {
                ceiling = tissueCeiling;
            }
        }
        while (ceiling % 3 != 0) {
            ceiling++;
        }
        return ceiling;
    };

    private addFlat(depth: number, gas: Gas, time: number, isFreshWater): number {
        return this.addDepthChange(depth, depth, gas, time, isFreshWater);
    };

    private addDepthChange(startDepth: number, endDepth: number, gas: Gas, time: number, isFreshWater: boolean) {
        var fO2 = gas.fO2;
        var fHe = gas.fHe;

        //store this as a stage
        let segment = new Segment(startDepth, endDepth, gas, time)
        this.segments.push(segment);

        var loadChange = 0.0;
        for (var index = 0; index < this.tissues.length; index++) {
            var tissueChange = this.tissues.compartments[index].addDepthChange(startDepth, endDepth, fO2, fHe, time, isFreshWater);
            loadChange = loadChange + tissueChange;
        }
        return loadChange;
    };
}