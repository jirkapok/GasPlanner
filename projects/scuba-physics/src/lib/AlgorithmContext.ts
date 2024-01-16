import { LoadedTissue, Tissue, Tissues } from './Tissues';
import { Ceiling } from './Profile';
import { BestGasOptions, Gas, Gases, OCGasSource } from './Gases';
import { GradientFactors, SubSurfaceGradientFactors } from './GradientFactors';
import { AscentSpeeds } from './speeds';
import { DepthLevels } from './DepthLevels';
import { Segment, Segments } from './Segments';
import { Options } from './Options';
import { DepthConverter } from './depth-converter';
import { Time } from './Time';

export interface ContextMemento {
    tissues: Tissue[];
    ceilings: number;
    segments: number;
    runTime: number;
    lowestCeiling: number;
}

export class AlgorithmContext {
    public tissues: Tissues;
    public ceilings: Ceiling[] = [];
    public currentGas: Gas;
    /** in seconds */
    public runTime = 0;
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
        this.currentGas = last.gas;

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

    public get ascentSpeed(): number {
        return this.speeds.ascent(this.currentDepth);
    }

    public get currentDepth(): number {
        return this.segments.currentDepth;
    }

    public get ambientPressure(): number {
        return this.depthConverter.toBar(this.currentDepth);
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

    public addGasSwitchSegment(): Segment {
        const duration = this.options.gasSwitchDuration * Time.oneMinute;
        return this.addStopSegment(duration);
    }

    public addDecoStopSegment(): Segment {
        return this.addStopSegment(0);
    }

    public addSafetyStopSegment(): Segment {
        const duration = Time.safetyStopDuration;
        return this.addStopSegment(duration);
    }

    public addAscentSegment(nextStop: number, duration: number): Segment {
        return this.segments.add(this.currentDepth, nextStop, this.currentGas, duration);
    }

    private addStopSegment(duration: number): Segment {
        return this.segments.add(this.currentDepth, this.currentDepth, this.currentGas, duration);
    }
}
