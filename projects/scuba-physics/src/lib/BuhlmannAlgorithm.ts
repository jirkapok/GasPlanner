import { Tissues } from "./Tissues";
import { Gases, Gas } from "./Gases";
import { Segment, Segments } from "./Segments";

export class BuhlmannAlgorithm {
    private static readonly ascentSpeed = 10;
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

        const gfDiff = gfHigh-gfLow; //find variance in gradient factor
        const distanceToSurface = fromDepth;
        const gfChangePerMeter = gfDiff/distanceToSurface
        if (!maintainTissues) {
            var origTissues = JSON.stringify(this.tissues);
        }

        let ceiling = this.tissues.ceiling(gfLow, isFreshWater);

        currentGas = this.addDecoDepthChange(fromDepth, ceiling, maxppO2, maxEND, currentGas, isFreshWater);

        while (ceiling > 0) {
            var currentDepth = ceiling;
            var nextDecoDepth = (ceiling - 3);
            var time = 0;
            var gf = gfLow + (gfChangePerMeter * (distanceToSurface - ceiling));
            while (ceiling > nextDecoDepth && time <= 10000) {
                this.addFlat(currentDepth, currentGas, 1, isFreshWater);
                time++;
                ceiling = this.tissues.ceiling(gf, isFreshWater);
            }

            currentGas = this.addDecoDepthChange(currentDepth, ceiling, maxppO2, maxEND, currentGas, isFreshWater);
        }
        if (!maintainTissues) {
            this.tissues.reset(origTissues);
        }

         return Segments.mergeFlat(this.segments);
    };

    private addDecoDepthChange(fromDepth, toDepth, maxppO2, maxEND, currentGas, isFreshWater) {
        // TODO add multilevel dive where toDepth > fromDepth - since this expects ascend
        if (!currentGas) {
            currentGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
            if (!currentGas) {
                throw "Unable to find starting gas to decompress at depth " + fromDepth + "..";
            }
        }

        while (toDepth < fromDepth) { //if ceiling is higher, move our diver up.
            //ensure we're on the best gas
            let bestGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
            currentGas = Gases.switchGas(bestGas, currentGas);
            let ceiling = this.gases.nextGasSwitch(currentGas, fromDepth, toDepth, maxppO2, maxEND, isFreshWater);

            //take us to the ceiling using ascent speed
            const depthdiff = fromDepth - ceiling;
            const time = depthdiff / BuhlmannAlgorithm.ascentSpeed;
            this.addDepthChange(fromDepth, ceiling, currentGas, time, isFreshWater);
            fromDepth = ceiling; //move up from-depth
        }

        let bestGas = this.gases.bestDecoGas(fromDepth, maxppO2, maxEND, isFreshWater);
        currentGas = Gases.switchGas(bestGas, currentGas);
        return currentGas;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;
        this.gases.addBottomGas(gas);

        let ceiling = this.tissues.ceiling(gf, isFreshWater);
        // we can have already some loading, so backup the state to be able restore later
        const origTissues = JSON.stringify(this.tissues);

        let time = 0;
        let change = 1;
        while (ceiling <= 0 && change > 0) {
            change = this.addFlat(depth, gas, 1, isFreshWater);
            ceiling = this.tissues.ceiling(gf, isFreshWater);
            time++;
        }

        this.tissues = JSON.parse(origTissues);
        
        if (change == 0) {
            return Number.POSITIVE_INFINITY;
        }
        return time - 1; //We went one minute past a ceiling of "0"
    };

    public addFlat(depth: number, gas: Gas, time: number, isFreshWater: boolean): number {
        return this.addDepthChange(depth, depth, gas, time, isFreshWater);
    };

    public addDepthChange(startDepth: number, endDepth: number, gas: Gas, time: number, isFreshWater: boolean) {
        if (!this.gases.isRegistered(gas)) {
            throw "Gas must only be one of registered gasses. Please use plan.addBottomGas or plan.addDecoGas to register a gas.";
        }

        let segment = new Segment(startDepth, endDepth, gas, time)
        this.segments.push(segment);
        const loaded = this.tissues.load(startDepth, endDepth, gas.fO2, gas.fHe, time, isFreshWater);
        return loaded;
    };
}