import { Compartments, Compartment } from './Compartments';
import { Gas } from './Gases';
import _ from 'lodash';
import { AltitudePressure, PressureConverter } from './pressure-converter';
import { GasMixtures } from './GasMixtures';

/**
 * Represents transition between depths during dive
 */
export class LoadSegment {
    constructor(
        /**
         * Depth in pressure (bars) at beginning of the segment
         */
        public startPressure: number,

        /**
         * Duration in seconds of the transition
         */
        public duration: number,

        /**
         * Direction of the swim in bars/second
         */
        public speed: number,
    ) {}
}

export class Tissue extends Compartment implements LoadedTissue {
    // initial tissue loading is needed
    private _pN2 = 0;
    private _pHe = 0;
    private _pTotal = 0;
    private _a = 0;
    private _b = 0;

    constructor(compartment: Compartment, surfacePressure: number) {
        super(compartment.n2HalfTime, compartment.n2A, compartment.n2B,
            compartment.heHalfTime, compartment.heA, compartment.heB);

        const pressure = this.pressureInLungs(surfacePressure);
        this._pN2 = GasMixtures.partialPressure(pressure, GasMixtures.nitroxInAir);
        this._pHe = 0;
        this.updateTotal();
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

    public static fromCurrent(loaded: LoadedTissue, compartment: Compartment): Tissue {
        const copy = new Tissue(compartment, 1); // irrelevant pressure wouldn't be used
        copy._pN2 = loaded.pN2;
        copy._pHe = loaded.pHe;
        copy._a = loaded.a;
        copy._b = loaded.b;
        copy.updateTotal();
        return copy;
    }

    public copy(): Tissue {
        return Tissue.fromCurrent(this, this);
    }

    /**
     * Returns pressure in bars of the depth representing maximum ceiling
     * reduced by the provided gradient.
     *
     * @param gradient Gradient factor constant in range 0-1
     */
    public ceiling(gradient: number): number {
        // tolerated = (pTotal - a) * b  // Buhlmann
        const bars = (this.pTotal - (this.a * gradient)) / ((gradient / this.b) + 1.0 - gradient);
        return bars;
    }

    public load(segment: LoadSegment, gas: Gas): number {
        this._pN2 = this.loadGas(segment, gas.fN2, this.pN2, this.n2HalfTime);
        this._pHe = this.loadGas(segment, gas.fHe, this.pHe, this.heHalfTime);
        const prevTotal = this.pTotal;
        this.updateTotal();

        this._a = ((this.n2A * this.pN2) + (this.heA * this.pHe)) / (this.pTotal);
        this._b = ((this.n2B * this.pN2) + (this.heB * this.pHe)) / (this.pTotal);

        // return difference - how much load was added
        return this.pTotal - prevTotal;
    }

    private loadGas(segment: LoadSegment, fGas: number, pBegin: number, halfTime: number): number {
        const gasRateInBarsPerSecond = segment.speed * fGas;
        // initial ambient pressure
        const gasPressureBreathingInBars = this.pressureInLungs(segment.startPressure) * fGas;
        const newGasPressure = this.schreinerEquation(pBegin, gasPressureBreathingInBars,
            segment.duration, halfTime, gasRateInBarsPerSecond);
        return newGasPressure;
    }

    private pressureInLungs(ambientPressure: number): number {
        /** as constant for body temperature 37°C */
        const waterVapourPressure = 0.0627;
        return ambientPressure - waterVapourPressure;
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
        const LOG2_60 = 1.155245301e-02; // Math.log(2) / 60
        const timeConstant = LOG2_60 / halfTime;
        const exp = Math.exp(-timeConstant * time);
        return (pGas + (gasRate * (time - (1.0 / timeConstant))) - ((pGas - pBegin - (gasRate / timeConstant)) * exp));
    }

    private updateTotal(): void {
        this._pTotal = this.pN2 + this.pHe;
    }
}

export class Tissues {
    private constructor(private _compartments: Tissue[]){}

    public get compartments(): Tissue[] {
        return this._compartments;
    }

    /**
     * Creates new instance of tissues already loaded by nitrogen and helium.
     * Should be used only for repetitive dive.
     * @param current not null instance of currently loaded tissues.
     * Can be obtained from algorithm calculated dive profile.
     */
    public static createLoaded(current: LoadedTissue[]): Tissues {
        if(current.length !== Compartments.buhlmannZHL16C.length) {
            throw new Error('Provided incompatible count of tissues');
        }

        const tissues = _(current).map((t, index) => {
            const compartment = Compartments.buhlmannZHL16C[index];
            return Tissue.fromCurrent(t, compartment);
        }).value();
        return new Tissues(tissues);
    }

    /**
     * Creates new instance of tissues adopted for current surface pressure.
     * Should be used only for first dive.
     * @param surfacePressure in bars
     */
    public static create(surfacePressure: number) {
        const created: Tissue[] = [];

        for (let index = 0; index < Compartments.buhlmannZHL16C.length; index++) {
            const compartment = Compartments.buhlmannZHL16C[index];
            const tissue = new Tissue(compartment, surfacePressure);
            created.push(tissue);
        }

        return new Tissues(created);
    }

    /**
     * Creates new loaded tissues at altitude
     * @param altitude in m.a.s.l
     */
    public static createLoadedAt(altitude: number): LoadedTissue[] {
        const surfacePressurePascal = AltitudePressure.pressure(altitude);
        const surfacePressure = PressureConverter.pascalToBar(surfacePressurePascal);
        const tissues = Tissues.create(surfacePressure).finalState();
        return tissues;
    }

    public static copy(source: Tissue[]): Tissue[] {
        const backup: Tissue[] = [];
        for(let index = 0; index < source.length; index++) {
            const compartmentCopy = source[index].copy();
            backup.push(compartmentCopy);
        }

        return backup;
    }

    public restoreFrom(source: Tissue[]): void {
        this._compartments = Tissues.copy(source);
    }

    public finalState(): LoadedTissue[] {
        return Tissues.copy(this._compartments);
    }

    public currentOverPressures(): number[] {
        // TODO calculate as relative value against M-values
        return []; // _(this._compartments).map(t => t.pTotal).value();
    }

    /**
    * Returns pressure in bars of the depth representing maximum ceiling of all tissues
    * reduced by the provided gradient.
    *
    * @param gradient Gradient factor constant in range 0-1
    * @returns Zero in case there is no ceiling, otherwise ceiling pressure in bars
    */
    public ceiling(gradient: number): number {
        let ceiling = 0;

        for (let index = 0; index < this._compartments.length; index++) {
            const tissueCeiling = this._compartments[index].ceiling(gradient);
            if (tissueCeiling > ceiling) {
                ceiling = tissueCeiling;
            }
        }

        return ceiling;
    }

    public load(segment: LoadSegment, gas: Gas): number {
        let loadChange = 0.0;
        for (let index = 0; index < this._compartments.length; index++) {
            const tissue = this._compartments[index];
            const tissueChange = tissue.load(segment, gas);
            loadChange = loadChange + tissueChange;
        }
        return loadChange;
    }
}

/**
 * Represents state of the body after performed dive.
 */
export interface LoadedTissue {
    /**
     * partial pressure of nitrogen in bars
     */
    pN2: number;

    /**
     * partial pressure of helium in bars
     */
    pHe: number;

    /**
     * Buhlmann m-value constant a
     */
    a: number;

    /**
     * Buhlmann m-value constant b
     */
    b: number;
}

export class TissuesValidator {
    public static validTissue(item: LoadedTissue): boolean {
        return item.pN2 > 0 &&
               item.pHe >= 0 &&
               // a and b may be 0 in case no loading of the tissues was performed yet.
               item.a >= 0 &&
               item.b >= 0;
    }

    public static validCount(current?: LoadedTissue[]): boolean {
        return !!current && current.length === Compartments.buhlmannZHL16C.length;
    }

    public static valid(current: LoadedTissue[]) {
        if(!TissuesValidator.validCount(current)) {
            return false;
        }

        const allItemsValid = _(current).every(t => TissuesValidator.validTissue(t));
        return allItemsValid;
    }
}
