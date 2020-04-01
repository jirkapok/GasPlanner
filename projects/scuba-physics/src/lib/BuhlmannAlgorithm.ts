import { Tissues } from './Tissues';
import { Gases, Gas, GasOptions } from './Gases';
import { Segments } from './Segments';
import { DepthConverter } from './depth-converter';

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

class AlgorithmContext {
    public tissues = new Tissues();

    // TODO reuse tissues for repetitive dives
    constructor(public gases: Gases, public segments: Segments) {}
}

export class BuhlmannAlgorithm {
    private depthConverter: DepthConverter;

    public calculateDecompression(options: Options, gases: Gases, segments: Segments, fromDepth?: number) {
        let currentGas: Gas;
        const context = new AlgorithmContext(gases, segments);
        this.depthConverter = this.selectDepthConverter(options.isFreshWater);

        if (typeof fromDepth === 'undefined') {
            if (!segments.any()) {
                throw new Error('No depth to decompress from has been specified, and neither have any dive stages been registered. Unable to decompress.');
            } else {
                const last = segments.last();
                fromDepth = last.endDepth;
                currentGas = last.gas;
            }
        } else {
            currentGas = gases.bestDecoGas(fromDepth, options, this.depthConverter);
            if (!currentGas) {
                throw new Error('No deco gas found to decompress from provided depth ' + fromDepth);
            }
        }

        this.initializeTissues(segments, context.tissues);

        const gfDiff = options.gfHigh - options.gfLow; // find variance in gradient factor
        const gfChangePerMeter = gfDiff / fromDepth;
        let ceiling = context.tissues.ceiling(options.gfLow, this.depthConverter);
        currentGas = this.addDecoDepthChange(context, fromDepth, ceiling, currentGas, options);

        while (ceiling > 0) {
            const currentDepth = ceiling;
            const nextDecoDepth = (ceiling - Tissues.decoStopDistance);
            let time = 0;
            const gf = options.gfLow + (gfChangePerMeter * (fromDepth - ceiling));
            while (ceiling > nextDecoDepth && time <= 10000) {
                this.load(context, currentDepth, currentGas, 1);
                time++;
                ceiling = context.tissues.ceiling(gf, this.depthConverter);
            }

            currentGas = this.addDecoDepthChange(context, currentDepth, ceiling, currentGas, options);
        }

        return segments.mergeFlat();
    }

    private selectDepthConverter(isFreshWater: boolean): DepthConverter {
        if (isFreshWater) {
          return DepthConverter.forFreshWater();
        }

        return DepthConverter.forSaltWater();
    }

    private initializeTissues(segments: Segments, tissues: Tissues) {
        segments.foreach(segment => {
            const gas = segment.gas;
            tissues.load(segment, gas, this.depthConverter);
        });
    }

    private addDecoDepthChange(context: AlgorithmContext, fromDepth: number, toDepth: number, currentGas: Gas, options: Options) {
        // TODO add multilevel dive where toDepth > fromDepth - since this expects ascend
        if (!currentGas) {
            currentGas = context.gases.bestDecoGas(fromDepth, options, this.depthConverter);
            if (!currentGas) {
                throw new Error('Unable to find starting gas to decompress at depth ' + fromDepth + '..');
            }
        }

        while (toDepth < fromDepth) { // if ceiling is higher, move our diver up.
            // ensure we're on the best gas
            const bestGas = context.gases.bestDecoGas(fromDepth, options, this.depthConverter);
            currentGas = Gases.switchGas(bestGas, currentGas);
            const ceiling = context.gases.nextGasSwitch(currentGas, fromDepth, toDepth, options, this.depthConverter);

            // take us to the ceiling using ascent speed
            const depthdiff = fromDepth - ceiling;
            const time = depthdiff / options.ascentSpeed;
            this.loadChange(context, fromDepth, ceiling, currentGas, time);
            fromDepth = ceiling; // move up from-depth
        }

        const bestGas = context.gases.bestDecoGas(fromDepth, options, this.depthConverter);
        currentGas = Gases.switchGas(bestGas, currentGas);
        return currentGas;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;
        this.depthConverter = this.selectDepthConverter(isFreshWater);
        const gases = new Gases();
        gases.addBottomGas(gas);
        const segments = new Segments();
        const context = new AlgorithmContext(gases, segments);

        let ceiling = context.tissues.ceiling(gf, this.depthConverter);

        let time = 0;
        let change = 1;
        while (ceiling <= 0 && change > 0) {
            change = this.load(context, depth, gas, 1);
            ceiling = context.tissues.ceiling(gf, this.depthConverter);
            time++;
        }

        if (change === 0) {
            return Number.POSITIVE_INFINITY;
        }
        return time - 1; // We went one minute past a ceiling of "0"
    }

    private load(context: AlgorithmContext, depth: number, gas: Gas, time: number): number {
        return this.loadChange(context, depth, depth, gas, time);
    }

    private loadChange(context: AlgorithmContext, startDepth: number, endDepth: number, gas: Gas, time: number): number {
        const added = context.segments.add(startDepth, endDepth, gas, time);
        const loaded = context.tissues.load(added, gas, this.depthConverter);
        return loaded;
    }
}
