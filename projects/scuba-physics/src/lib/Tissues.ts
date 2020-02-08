import { Compartments, Compartment } from "./Compartments";
import { AltitudePressure, VapourPressure, PressureConverter } from "./pressure-converter";
import { DepthConverter } from './depth-converter';

export class Tissue extends Compartment {
    // initial tissue loading is needed
    private _pN2: number = 0;
    private _pHe: number = 0;
    private _pTotal: number = 0;

    constructor(compartment: Compartment)
    {
       super(compartment.n2HalfTime, compartment.n2A, compartment.n2B,
        compartment.HeHalfTime, compartment.heA, compartment.heB);
        
        const absPressure = AltitudePressure.current; // TODO altitude diving
        const bodyTemperature = 35.2; 
        const waterVapourPressure = VapourPressure.waterVapourPressureInBars(bodyTemperature);
        this._pN2 = PressureConverter.partialPressure(absPressure, 0.79) - waterVapourPressure;
        this._pHe = 0;
        this._pTotal = this.pN2 + this.pHe;
    };

    public get pN2(): number {
        return this._pN2;
    }

    public get pHe(): number {
        return this._pHe;
    }

    public get pTotal(): number {
        return this._pTotal;
    }

    public ceiling(gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0
        const a = ((this.n2A * this.pN2) + (this.heA * this.pHe)) / (this.pTotal);
        const b = ((this.n2B * this.pN2) + (this.heB * this.pHe)) / (this.pTotal);
        const bars = (this.pTotal - (a * gf)) / ((gf / b) + 1.0 - gf);
        //var bars = (this.pTotal - a) * b;

        // less than surface pressure means no ceiling, this aproximation is OK,
        // because tissues are loaded only under water
        if(bars < AltitudePressure.current) {
            return 0;
        } 

        const ceiling = DepthConverter.fromBar(bars, isFreshWater);
        return Math.round(ceiling);
    };

    public addDepthChange(startDepth: number, endDepth: number, 
            fO2: number, fHe: number, time: number, isFreshWater: boolean): number {
        const fN2 = (1 - fO2) - fHe;
        // Calculate nitrogen loading
        let gasRate = this.gasRateInBarsPerMinute(startDepth, endDepth, time, fN2, isFreshWater);
        let halfTime = this.n2HalfTime; // half-time constant = log2/half-time in minutes
        let pGas = this.gasPressureBreathingInBars(startDepth, fN2, isFreshWater); // initial ambient pressure
        let pBegin = this.pN2; // initial compartment inert gas pressure in bar
        this._pN2 = this.schreinerEquation(pBegin, pGas, time, halfTime, gasRate);

        // Calculate helium loading
        gasRate = this.gasRateInBarsPerMinute(startDepth, endDepth, time, fHe, isFreshWater);
        halfTime = this.HeHalfTime;
        pGas = this.gasPressureBreathingInBars(startDepth, fHe, isFreshWater);
        pBegin = this.pHe;
        this._pHe = this.schreinerEquation(pBegin, pGas, time, halfTime, gasRate);

        const prevTotal = this.pTotal;
        this._pTotal = this.pN2 + this.pHe;

        //return difference - how much load was added
        return this.pTotal - prevTotal;
    };

    /**
     * Calculates the gas loading rate for the given depth change in terms of bars inert gas.
     * 
     * @param beginDepth - The starting depth in meters.
     * @param endDepth - The end depth in meters.
     * @param time - The time in minutes that lapsed between the begin and end depths.
     * @param fGas - The fraction of gas to calculate for.
     * @param isFreshWater - True to calculate changes in depth while in fresh water, false for salt water.
     * @returns The gas loading rate in bars times the fraction of inert gas.
     */
    private gasRateInBarsPerMinute(beginDepth: number, endDepth: number, time: number, fGas: number, isFreshWater: boolean): number {
        return this.depthChangeInBarsPerMinute(beginDepth, endDepth, time, isFreshWater) * fGas;
    };

    /**
     * Calculates the depth change speed in bars per minute.
     * 
     * @param beginDepth - The begin depth in meters.
     * @param endDepth - The end depth in meters.
     * @param time - The time that lapsed during the depth change in minutes.
     * @param isFreshWater - True to calculate changes in depth while in fresh water, false for salt water.
     * @returns The depth change in bars per minute.
     */
    private depthChangeInBarsPerMinute(beginDepth: number, endDepth: number, time: number, isFreshWater: boolean): number {
        const speed = (endDepth - beginDepth) / time;
        return DepthConverter.toBar(speed, isFreshWater) - AltitudePressure.current;
    };

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
        return (pGas + (gasRate * (time - (1.0/timeConstant))) - ((pGas - pBegin - (gasRate / timeConstant)) * Math.exp(-timeConstant * time)));
    };

    /**
     * Calculates the approximate pressure of the fraction of gas for each breath taken.
     * 
     * @param depth - The depth in meters.
     * @param fGas - The fraction of the gas taken in.
     * @param isFreshWater - True to calculate changes while in fresh water, false for salt water.
     * @returns The gas pressure in bars taken in with each breath (accounting for water vapour pressure in the lungs).
     */
    private gasPressureBreathingInBars(depth: number, fGas: number, isFreshWater: boolean): number {
        const bars = DepthConverter.toBar(depth, isFreshWater);
        return bars * fGas;
    };
}

export class Tissues {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;
    public compartments: Tissue[] = [];

    constructor() {
        for (let index = 0; index < Compartments.Buhlmann_ZHL16C.length; index++) {
            let tissue = new Tissue(Compartments.Buhlmann_ZHL16C[index]);
            this.compartments.push(tissue);
        }
    }

    public ceiling(gf: number, isFreshWater: boolean): number {
        gf = gf || 1.0
        let ceiling = 0;
        for (let index = 0; index < this.compartments.length; index++) {
            let tissueCeiling = this.compartments[index].ceiling(gf, isFreshWater);
            if (!ceiling || tissueCeiling > ceiling) {
                ceiling = tissueCeiling;
            }
        }

        while (ceiling % Tissues.decoStopDistance != 0) {
            ceiling++;
        }
        return ceiling;
    };

    public load(startDepth: number, endDepth: number, fO2: number, fHe: number, time: number, isFreshWater: boolean):number {
        let loadChange = 0.0;
        for (let index = 0; index < this.compartments.length; index++) {
            const tissue = this.compartments[index];
            const tissueChange = tissue.addDepthChange(startDepth, endDepth, fO2, fHe, time, isFreshWater);
            loadChange = loadChange + tissueChange;
        }
        return loadChange;
    }

    public reset(origTissuesJSON: string): void {
        let originalTissues = JSON.parse(origTissuesJSON);
        for (let i = 0; i < originalTissues.length; i++) {
            for (let p in originalTissues[i]) {
                this.compartments[i][p] = originalTissues[i][p];
            }
        }
    }
}