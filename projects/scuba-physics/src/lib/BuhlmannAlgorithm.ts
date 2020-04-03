import { Tissues } from './Tissues';
import { Gases, Gas, GasOptions } from './Gases';
import { Segments, Segment } from './Segments';
import { DepthConverter } from './depth-converter';

export class Options implements GasOptions {
    private _ascentSpeed: number;

    public get ascentSpeed(): number {
        return this._ascentSpeed;
    }
    constructor(
        /**
         * Low gradient factor  in range 0-1 (e.g 0-100%), default 1
         */
        public gfLow: number,

        /**
         * Hight gradient factor in range 0-1 (e.g 0-100%), default 1
         */
        public gfHigh: number,

        /**
         * Maximum pp02 to be used during decompression in rnage 0.21-1.6, default 1.6
         */
        public maxppO2: number,

        /**
         * Maximum equivalent air narcotic depth in meters, default 30 meters
         */
        public maxEND: number,

        /**
         * Select water salinity, default false (salt water)
         */
        public isFreshWater: boolean,

        /**
         * Usual Ascent speed used by the diver in metres/minute, default 10 meters/minute.
         */
        ascentSpeed?: number
    ) {
        gfLow = gfLow || 1.0;
        gfHigh = gfHigh || 1.0;
        maxppO2 = maxppO2 || 1.6;
        maxEND = maxEND || 30;
        isFreshWater = isFreshWater || false;
        this._ascentSpeed = ascentSpeed || 10;
    }
}

/**
 * Dive definition point in moment during the dive.
 */
export class Ceiling {
    /**
     * Gets or sets moment in minutes during the dive
     */
    public time: number;

    /**
     * Gets or sets the maximum safe depth to ascent to.
     */
    public depth: number;
}

/**
 * Result of the Algorithm calculation
 */
export class CalculatedProfile {
    /**
     * Not null collection of segments filled whole dive profile.
     */
    public segments: Segment[];

    /**
     * Not null collection of ceilings.
     */
    public ceilings: Ceiling[];
}

class GradientFactors {
    public gfChangePerMeter: number;

    constructor(public gfHigh: number, public gfLow: number, private fromDepth: number) {
        this.gfChangePerMeter = this.depthChangePerMeter(fromDepth);
    }

    private depthChangePerMeter(fromDepth: number): number {
        // find variance in gradient factor
        const gfDiff = this.gfHigh - this.gfLow;
        return gfDiff / fromDepth;
    }

    public gradientForDepth(depth: number): number {
        return this.gfLow + (this.gfChangePerMeter * (this.fromDepth - depth));
    }
}

class AlgorithmContext {
    public tissues = new Tissues();

    // TODO reuse tissues for repetitive dives
    constructor(public gases: Gases, public segments: Segments, public depthConverter: DepthConverter) {}
}

export class BuhlmannAlgorithm {
    public calculateDecompression(options: Options, gases: Gases, segments: Segments, fromDepth?: number): CalculatedProfile {
        let currentGas: Gas;
        const depthConverter = this.selectDepthConverter(options.isFreshWater);
        const context = new AlgorithmContext(gases, segments, depthConverter);

        if (typeof fromDepth === 'undefined') {
            if (!segments.any()) {
                throw new Error('No depth to decompress from has been specified, and neither have any dive stages been registered. Unable to decompress.');
            } else {
                const last = segments.last();
                fromDepth = last.endDepth;
                currentGas = last.gas;
            }
        } else {
            currentGas = gases.bestDecoGas(fromDepth, options, depthConverter);
            if (!currentGas) {
                throw new Error('No deco gas found to decompress from provided depth ' + fromDepth);
            }
        }

        context.tissues.initialize(segments, depthConverter);
        const gradients = new GradientFactors(options.gfHigh, options.gfLow, fromDepth);

        let ceiling = context.tissues.ceiling(options.gfLow, depthConverter);
        currentGas = this.addDecoDepthChange(context, fromDepth, ceiling, currentGas, options);

        while (ceiling > 0) {
            const currentDepth = ceiling;
            const nextDecoDepth = (ceiling - Tissues.decoStopDistance);
            let time = 0;
            const gf = gradients.gradientForDepth(ceiling);
            while (ceiling > nextDecoDepth && time <= 10000) {
                this.load(context, currentDepth, currentGas, 1);
                time++;
                ceiling = context.tissues.ceiling(gf, depthConverter);
            }

            currentGas = this.addDecoDepthChange(context, currentDepth, ceiling, currentGas, options);
        }

        return  {
            segments: segments.mergeFlat(),
            ceilings: []
        };
    }

    private selectDepthConverter(isFreshWater: boolean): DepthConverter {
        if (isFreshWater) {
          return DepthConverter.forFreshWater();
        }

        return DepthConverter.forSaltWater();
    }

    private addDecoDepthChange(context: AlgorithmContext, fromDepth: number, toDepth: number, currentGas: Gas, options: Options) {
        // TODO add multilevel dive where toDepth > fromDepth - since this expects ascend
        if (!currentGas) {
            currentGas = context.gases.bestDecoGas(fromDepth, options, context.depthConverter);
            if (!currentGas) {
                throw new Error('Unable to find starting gas to decompress at depth ' + fromDepth + '..');
            }
        }

        while (toDepth < fromDepth) { // if ceiling is higher, move our diver up.
            // ensure we're on the best gas
            const bestGas = context.gases.bestDecoGas(fromDepth, options, context.depthConverter);
            currentGas = Gases.switchGas(bestGas, currentGas);
            const ceiling = context.gases.nextGasSwitch(currentGas, fromDepth, toDepth, options, context.depthConverter);

            // take us to the ceiling using ascent speed
            const depthdiff = fromDepth - ceiling;
            const time = depthdiff / options.ascentSpeed;
            this.loadChange(context, fromDepth, ceiling, currentGas, time);
            fromDepth = ceiling; // move up from-depth
        }

        const bestGas = context.gases.bestDecoGas(fromDepth, options, context.depthConverter);
        currentGas = Gases.switchGas(bestGas, currentGas);
        return currentGas;
    }

    public noDecoLimit(depth: number, gas: Gas, gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0;
        const depthConverter = this.selectDepthConverter(isFreshWater);
        const gases = new Gases();
        gases.addBottomGas(gas);
        const segments = new Segments();
        const context = new AlgorithmContext(gases, segments, depthConverter);

        let ceiling = context.tissues.ceiling(gf, depthConverter);

        let time = 0;
        let change = 1;
        while (ceiling <= 0 && change > 0) {
            change = this.load(context, depth, gas, 1);
            ceiling = context.tissues.ceiling(gf, depthConverter);
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
        const loaded = context.tissues.load(added, gas, context.depthConverter);
        return loaded;
    }
}
