import { Options } from './Options';
import { DepthConverter } from './depth-converter';
import { Segments } from './Segments';
import { Tissues } from './Tissues';

export interface GradientFactors {
    /** Gets current highest ceiling of all tissues */
    ceiling(): number;
}

/**
 * Calculation of gradient factors inspired by SubSurface
 * Stops deeper, faster ceiling increase, higher total time
 * Because inspired by https://github.com/subsurface/subsurface
 * this part needs to be under GNU General Public License v2.0
 */
export class SubSurfaceGradientFactors {
    private lowestCeiling = 0;

    constructor(private depthConverter: DepthConverter, private options: Options, private tissues: Tissues) {
        // add 1 to compensate gradient low on start of the dive
        this.lowestCeiling = this.depthConverter.surfacePressure + 1;
    }

    public ceiling(): number {
        let bars = this.tolerated();

        // less than surface pressure means no ceiling, this approximation is OK,
        // because tissues are loaded only under water
        if (bars < this.depthConverter.surfacePressure) {
            bars = this.depthConverter.surfacePressure;
        }

        return this.depthConverter.fromBar(bars);
    }

    /**
     * Returns lowest value of tolerated pressure in bars
     *
     * @param surface surface pressure in bars
     * @param lowestCeiling last known lowest ceiling in bars
     * @param gfHigh gradient factor high in range 0-1
     * @param gfLow gradient factor low in range 0-1
     */
    private toleratedTissues(surface: number, lowestCeiling: number, gfHigh: number, gfLow: number): number {
        const compartments = this.tissues.compartments;
        let tolerated = 0;

        for (let index = 0; index < compartments.length; index++) {
            const compartment = compartments[index];
            let currentTolerated = tolerated;

            if ((surface / compartment.b + compartment.a - surface) * gfHigh + surface <
                (lowestCeiling / compartment.b + compartment.a - lowestCeiling) * gfLow + lowestCeiling) {
                currentTolerated = (-compartment.a * compartment.b * (gfHigh * lowestCeiling - gfLow * surface) -
                    (1.0 - compartment.b) * (gfHigh - gfLow) * lowestCeiling * surface +
                    compartment.b * (lowestCeiling - surface) * compartment.pTotal) /
                    (-compartment.a * compartment.b * (gfHigh - gfLow) +
                        (1.0 - compartment.b) * (gfLow * lowestCeiling - gfHigh * surface) +
                        compartment.b * (lowestCeiling - surface));
            }

            if (currentTolerated >= tolerated) {
                tolerated = currentTolerated;
            }
        }

        return tolerated;
    }

    private tolerated(): number {
        const gfLow = this.options.gfLow;
        const gfHigh = this.options.gfHigh;
        const surface = this.depthConverter.surfacePressure;
        const currentLowestCeiling = this.tissues.ceiling(gfLow);

        if (currentLowestCeiling > this.lowestCeiling) {
            this.lowestCeiling = currentLowestCeiling;
        }

        const tolerated = this.toleratedTissues(surface, this.lowestCeiling, gfHigh, gfLow);
        return tolerated;
    }
}


/**
 * Calculation of gradient factors from particular depth by simple implementation
 * Lower stops, lower total time, lower over all ceiling
 * Generates not linear transition from GFlow to GFHigh
 */
export class SimpleGradientFactors {
    private gfDiff: number;

    constructor(private depthConverter: DepthConverter, private options: Options, private tissues: Tissues, private segments: Segments) {
        // find variance in gradient factor
        this.gfDiff = options.gfHigh - options.gfLow;
    }

    public ceiling(): number {
        let tolerated = this.tissues.ceiling(this.options.gfLow);
        if (tolerated < this.depthConverter.surfacePressure) {
            tolerated = this.depthConverter.surfacePressure;
        }

        const toleratedDepth = this.depthConverter.fromBar(tolerated);
        const gf = this.gradientForDepth(toleratedDepth);

        let bars = this.tissues.ceiling(gf);

        // less than surface pressure means no ceiling, this approximation is OK,
        // because tissues are loaded only under water
        if (bars < this.depthConverter.surfacePressure) {
            bars = this.depthConverter.surfacePressure;
        }

        return this.depthConverter.fromBar(bars);
    }

    /**
     * calculate final gradient for current depth
     * @param depth in meters
     */
    private gradientForDepth(depth: number): number {
        const fromDepth = this.segments.maxDepth;
        const gfChangePerMeter = this.gfDiff / fromDepth;
        return this.options.gfLow + (gfChangePerMeter * (fromDepth - depth));
    }
}
