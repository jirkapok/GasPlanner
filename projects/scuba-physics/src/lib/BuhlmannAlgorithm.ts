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

export class BuhlmannAlgorithm {
    private tissues = new Tissues();
    private depthConverter: DepthConverter;

    public calculateDecompression(options: Options, gases: Gases, segments: Segments, fromDepth?: number) {
        let currentGas: Gas;
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

        this.loadTissues(segments, options.isFreshWater);

        const gfDiff = options.gfHigh - options.gfLow; // find variance in gradient factor
        const distanceToSurface = fromDepth;
        const gfChangePerMeter = gfDiff / distanceToSurface;
        let origTissues = '';

        if (!options.maintainTissues) {
            origTissues = JSON.stringify(this.tissues);
        }

        let ceiling = this.tissues.ceiling(options.gfLow, this.depthConverter);

        currentGas = this.addDecoDepthChange(gases, segments, fromDepth, ceiling, currentGas, options);

        while (ceiling > 0) {
            const currentDepth = ceiling;
            const nextDecoDepth = (ceiling - Tissues.decoStopDistance);
            let time = 0;
            const gf = options.gfLow + (gfChangePerMeter * (distanceToSurface - ceiling));
            while (ceiling > nextDecoDepth && time <= 10000) {
                this.addFlat(segments, currentDepth, currentGas, 1);
                time++;
                ceiling = this.tissues.ceiling(gf, this.depthConverter);
            }

            currentGas = this.addDecoDepthChange(gases, segments, currentDepth, ceiling, currentGas, options);
        }
        if (!options.maintainTissues) {
            this.tissues.reset(origTissues);
        }

         return segments.mergeFlat();
    }

    private selectDepthConverter(isFreshWater: boolean): DepthConverter {
        if (isFreshWater) {
          return DepthConverter.forFreshWater();
        }

        return DepthConverter.forSaltWater();
    }

    private loadTissues(segments: Segments, isFreshWater: boolean) {
        segments.foreach(segment => {
            const gas = segment.gas;
            this.tissues.load(segment.startDepth, segment.endDepth, gas, segment.time, this.depthConverter);
        });
    }

    private addDecoDepthChange(gases: Gases, segments: Segments,
            fromDepth: number, toDepth: number, currentGas: Gas, options: Options) {
        // TODO add multilevel dive where toDepth > fromDepth - since this expects ascend
        if (!currentGas) {
            currentGas = gases.bestDecoGas(fromDepth, options, this.depthConverter);
            if (!currentGas) {
                throw new Error('Unable to find starting gas to decompress at depth ' + fromDepth + '..');
            }
        }

        while (toDepth < fromDepth) { // if ceiling is higher, move our diver up.
            // ensure we're on the best gas
            const bestGas = gases.bestDecoGas(fromDepth, options, this.depthConverter);
            currentGas = Gases.switchGas(bestGas, currentGas);
            const ceiling = gases.nextGasSwitch(currentGas, fromDepth, toDepth, options, this.depthConverter);

            // take us to the ceiling using ascent speed
            const depthdiff = fromDepth - ceiling;
            const time = depthdiff / options.ascentSpeed;
            this.addDepthChange(segments, fromDepth, ceiling, currentGas, time);
            fromDepth = ceiling; // move up from-depth
        }

        const bestGas = gases.bestDecoGas(fromDepth, options, this.depthConverter);
        currentGas = Gases.switchGas(bestGas, currentGas);
        return currentGas;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;
        this.depthConverter = this.selectDepthConverter(isFreshWater);
        const gases = new Gases();
        gases.addBottomGas(gas);
        const segments = new Segments();

        let ceiling = this.tissues.ceiling(gf, this.depthConverter);
        // we can have already some loading, so backup the state to be able restore later
        const origTissues = JSON.stringify(this.tissues);

        let time = 0;
        let change = 1;
        while (ceiling <= 0 && change > 0) {
            change = this.addFlat(segments, depth, gas, 1);
            ceiling = this.tissues.ceiling(gf, this.depthConverter);
            time++;
        }

        this.tissues = JSON.parse(origTissues);

        if (change === 0) {
            return Number.POSITIVE_INFINITY;
        }
        return time - 1; // We went one minute past a ceiling of "0"
    }

    private addFlat(segments: Segments, depth: number, gas: Gas, time: number): number {
        return this.addDepthChange(segments, depth, depth, gas, time);
    }

    private addDepthChange(segments: Segments, startDepth: number, endDepth: number, gas: Gas, time: number) {
        segments.add(startDepth, endDepth, gas, time);
        const loaded = this.tissues.load(startDepth, endDepth, gas, time, this.depthConverter);
        return loaded;
    }
}
