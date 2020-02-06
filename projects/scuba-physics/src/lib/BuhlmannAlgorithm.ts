import { Tissues } from "./Tissues";
import { Gases, Gas } from "./Gases";

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
    private gases: Gases = new Gases();

    public addBottomGas(gas: Gas) {
        this.gases.addBottomGas(gas);
    }

    public addDecoGas(gas: Gas) {
        this.gases.addDecoGas(gas);
    }

    public calculateDecompression(maintainTissues: boolean, gfLow: number, gfHigh: number,
         maxppO2: number, maxEND: number, isFreshWater: boolean, fromDepth: number = undefined) {
        maintainTissues = maintainTissues || false;
        gfLow = gfLow || 1.0;
        gfHigh = gfHigh || 1.0;
        maxppO2 = maxppO2 || 1.6;
        maxEND = maxEND || 30;
        let currentGas: Gas;

        if (typeof fromDepth == 'undefined') {
            if (this.segments.length == 0) {
                throw "No depth to decompress from has been specified, and neither have any dive stages been registered. Unable to decompress.";
            } else {
                fromDepth = this.segments[this.segments.length-1].endDepth;
                currentGas = this.segments[this.segments.length-1].gas;
            }
        } else {
            currentGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
            if (!currentGas) {
                throw "No deco gas found to decompress from provided depth " + fromDepth;
            }
        }

        var gfDiff = gfHigh-gfLow; //find variance in gradient factor
        var distanceToSurface = fromDepth;
        var gfChangePerMeter = gfDiff/distanceToSurface
        if (!maintainTissues) {
            var origTissues = JSON.stringify(this.tissues);
        }

        var ceiling = this.getCeiling(gfLow, isFreshWater);

        currentGas = this.addDecoDepthChange(fromDepth, ceiling, maxppO2, maxEND, currentGas, isFreshWater);

        while (ceiling > 0) {
            var currentDepth = ceiling;
            var nextDecoDepth = (ceiling - 3);
            var time = 0;
            var gf = gfLow + (gfChangePerMeter * (distanceToSurface - ceiling));
            while (ceiling > nextDecoDepth && time <= 10000) {
                this.addFlat(currentDepth, currentGas, 1, isFreshWater);
                time++;
                ceiling = this.getCeiling(gf, isFreshWater);
            }

            currentGas = this.addDecoDepthChange(currentDepth, ceiling, maxppO2, maxEND, currentGas, isFreshWater);
        }
        if (!maintainTissues) {
            this.tissues.reset(origTissues);
        }

         return this.collapseSegments(this.segments);
    };

    //In a single pass, collapses adjacent flat segments together.
    private collapseSegments(segments: Segment[]) {
        var collapsed = true;
        while (collapsed) {
            collapsed = false;
            for (var i = 0; i < segments.length-1; i++) {
                var segment1 = segments[i];
                var segment2 = segments[i+1];
                //if both are flat and match the same depth
                if (segment1.startDepth == segment1.endDepth &&
                    segment2.startDepth == segment2.endDepth &&
                    segment1.endDepth == segment2.startDepth &&
                    segment1.gas == segment2.gas) {

                    segment1.time = segment1.time + segment2.time;
                    segments.splice(i+1, 1); //remove segment i+1
                    collapsed = true;
                    break; //the indexes are all messed up now.

                }
            }

        }

        return segments;
    };

    private addDecoDepthChange(fromDepth, toDepth, maxppO2, maxEND, currentGas, isFreshWater) {
        if (!currentGas) {
            currentGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
            if (!currentGas) {
                throw "Unable to find starting gas to decompress at depth " + fromDepth + ". No segments provided with bottom mix, and no deco gas operational at this depth.";
            }
        }

        while (toDepth < fromDepth) { //if ceiling is higher, move our diver up.
            //ensure we're on the best gas
            var bestGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
            if (bestGas && bestGas != currentGas) {
                currentGas = bestGas;
            }

            var ceiling = toDepth; //ceiling is toDepth, unless there's a better gas to switch to on the way up.
            for (var nextDepth=fromDepth-1; nextDepth >= ceiling; nextDepth--) {
                var nextDecoGas = this.gases.bestDecoGas(nextDepth, maxppO2, maxEND, isFreshWater);
                if (nextDecoGas && nextDecoGas != currentGas) {
                    ceiling = nextDepth; //Only carry us up to the point where we can use this better gas.
                    break;
                }
            }

            //take us to the ceiling at 30fpm or 10 mpm (the fastest ascent rate possible.)
            var depthdiff = fromDepth - ceiling;
            var time = depthdiff/10;
            this.addDepthChange(fromDepth, ceiling, currentGas, time, isFreshWater);
            fromDepth = ceiling; //move up from-depth
        }

        var bestGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
        if (bestGas && bestGas != currentGas) {
            currentGas = bestGas;
        }

        return currentGas;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;
        this.gases.addBottomGas(gas);

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

    public addFlat(depth: number, gas: Gas, time: number, isFreshWater: boolean): number {
        return this.addDepthChange(depth, depth, gas, time, isFreshWater);
    };

    public addDepthChange(startDepth: number, endDepth: number, gas: Gas, time: number, isFreshWater: boolean) {
        if (!this.gases.isRegistered(gas)) {
            throw "Gas must only be one of registered gasses. Please use plan.addBottomGas or plan.addDecoGas to register a gas.";
        }
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