import { Compartments, Compartment } from "./Compartments";
import { AltitudePressure, PressureConverterService, VapourPressure, Gravity, Density,
         DepthConverterService } from "scuba-physics";

export class Tissue extends Compartment {
    // initial tissue loading is needed
    private _pN2: number = 0;
    private _pHe: number = 0;
    private _pTotal: number = 0;
    private _waterVapourPressure: number;

    constructor(compartment: Compartment)
    {
       super(compartment.n2HalfTime, compartment.n2A, compartment.n2B,
        compartment.HeHalfTime, compartment.heA, compartment.heB);
        
        let absPressure = 1;
        this._waterVapourPressure = this.waterVapourPressureInBars(35.2);
        this._pN2 = this.partialPressure(absPressure || 1, 0.79) - this._waterVapourPressure;
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

    /**
     * Calculates the partial pressure of a gas component from the volume gas fraction and total pressure.
     * 
     * @param absPressure - The total pressure P in bars (typically 1 bar of atmospheric pressure + x bars of water pressure).
     * @param volumeFraction - The volume fraction of gas component (typically 0.79 for 79%) measured as percentage in decimal.
     * @returns The partial pressure of gas component in bar absolute.
     */
    private partialPressure(absPressure: number, volumeFraction: number): number {
        return absPressure * volumeFraction;
    };

    /**
     * The vapour pressure of water may be approximated as a function of temperature.
     * 
     * @param degreesCelcius - The temperature to approximate the pressure of water vapour.
     * @returns Water vapour pressure in terms of bars.
     */
    private waterVapourPressureInBars(degreesCelcius: number): number {
        var mmHg = this.waterVapourPressure(degreesCelcius);
        var pascals = this.mmHgToPascal(mmHg);
        return PressureConverterService.pascalToBar(pascals);
    };

    /**
     * Returns the definition of mmHg (millimeters mercury) in terms of Pascal.
     * 
     * @param mmHg - Millimeters high or depth.
     * @returns Typically defined as weight density of mercury.
     */
    private mmHgToPascal(mmHg: number): number {
        if (!mmHg) {
            mmHg = 1;
        }

        return (Density.mercury / 1000) * Gravity.current * mmHg;
    };

    /**
     * The vapour pressure of water may be approximated as a function of temperature.
     * Based on the Antoine_equation http://en.wikipedia.org/wiki/Antoine_equation
     * http://en.wikipedia.org/wiki/Vapour_pressure_of_water 
     *
     * @param degreesCelcius - The temperature to approximate the pressure of water vapour.
     * @returns Water vapour pressure in terms of mmHg.
     */
    private waterVapourPressure(degreesCelcius: number): number {
        var rangeConstants;
        if (degreesCelcius >= 1 && degreesCelcius <= 100)
            rangeConstants = VapourPressure.tempRange_1_100;
        else if (degreesCelcius >= 99 && degreesCelcius <= 374)
            rangeConstants = VapourPressure.tempRange_99_374;
        else
            return NaN;

        var logp = rangeConstants[0] - (rangeConstants[1] / (rangeConstants[2] + degreesCelcius));
        return Math.pow(10, logp);
    };

    public calculateCeiling(gf: number, isFreshWater: boolean) {
        gf = gf || 1.0
        var a = ((this.n2A * this.pN2) + (this.heA * this.pHe)) / (this.pTotal);
        var b = ((this.n2B * this.pN2) + (this.heB * this.pHe)) / (this.pTotal);
        var bars = (this.pTotal - (a * gf)) / ((gf / b) + 1.0 - gf);
        //var bars = (this.pTotal - a) * b;
        let ceiling = DepthConverterService.fromBar(bars, isFreshWater);
        //console.log("a:" + a + ", b:" + b + ", bars:" + bars + " ceiling:" + this.ceiling);
        return Math.round(ceiling);
    };

    public addDepthChange(startDepth: number, endDepth: number, fO2: number, fHe: number, time: number, isFreshWater: boolean) {
        var fN2 = (1 - fO2) - fHe;
        // Calculate nitrogen loading
        var gasRate = this.gasRateInBarsPerMinute(startDepth, endDepth, time, fN2, isFreshWater);
        var halfTime = this.n2HalfTime; // half-time constant = log2/half-time in minutes
        var pGas = this.gasPressureBreathingInBars(startDepth, fN2, isFreshWater); // initial ambient pressure
        var pBegin = this.pN2; // initial compartment inert gas pressure in bar
        this._pN2 = this.schreinerEquation(pBegin, pGas, time, halfTime, gasRate);

        // Calculate helium loading
        gasRate = this.gasRateInBarsPerMinute(startDepth, endDepth, time, fHe, isFreshWater);
        halfTime = this.HeHalfTime;
        pGas = this.gasPressureBreathingInBars(startDepth, fHe, isFreshWater);
        pBegin = this.pHe;
        this._pHe = this.schreinerEquation(pBegin, pGas, time, halfTime, gasRate);

        var prevTotal = this.pTotal;
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
    private gasRateInBarsPerMinute(beginDepth: number, endDepth: number, time: number, fGas: number, isFreshWater: boolean) {
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
    private depthChangeInBarsPerMinute(beginDepth: number, endDepth: number, time: number, isFreshWater: boolean) {
        var speed = (endDepth - beginDepth) / time;
        return DepthConverterService.toBar(speed, isFreshWater) - AltitudePressure.current;
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
        var timeConstant = Math.log(2)/halfTime
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
        var bars = DepthConverterService.toBar(depth, isFreshWater);
        return bars * fGas;
    };
}

export class Tissues {
    public compartments: Tissue[] = [];

    constructor() {
        for (var index = 0; index < Compartments.Buhlmann_ZHL16C.length; index++) {
            let tissue = new Tissue(Compartments.Buhlmann_ZHL16C[index]);
            this.compartments.push(tissue);
        }
    }

    public get length(): number {
        return this.compartments.length;
    }

    public reset(): void {
        var origTissuesJSON = JSON.stringify(Compartments.Buhlmann_ZHL16C);
        var originalTissues = JSON.parse(origTissuesJSON);
        for (var i = 0; i < originalTissues.length; i++) {
            for (var p in originalTissues[i]) {
                this.compartments[i][p] = originalTissues[i][p];
            }
        }
    }
}