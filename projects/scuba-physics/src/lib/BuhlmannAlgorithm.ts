import { Tissues } from './Tissues';
import { Gases, Gas, GasOptions } from './Gases';
import { Segment, Segments } from './Segments';

export class Options implements GasOptions {
    private _ascentSpeed: number;

    public get ascentSpeed(): number {
        return this._ascentSpeed;
    }
    constructor(
        public maintainTissues: boolean,
        public gfLow: number,
        public gfHigh: number,
        public maxppO2: number,
        public maxEND: number,
        public isFreshWater: boolean,
        ascentSpeed?: number
    ) {
        maintainTissues = maintainTissues || false;
        gfLow = gfLow || 1.0;
        gfHigh = gfHigh || 1.0;
        maxppO2 = maxppO2 || 1.6;
        maxEND = maxEND || 30;
        isFreshWater = isFreshWater || false;
        this._ascentSpeed = ascentSpeed || 10;
    }
}

export class BuhlmannAlgorithm {
    private tissues = new Tissues();
    private segments: Segment[] = [];

    public calculateDecompression(options: Options, gases: Gases, fromDepth?: number) {
        let currentGas: Gas;

        if (typeof fromDepth === 'undefined') {
            if (this.segments.length === 0) {
                throw new Error('No depth to decompress from has been specified, and neither have any dive stages been registered. Unable to decompress.');
            } else {
                fromDepth = this.segments[this.segments.length - 1].endDepth;
                currentGas = this.segments[this.segments.length - 1].gas;
            }
        } else {
            currentGas = gases.bestDecoGas(fromDepth, options);
            if (!currentGas) {
                throw new Error('No deco gas found to decompress from provided depth ' + fromDepth);
            }
        }

        const gfDiff = options.gfHigh - options.gfLow; // find variance in gradient factor
        const distanceToSurface = fromDepth;
        const gfChangePerMeter = gfDiff / distanceToSurface;
        let origTissues = '';

        if (!options.maintainTissues) {
            origTissues = JSON.stringify(this.tissues);
        }

        let ceiling = this.tissues.ceiling(options.gfLow, options.isFreshWater);

        currentGas = this.addDecoDepthChange(gases, fromDepth, ceiling, currentGas, options);

        while (ceiling > 0) {
            const currentDepth = ceiling;
            const nextDecoDepth = (ceiling - Tissues.decoStopDistance);
            let time = 0;
            const gf = options.gfLow + (gfChangePerMeter * (distanceToSurface - ceiling));
            while (ceiling > nextDecoDepth && time <= 10000) {
                this.addFlat(gases, currentDepth, currentGas, 1, options.isFreshWater);
                time++;
                ceiling = this.tissues.ceiling(gf, options.isFreshWater);
            }

            currentGas = this.addDecoDepthChange(gases, currentDepth, ceiling, currentGas, options);
        }
        if (!options.maintainTissues) {
            this.tissues.reset(origTissues);
        }

         return Segments.mergeFlat(this.segments);
    }

    private addDecoDepthChange(gases: Gases, fromDepth: number, toDepth: number, currentGas: Gas, options: Options) {
        // TODO add multilevel dive where toDepth > fromDepth - since this expects ascend
        if (!currentGas) {
            currentGas = gases.bestDecoGas(fromDepth, options);
            if (!currentGas) {
                throw new Error('Unable to find starting gas to decompress at depth ' + fromDepth + '..');
            }
        }

        while (toDepth < fromDepth) { // if ceiling is higher, move our diver up.
            // ensure we're on the best gas
            const bestGas = gases.bestDecoGas(fromDepth, options);
            currentGas = Gases.switchGas(bestGas, currentGas);
            const ceiling = gases.nextGasSwitch(currentGas, fromDepth, toDepth, options);

            // take us to the ceiling using ascent speed
            const depthdiff = fromDepth - ceiling;
            const time = depthdiff / options.ascentSpeed;
            this.addDepthChange(gases, fromDepth, ceiling, currentGas, time, options.isFreshWater);
            fromDepth = ceiling; // move up from-depth
        }

        const bestGas = gases.bestDecoGas(fromDepth, options);
        currentGas = Gases.switchGas(bestGas, currentGas);
        return currentGas;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;
        const gases = new Gases();
        gases.addBottomGas(gas);

        let ceiling = this.tissues.ceiling(gf, isFreshWater);
        // we can have already some loading, so backup the state to be able restore later
        const origTissues = JSON.stringify(this.tissues);

        let time = 0;
        let change = 1;
        while (ceiling <= 0 && change > 0) {
            change = this.addFlat(gases, depth, gas, 1, isFreshWater);
            ceiling = this.tissues.ceiling(gf, isFreshWater);
            time++;
        }

        this.tissues = JSON.parse(origTissues);

        if (change === 0) {
            return Number.POSITIVE_INFINITY;
        }
        return time - 1; // We went one minute past a ceiling of "0"
    }

    public addFlat(gases: Gases, depth: number, gas: Gas, time: number, isFreshWater: boolean): number {
        return this.addDepthChange(gases, depth, depth, gas, time, isFreshWater);
    }

    public addDepthChange(gases: Gases, startDepth: number, endDepth: number, gas: Gas, time: number, isFreshWater: boolean) {
        if (!gases.isRegistered(gas)) {
            throw new Error('Gas must only be one of registered gases. Please use plan.addBottomGas or plan.addDecoGas to register a gas.');
        }

        const segment = new Segment(startDepth, endDepth, gas, time);
        this.segments.push(segment);
        const loaded = this.tissues.load(startDepth, endDepth, gas.fO2, gas.fHe, time, isFreshWater);
        return loaded;
    }
}
