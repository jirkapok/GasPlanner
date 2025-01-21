import { LoadSegment, Tissues } from './Tissues';
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
import { FeatureFlags } from './featureFlags';
import { LoadedTissues, TissueOverPressures } from "./Tissues.api";

export interface ContextMemento {
    lastTissues: LoadedTissues;
    tissuesHistory: number;
    ceilings: number;
    tissueOverPressures: number;
    segments: number;
    runTime: number;
    lowestCeiling: number;
    oxygenStarted: number;
}

export class AlgorithmContext {
    public ceilings: Ceiling[] = [];
    public tissueOverPressures: TissueOverPressures[] = [];
    public tissuesHistory: LoadedTissues[] = [];
    /** in seconds */
    public runTime = 0;

    private tissues: Tissues;
    private _oxygenStarted = 0;
    private _currentGas: Gas;
    private gradients: GradientFactors;
    private bestGasOptions: BestGasOptions;
    private speeds: AscentSpeeds;
    private levels: DepthLevels;
    private gasSource: OCGasSource;
    /** This is performance optimization to call only necessary methods */
    private collectStatistics: (depth: number) => void = this.noStatistics;

    private constructor(
        public gases: Gases,
        public segments: Segments,
        public options: Options,
        public depthConverter: DepthConverter,
        currentTissues: LoadedTissues) {
        this.tissues = Tissues.createLoaded(currentTissues);
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

    public static createWithoutStatistics(
        gases: Gases,
        segments: Segments,
        options: Options,
        depthConverter: DepthConverter,
        currentTissues: LoadedTissues): AlgorithmContext {
        return new AlgorithmContext(gases, segments, options, depthConverter, currentTissues);
    }

    public static createForCeilings(
        gases: Gases,
        segments: Segments,
        options: Options,
        depthConverter: DepthConverter,
        currentTissues: LoadedTissues): AlgorithmContext {
        const context = new AlgorithmContext(gases, segments, options, depthConverter, currentTissues);
        context.collectStatistics = context.addCeilingStatistics;
        return context;
    }

    public static createForFullStatistics(
        gases: Gases,
        segments: Segments,
        options: Options,
        depthConverter: DepthConverter,
        currentTissues: LoadedTissues): AlgorithmContext {
        const context = new AlgorithmContext(gases, segments, options, depthConverter, currentTissues);
        context.collectStatistics = context.addFullStatistics;
        return context;
    }

    public get currentGas(): Gas {
        return this._currentGas;
    }

    public get ascentSpeed(): number {
        return this.speeds.ascent(this.currentDepth);
    }

    /** Gets depth at end of last segment */
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

    public get shouldAddAirBreaks(): boolean {
        return this.isBreathingOxygen && this.options.airBreaks.enabled;
    }

    public get runTimeOnOxygen(): number {
        return this.runTime - this._oxygenStarted;
    }

    public get finalTissues(): LoadedTissues {
        // Is the same as replace with tissuesHistory.last in case collected history.
        return this.tissues.finalState();
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

    public withoutStatistics() : AlgorithmContext {
        this.collectStatistics = this.noStatistics;
        return this;
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

    public addStatistics(currentDepth: number): void {
        this.collectStatistics(currentDepth);
    }

    private noStatistics(currentDepth: number): void {}

    private addCeilingStatistics(currentDepth: number): void {
        this.addCeiling();
    }

    private addFullStatistics(currentDepth: number): void {
        this.addCeiling();

        // following methods slow down calculation 2x
        this.tissuesHistory.push(this.tissues.finalState());

        if (!FeatureFlags.Instance.collectSaturation) {
            return;
        }

        const ambientPressure = this.depthConverter.toBar(currentDepth);
        const currentOverPressures = this.tissues.saturationRatio(ambientPressure, this.depthConverter.surfacePressure, 1);
        this.tissueOverPressures.push(currentOverPressures);
    }

    public loadTissues(segment: LoadSegment, gas: Gas): number {
        return this.tissues.load(segment, gas);
    }

    public createMemento(): ContextMemento {
        return {
            runTime: this.runTime,
            oxygenStarted: this._oxygenStarted,
            tissuesHistory: this.tissuesHistory.length,
            lastTissues: this.finalTissues,
            ceilings: this.ceilings.length,
            tissueOverPressures: this.tissueOverPressures.length,
            segments: this.segments.length,
            lowestCeiling: this.gradients.lowestCeiling
        };
    }

    public restore(memento: ContextMemento): void {
        // here we don't copy, since we expect it wasn't touched
        this.tissuesHistory = this.tissuesHistory.slice(0, memento.tissuesHistory);
        this.tissues.restoreFrom(memento.lastTissues);
        this.gradients.lowestCeiling = memento.lowestCeiling;
        this.runTime = memento.runTime;
        this._oxygenStarted = memento.oxygenStarted;
        // ceilings, segments and saturationRatios are only added
        this.ceilings = this.ceilings.slice(0, memento.ceilings);
        this.tissueOverPressures = this.tissueOverPressures.slice(0, memento.tissueOverPressures);
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

    public addStopSegment(duration: number): Segment {
        return this.segments.addFlat(this.currentGas, duration);
    }

    public airBreakGas(): Gas {
        return this.gasSource.airBreakGas(this.currentDepth, this.currentGas);
    }
}

export class AirBreakContext {
    /** in seconds */
    private readonly maxOxygenTime: number;
    /** in seconds */
    private readonly maxBottomGasTime: number;
    private _initialStopDuration: number;

    constructor(private readonly context: AlgorithmContext, private remainingStopTime: number) {
        this.maxOxygenTime = this.context.options.airBreaks.oxygenDuration * Time.oneMinute;
        this.maxBottomGasTime = this.context.options.airBreaks.bottomGasDuration * Time.oneMinute;

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
