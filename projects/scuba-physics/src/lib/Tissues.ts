import { Compartments, Compartment } from './Compartments';
import { GasMixtures, Gas } from './Gases';

/**
 * Represents transition between depths during dive
 */
export class LoadSegment {
    /**
     * Depth in pressure (bars) at beginning of the segment
     */
    public startPressure: number;

    /**
     * Duration in seconds of the transition
     */
    public duration: number;

    /**
     * Direction of the swim in bars/second
     */
    public speed: number;
}

export class Tissue extends Compartment {
    // initial tissue loading is needed
    private _pN2 = 0;
    private _pHe = 0;
    private _pTotal = 0;
    private _a = 0;
    private _b = 0;

    constructor(compartment: Compartment, surfacePressure: number) {
       super(compartment.n2HalfTime, compartment.n2A, compartment.n2B,
             compartment.HeHalfTime, compartment.heA, compartment.heB);

        const waterVapourPressure = 0.0627; // as constant for body temperature 37°C
        this._pN2 = GasMixtures.partialPressure(surfacePressure, 0.79) - waterVapourPressure;
        this._pHe = 0;
        this._pTotal = this.pN2 + this.pHe;
    }

    public get pN2(): number {
        return this._pN2;
    }

    public get pHe(): number {
        return this._pHe;
    }

    public get pTotal(): number {
        return this._pTotal;
    }

    public get a(): number {
        return this._a;
    }

    public get b(): number {
        return this._b;
    }

    /**
     * Returns pressure in bars of the depth representing maximum ceiling.
     *
     * @param gfLow Gradient factor low in range 0-1
     */
    public ceiling(gfLow: number): number {
        // tolerated = (pTotal - a) * b  // Buhlmann
        const bars = (this.pTotal - (this.a * gfLow)) / ((gfLow / this.b) + 1.0 - gfLow);
        return bars;
    }

    public load(segment: LoadSegment, gas: Gas): number {
        this._pN2 = this.loadGas(segment, gas.fN2, this.pN2, this.n2HalfTime);
        this._pHe = this.loadGas(segment, gas.fHe, this.pHe, this.HeHalfTime);
        const prevTotal = this.pTotal;
        this._pTotal = this.pN2 + this.pHe;

        this._a = ((this.n2A * this.pN2) + (this.heA * this.pHe)) / (this.pTotal);
        this._b = ((this.n2B * this.pN2) + (this.heB * this.pHe)) / (this.pTotal);

        // return difference - how much load was added
        return this.pTotal - prevTotal;
    }

    private loadGas(segment: LoadSegment, fGas: number, pBegin: number, halfTime: number): number {
        const gasRateInBarsPerSecond = segment.speed * fGas;
        // initial ambient pressure
        const gasPressureBreathingInBars = segment.startPressure * fGas;
        const newGasPressure = this.schreinerEquation(pBegin, gasPressureBreathingInBars,
            segment.duration, halfTime, gasRateInBarsPerSecond);
        return newGasPressure;
    }

    /**
     * Calculates the end compartment inert gas pressure in bar.
     *
     * @param pBegin - Initial compartment inert gas pressure.
     * @param pGas - Partial pressure of inert gas at CURRENT depth (not target depth - but starting depth where change begins.)
     * @param time - Time of exposure or interval in seconds.
     * @param halfTime - Log2/half-time in minute.
     * @param gasRate - Rate of descent/ascent in bar times the fraction of inert gas.
     * @returns The end compartment inert gas pressure in bar.
     */
    private schreinerEquation(pBegin: number, pGas: number, time: number, halfTime: number, gasRate: number): number {
        const Log2_60 = 1.155245301e-02; // Math.log(2) / 60
        const timeConstant = Log2_60  / halfTime;
        const exp = Math.exp(-timeConstant * time);
        return (pGas + (gasRate * (time - (1.0 / timeConstant))) - ((pGas - pBegin - (gasRate / timeConstant)) * exp));
    }
}

export class Tissues {
    public compartments: Tissue[] = [];

    constructor(surfacePressure: number) {
        for (let index = 0; index < Compartments.Buhlmann_ZHL16C.length; index++) {
            const compartment = Compartments.Buhlmann_ZHL16C[index];
            const tissue = new Tissue(compartment, surfacePressure);
            this.compartments.push(tissue);
        }
    }

     /**
     * Returns pressure in bars of the depth representing maximum ceiling of all tissues.
     *
     * @param gfLow Gradient factor low in range 0-1
     * @returns Zero in case there is no ceiling, otherwise ceiling pressure in bars
     */
    public ceiling(gfLow: number): number {
        let ceiling = 0;

        for (let index = 0; index < this.compartments.length; index++) {
            const tissueCeiling = this.compartments[index].ceiling(gfLow);
            if (tissueCeiling > ceiling) {
                ceiling = tissueCeiling;
            }
        }

        return ceiling;
    }

    /**
     * Returns lowest value of tolerated pressure in bars
     *
     * @param surface surface pressure in bars
     * @param lowestCeiling last known lowest ceiling in bars
     * @param gfHigh gradient factor high in range 0-1
     * @param gfLow gradient factor low in range 0-1
     */
    public tolerated(surface: number, lowestCeiling: number, gfHigh: number, gfLow: number): number {
        let tolerated = 0;

        for (let ci = 0; ci < this.compartments.length; ci++) {
            const compartment = this.compartments[ci];
            let currentTolerated = tolerated;

            // reused from Subsurface
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

    public load(segment: LoadSegment, gas: Gas): number {
        let loadChange = 0.0;
        for (let index = 0; index < this.compartments.length; index++) {
            const tissue = this.compartments[index];
            const tissueChange = tissue.load(segment, gas);
            loadChange = loadChange + tissueChange;
        }
        return loadChange;
    }
}
