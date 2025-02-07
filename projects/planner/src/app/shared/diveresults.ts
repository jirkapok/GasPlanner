import {
    Ceiling, EventType, Event, HighestDensity,
    OtuCalculator, TissueOverPressures, LoadedTissues,
    ProfileTissues
} from 'scuba-physics';
import { Injectable } from '@angular/core';
import { WayPoint } from './wayPoint';

class CalculationState {
    private _calculating = false;
    private _calculated = false;

    public get calculated(): boolean {
        return this._calculated;
    }

    public get running(): boolean {
        return this._calculating;
    }

    public start(): void {
        this._calculating = true;
    }

    public stillRunning(): void {
        if (this._calculating) {
            this._calculated = false;
        }
    }

    public Finished(): void {
        this._calculated = true;
        this._calculating = false;
    }
}

@Injectable()
export class DiveResults {
    private static readonly maxAcceptableNdl = 1000;

    // Profile related
    private _wayPoints: WayPoint[] = [];
    private _finalTissues: LoadedTissues = ProfileTissues.createAtSurface(0);

    // Dive info related
    private _noDecoTime = 0;
    private _notEnoughTime = false;
    private _planDuration = 0;
    private _averageDepth = 0;
    private _surfaceGradient = 0;
    private _offgasingStartTime = 0;
    private _offgasingStartDepth = 0;
    private _otu = 0;
    private _cns = 0;
    private _highestDensity = HighestDensity.createDefault();
    private _ceilings: Ceiling[] = [];
    // 16 tissues overpressure history
    private _tissueOverPressures: TissueOverPressures[] = [];
    private _events: Event[] = [];

    // Consumption related
    private _maxTime = 0;
    private _timeToSurface = 0;
    private _emergencyAscentStart = 0;
    private _turnPressure = 0;
    private _turnTime = 0;
    private _needsReturn = false;
    private _notEnoughGas = false;

    private profileCalculation = new CalculationState();
    private consumptionCalculation = new CalculationState();
    private diveInfoCalculation = new CalculationState();
    private _calculationFailed = false;

    public get wayPoints(): WayPoint[] {
        return this._wayPoints;
    }

    /** In meaning of at end of the dive */
    public get finalTissues(): LoadedTissues {
        return this._finalTissues;
    }

    public get noDecoTime(): number {
        return this._noDecoTime;
    }

    public get notEnoughTime(): boolean {
        return this._notEnoughTime;
    }

    public get planDuration(): number {
        return this._planDuration;
    }

    public get averageDepth(): number {
        return this._averageDepth;
    }

    public get surfaceGradient(): number {
        return this._surfaceGradient;
    }

    public get offgasingStartTime(): number {
        return this._offgasingStartTime;
    }

    public get offgasingStartDepth(): number {
        return this._offgasingStartDepth;
    }

    public get otu(): number {
        return this._otu;
    }

    public get cns(): number {
        return this._cns;
    }

    public get highestDensity(): HighestDensity {
        return this._highestDensity;
    }

    public get ceilings(): Ceiling[] {
        return this._ceilings;
    }

    public get tissueOverPressures(): TissueOverPressures[] {
        return this._tissueOverPressures;
    }

    public get events(): Event[] {
        return this._events;
    }

    public get maxTime(): number {
        return this._maxTime;
    }

    public get timeToSurface(): number {
        return this._timeToSurface;
    }

    public get emergencyAscentStart(): number {
        return this._emergencyAscentStart;
    }

    public get turnPressure(): number {
        return this._turnPressure;
    }

    public get turnTime(): number {
        return this._turnTime;
    }

    public get needsReturn(): boolean {
        return this._needsReturn;
    }

    public get notEnoughGas(): boolean {
        return this._notEnoughGas;
    }

    /**
     * Only if both consumption and dive info finished already, since they are running in parallel.
     * Not checking if background calculation is still running, so this only shows last known state.
     * */
    public get calculated(): boolean {
        return this.consumptionCalculated && this.diveInfoCalculated;
    }

    public get profileCalculated(): boolean {
        return this.profileCalculation.calculated;
    }

    public get diveInfoCalculated(): boolean {
        return this.diveInfoCalculation.calculated;
    }

    public get consumptionCalculated(): boolean {
        return this.consumptionCalculation.calculated;
    }

    public get running(): boolean {
        return !this.calculated || this.consumptionCalculation.running || this.diveInfoCalculation.running;
    }

    public get failed(): boolean {
        return this._calculationFailed;
    }

    /** can't use plan duration, because it doesn't contain ascent */
    public get totalDuration(): number {
        if (this._wayPoints.length === 0) {
            return 0;
        }

        return this._wayPoints[this._wayPoints.length - 1].endTime;
    }

    public get ndlValid(): boolean {
        return this.diveInfoCalculated && this._noDecoTime < DiveResults.maxAcceptableNdl;
    }

    public get noDecoExceeded(): boolean {
        return this._planDuration > this._noDecoTime;
    }

    /** the only errors preventing draw chart */
    public get hasErrors(): boolean {
        return this.calculated && (this.failed || this._notEnoughTime);
    }

    public get showResults(): boolean {
        return this.consumptionCalculated && !this.hasErrors;
    }

    public get otuExceeded(): boolean {
        return this._otu > (.8 * OtuCalculator.dailyLimit);
    }

    public get cnsExceeded(): boolean {
        return this._cns > 80;
    }

    public get showMaxDuration(): boolean {
        return this.consumptionCalculated && this.showMaxBottomTime;
    }

    public get showMaxBottomTime(): boolean {
        return this._maxTime > 0;
    }

    public get hasErrorEvent(): boolean {
        return this.hasErrors || this._notEnoughGas;
    }

    public get hasWarningEvent(): boolean {
        // TODO move csn and otu to events
        return this.otuExceeded ||
            this.cnsExceeded ||
            !this._events.every(e => {
                switch (e.type) {
                    case EventType.lowPpO2:
                    case EventType.highPpO2:
                    case EventType.highAscentSpeed:
                    case EventType.highDescentSpeed:
                    case EventType.brokenCeiling:
                    case EventType.isobaricCounterDiffusion:
                    case EventType.maxEndExceeded:
                    case EventType.highGasDensity:
                        return false;
                    default: return true;
                }
            });
    }

    public get endsOnSurface(): boolean {
        const count = this._wayPoints.length;
        return count > 0 && this._wayPoints[count - 1].endDepthMeters === 0;
    }

    /** Marks dive calculation in progress */
    public start(): void {
        this.profileCalculation.start();
        this.consumptionCalculation.start();
        this.diveInfoCalculation.start();
        this._calculationFailed = false;
    }

    /** Marks each part as not calculated */
    public showStillRunning(): void {
        if(this.profileCalculation.running) {
            this.emptyProfile();
        }

        if(this.diveInfoCalculation.running) {
            this.emptyDiveInfo();
        }

        if(this.consumptionCalculation.running) {
            this.emptyConsumption();
        }

        this.profileCalculation.stillRunning();
        this.consumptionCalculation.stillRunning();
        this.diveInfoCalculation.stillRunning();
    }

    public endFailed(): void {
        this.profileCalculation.Finished();
        this.consumptionCalculation.Finished();
        this.diveInfoCalculation.Finished();
        this.emptyProfile();
        this.emptyDiveInfo();
        this.emptyConsumption();
        this._calculationFailed = true;
    }

    public updateProfile(wayPoints: WayPoint[], finalTissues: LoadedTissues): void {
        this.updateProfileInternal(wayPoints, finalTissues);
        this.profileCalculation.Finished();
    }

    public updateDiveInfo(
        noDecoTime: number,
        notEnoughTime: boolean,
        planDuration: number,
        averageDepth: number,
        surfaceGradient: number,
        offgasingStartTime: number,
        offgasingStartDepth: number,
        otu: number,
        cns: number,
        highestDensity: HighestDensity,
        ceilings: Ceiling[],
        tissueOverPressures: TissueOverPressures[],
        events: Event[]): void {
        this.updateDiveInfoInternal(noDecoTime, notEnoughTime, planDuration, averageDepth, surfaceGradient,
            offgasingStartTime, offgasingStartDepth, otu, cns, highestDensity, ceilings, tissueOverPressures, events);
        this.diveInfoCalculation.Finished();
    }

    public updateConsumption(
        maxTime: number,
        timeToSurface: number,
        emergencyAscentStart: number,
        turnPressure: number,
        turnTime: number,
        needsReturn: boolean,
        notEnoughGas: boolean): void {
        this.updateConsumptionInternal(maxTime, timeToSurface, emergencyAscentStart,
            turnPressure, turnTime, needsReturn, notEnoughGas);
        this.consumptionCalculation.Finished();
    }

    private emptyProfile(): void {
        this.updateProfileInternal([], ProfileTissues.createAtSurface(0));
    }

    private emptyDiveInfo(): void {
        this.updateDiveInfoInternal(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
    }

    private emptyConsumption(): void {
        this.updateConsumptionInternal(0, 0, 0, 0, 0, false, false);
    }

    private updateProfileInternal(wayPoints: WayPoint[], finalTissues: LoadedTissues): void {
        this._wayPoints = wayPoints;
        this._finalTissues = finalTissues;
    }

    private updateDiveInfoInternal(
        noDecoTime: number,
        notEnoughTime: boolean,
        planDuration: number,
        averageDepth: number,
        surfaceGradient: number,
        offgasingStartTime: number,
        offgasingStartDepth: number,
        otu: number,
        cns: number,
        highestDensity: HighestDensity,
        ceilings: Ceiling[],
        tissueOverPressures: TissueOverPressures[],
        events: Event[]): void {
        this._noDecoTime = noDecoTime;
        this._notEnoughTime = notEnoughTime;
        this._planDuration = planDuration;
        this._averageDepth = averageDepth;
        this._surfaceGradient = surfaceGradient;
        this._offgasingStartTime = offgasingStartTime;
        this._offgasingStartDepth = offgasingStartDepth;
        this._otu = otu;
        this._cns = cns;
        this._highestDensity = highestDensity;
        this._ceilings = ceilings;
        this._tissueOverPressures = tissueOverPressures;
        this._events = events;
    }

    private updateConsumptionInternal(
        maxTime: number,
        timeToSurface: number,
        emergencyAscentStart: number,
        turnPressure: number,
        turnTime: number,
        needsReturn: boolean,
        notEnoughGas: boolean): void {
        this._maxTime = maxTime;
        this._timeToSurface = timeToSurface;
        this._emergencyAscentStart = emergencyAscentStart;
        this._turnPressure = turnPressure;
        this._turnTime = turnTime;
        this._needsReturn = needsReturn;
        this._notEnoughGas = notEnoughGas;
    }
}
