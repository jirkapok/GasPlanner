import { LoadedTissue, Tissue, Tissues } from './Tissues';
import { Ceiling } from './CalculatedProfile';
import { BestGasOptions, Gas, Gases, OCGasSource } from './Gases';
import { GradientFactors, SubSurfaceGradientFactors } from './GradientFactors';
import { AscentSpeeds } from './speeds';
import { DepthLevels } from './DepthLevels';
import { Segment, Segments } from './Segments';
import { Options } from './Options';
import { DepthConverter } from './depth-converter';
import { Time } from './Time';
import { StandardGases } from './StandardGases';

export interface ContextMemento {
    tissues: Tissue[];
    ceilings: number;
    segments: number;
    runTime: number;
    lowestCeiling: number;
    oxygenStarted: number;
}

export class AlgorithmContext {
    public tissues: Tissues;
    public ceilings: Ceiling[] = [];
    /** in seconds */
    public runTime = 0;
    private _oxygenStarted = 0;
    private _currentGas: Gas;
    private gradients: GradientFactors;
    private bestGasOptions: BestGasOptions;
    private speeds: AscentSpeeds;
    private levels: DepthLevels;
    private gasSource: OCGasSource;

    constructor(
        public gases: Gases,
        public segments: Segments,
        public options: Options,
        public depthConverter: DepthConverter,
        currentTissues: LoadedTissue[]) {
        this.tissues = Tissues.createLoaded(currentTissues);
        // this.gradients = new SimpleGradientFactors(depthConverter, options, this.tissues, this.segments);
        this.gradients = new SubSurfaceGradientFactors(depthConverter, options, this.tissues);
        const last = segments.last();
        this._currentGas = last.gas;

        this.bestGasOptions = {
            currentDepth: this.currentDepth,
            maxDecoPpO2: this.options.maxDecoPpO2,
            oxygenNarcotic: this.options.oxygenNarcotic,
            maxEnd: this.options.maxEND,
            currentGas: this.currentGas
        };

        this.speeds = new AscentSpeeds(this.options);
        this.levels = new DepthLevels(depthConverter, options);
        this.gasSource = new OCGasSource(gases, options);
    }

    public get currentGas(): Gas {
        return this._currentGas;
    }

    public get ascentSpeed(): number {
        return this.speeds.ascent(this.currentDepth);
    }

    public get currentDepth(): number {
        return this.segments.currentDepth;
    }

    public get addSafetyStop(): boolean {
        return this.levels.addSafetyStop(this.currentDepth, this.segments.maxDepth);
    }

    public get decoStopDuration(): number {
        return this.options.roundStopsToMinutes ? Time.oneMinute : Time.oneSecond;
    }

    public get isAtSurface(): boolean {
        return this.segments.last().endDepth === 0;
    }

    public get runTimeOnOxygen(): number {
        return this.runTime - this._oxygenStarted;
    }

    /**
     * Current gas is oxygen - For Air breaks.
     * Correct is to compare ppO2 is high (>= 1.6),
     * because air break may happen also at deeper stops, not only on oxygen.
     * But It is hard to reach air break on another gas than oxygen,
     * because e.g. for Ean50, at 16m ppO2 is already 1.3,
     * i.e. you should stay at 21 m more than 20 minutes.
     **/
    public get isBreathingOxygen(): boolean {
        return this.currentGas.compositionEquals(StandardGases.oxygen);
    }

    public set currentGas(newValue: Gas) {
        if (newValue.compositionEquals(StandardGases.oxygen) && !this.isBreathingOxygen) {
            // needs to be marked outside of air breaks, because everybody can change the gas
            this._oxygenStarted = this.runTime;
        }

        this._currentGas = newValue;
    }

    /** use this just before calculating ascent to be able calculate correct speeds */
    public markAverageDepth(): void {
        this.speeds.markAverageDepth(this.segments);
    }

    public addCeiling() {
        const depth = this.ceiling();
        const newCeiling = new Ceiling(this.runTime, depth);
        this.ceilings.push(newCeiling);
    }

    public ceiling(): number {
        return this.gradients.ceiling();
    }

    public bestDecoGas(): Gas {
        this.bestGasOptions.currentDepth = this.currentDepth;
        this.bestGasOptions.currentGas = this.currentGas;
        const newGas = this.gasSource.bestGas(this.bestGasOptions);
        return newGas;
    }

    public createMemento(): ContextMemento {
        return {
            runTime: this.runTime,
            oxygenStarted: this._oxygenStarted,
            tissues: Tissues.copy(this.tissues.compartments),
            ceilings: this.ceilings.length,
            segments: this.segments.length,
            lowestCeiling: this.gradients.lowestCeiling
        };
    }

    public restore(memento: ContextMemento): void {
        // here we don't copy, since we expect it wasn't touched
        this.tissues.restoreFrom(memento.tissues);
        this.gradients.lowestCeiling = memento.lowestCeiling;
        this.runTime = memento.runTime;
        this._oxygenStarted = memento.oxygenStarted;
        // ceilings and segments are only added
        this.ceilings = this.ceilings.slice(0, memento.ceilings);
        const toCut = this.segments.length - memento.segments;
        this.segments.cutDown(toCut);
    }

    public nextStop(currentStop: number): number {
        return this.levels.nextStop(currentStop);
    }

    public shouldSwitchTo(newGas: Gas): boolean {
        return newGas && !this.currentGas.compositionEquals(newGas);
    }

    public addAscentSegment(nextStop: number, duration: number): Segment {
        return this.segments.add(nextStop, this.currentGas, duration);
    }

    public addGasSwitchSegment(): Segment {
        const duration = this.options.gasSwitchDuration * Time.oneMinute;
        return this.addStopSegment(duration);
    }

    public addSafetyStopSegment(): Segment {
        const duration = Time.safetyStopDuration;
        return this.addStopSegment(duration);
    }

    public addStopSegment(duration: number): Segment {
        return this.segments.addFlat(this.currentGas, duration);
    }

    public airBreakGas(): Gas {
        return this.gasSource.airBreakGas(this.currentDepth, this.currentGas);
    }
}


export class AirBreakContext {
    // TODO apply settings for air breaks
    private readonly maxOxygenTime = Time.oneMinute * 20;
    private readonly maxBottomGasTime = Time.oneMinute * 5;
    private _initialStopDuration: number;

    constructor(private readonly context: AlgorithmContext, private remainingStopTime: number) {
        // need to preserve, because swim, adds oxygen runtime
        this._initialStopDuration = Math.min(this.remainingStopTime, this.remainingOxygenTime);
    }

    public get needsStop(): boolean {
        return this.remainingStopTime > 0;
    }

    public get maxGasTime(): number {
        const maxTime = this.context.isBreathingOxygen ? this.maxOxygenTime : this.maxBottomGasTime;
        return maxTime;
    }

    public get stopDuration(): number {
        if (this._initialStopDuration > 0) {
            return this._initialStopDuration;
        }

        const stopDuration = Math.min(this.remainingStopTime, this.maxGasTime);
        return stopDuration;
    }

    private get remainingOxygenTime(): number {
        // Starting on oxygen: needs to be extracted from first oxygen part
        // The gas switch took place already and is already counted in the runTimeOnOxygen.
        const remaining = this.maxOxygenTime - this.context.runTimeOnOxygen;
        return remaining > 0 ? remaining : 0;
    }

    public switchStopGas(): void {
        if (this._initialStopDuration > 0) {
            return; // don't switch for initial oxygen stop
        }

        if (this.context.isBreathingOxygen) {
            this.context.currentGas = this.context.airBreakGas();
            return;
        }

        // should be oxygen only
        this.context.currentGas = this.context.bestDecoGas();
    }

    public subtractStopDuration(): void {
        if (this._initialStopDuration > 0) {
            this.subtractRemainingStopTime(this._initialStopDuration);
            this._initialStopDuration = 0;
            return;
        }

        this.subtractRemainingStopTime(this.stopDuration);
    }

    private subtractRemainingStopTime(stopTime: number): void {
        this.remainingStopTime -= stopTime;
    }
}
