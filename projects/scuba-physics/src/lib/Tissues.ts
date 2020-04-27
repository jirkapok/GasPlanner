import { Compartments, Compartment } from './Compartments';
import { AltitudePressure, VapourPressure } from './pressure-converter';
import { GasMixutures, Gas } from './Gases';

/**
 * Represents transition between depths during dive
 */
export class LoadSegment {
    /**
     * Depth in pressure (bars) at beginning of the segment
     */
    public startPressure: number;

    /**
     * Duration in minutes of the transition
     */
    public duration: number;

    /**
     * Direction of the swim in bars/minute
     */
    public speed: number;
}

export class Tissue extends Compartment {
    // initial tissue loading is needed
    private _pN2 = 0;
    private _pHe = 0;
    private _pTotal = 0;

    constructor(compartment: Compartment) {
       super(compartment.n2HalfTime, compartment.n2A, compartment.n2B,
        compartment.HeHalfTime, compartment.heA, compartment.heB);

        const absPressure = AltitudePressure.current; // TODO altitude diving
        const bodyTemperature = 35.2;
        const waterVapourPressure = VapourPressure.waterVapourPressureInBars(bodyTemperature);
        this._pN2 = GasMixutures.partialPressure(absPressure, 0.79) - waterVapourPressure;
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

    public ceiling(gf: number): number {
        const a = ((this.n2A * this.pN2) + (this.heA * this.pHe)) / (this.pTotal);
        const b = ((this.n2B * this.pN2) + (this.heB * this.pHe)) / (this.pTotal);
        const bars = (this.pTotal - (a * gf)) / ((gf / b) + 1.0 - gf);

        // less than surface pressure means no ceiling, this aproximation is OK,
        // because tissues are loaded only under water
        if (bars < AltitudePressure.current) {
            return AltitudePressure.current;
        }

        return bars;
    }

    public load(segment: LoadSegment, gas: Gas): number {
        this._pN2 = this.loadGas(segment, gas.fN2, this.pN2, this.n2HalfTime);
        this._pHe = this.loadGas(segment, gas.fHe, this.pHe, this.HeHalfTime);
        const prevTotal = this.pTotal;
        this._pTotal = this.pN2 + this.pHe;

        // return difference - how much load was added
        return this.pTotal - prevTotal;
    }

    private loadGas(segment: LoadSegment, fGas: number, pBegin: number, halfTime: number): number {
        const gasRateInBarsPerMinute = segment.speed * fGas;
        // initial ambient pressure
        const gasPressureBreathingInBars = segment.startPressure * fGas;
        const newGasPressure = this.schreinerEquation(pBegin, gasPressureBreathingInBars,
             segment.duration, halfTime, gasRateInBarsPerMinute);
        return newGasPressure;
    }

    /**
     * Calculates the end compartment inert gas pressure in bar.
     *
     * @param pBegin - Initial compartment inert gas pressure.
     * @param pGas - Partial pressure of inert gas at CURRENT depth (not target depth - but starting depth where change begins.)
     * @param time - Time of exposure or interval in minutes.
     * @param halfTime - Log2/half-time in minute.
     * @param gasRate - Rate of descent/ascent in bar times the fraction of inert gas.
     * @returns The end compartment inert gas pressure in bar.
     */
    private schreinerEquation(pBegin: number, pGas: number, time: number, halfTime: number, gasRate: number): number {
        const timeConstant = Math.log(2) / halfTime;
        return (pGas + (gasRate * (time - (1.0 / timeConstant))) - ((pGas - pBegin - (gasRate / timeConstant)) * Math.exp(-timeConstant * time)));
    }
}

export class Tissues {
    public compartments: Tissue[] = [];

    constructor() {
        for (let index = 0; index < Compartments.Buhlmann_ZHL16C.length; index++) {
            const tissue = new Tissue(Compartments.Buhlmann_ZHL16C[index]);
            this.compartments.push(tissue);
        }
    }

    public ceiling(gf: number): number {
        let ceiling = 0;
        for (let index = 0; index < this.compartments.length; index++) {
            const tissueCeiling = this.compartments[index].ceiling(gf);
            if (!ceiling || tissueCeiling > ceiling) {
                ceiling = tissueCeiling;
            }
        }

        return ceiling;
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
