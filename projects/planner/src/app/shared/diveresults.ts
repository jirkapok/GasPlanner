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
    public noDecoTime = 0;
    public maxTime = 0;
    public timeToSurface = 0;
    public turnPressure = 0;
    public turnTime = 0;
    public needsReturn = false;
    public notEnoughGas = false;
    public notEnoughTime = false;
    public planDuration = 0;
    public emergencyAscentStart = 0;
    public averageDepth = 0;
    public surfaceGradient = 0;
    public offgasingStartTime = 0;
    public offgasingStartDepth = 0;
    public otu = 0;
    public cns = 0;
    public highestDensity = HighestDensity.createDefault();
    public wayPoints: WayPoint[] = [];
    public ceilings: Ceiling[] = [];
    /** In meaning of at end of the dive */
    public finalTissues: LoadedTissues = ProfileTissues.createAtSurface(0);
    // 16 tissues overpressure history
    public tissueOverPressures: TissueOverPressures[] = [];
    public events: Event[] = [];

    private profileCalculation = new CalculationState();
    private consumptionCalculation = new CalculationState();
    private diveInfoCalculation = new CalculationState();
    private _calculationFailed = false;

    /**
     * Only if both consumption and dive info finished already, since they are running in parallel.
     * Not checking if background calculation is still running, so this only shows last known state.
     * */
    public get calculated(): boolean {
        return this.consumptionCalculated && this.diveInfoCalculated;
    }

    // TODO CNS, OTU and average depth are calculated in dive info, not in profile
    // issues should be updated after dive info finished
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
        if (this.wayPoints.length === 0) {
            return 0;
        }

        return this.wayPoints[this.wayPoints.length - 1].endTime;
    }

    public get ndlValid(): boolean {
        return this.diveInfoCalculated && this.noDecoTime < DiveResults.maxAcceptableNdl;
    }

    public get noDecoExceeded(): boolean {
        return this.planDuration > this.noDecoTime;
    }

    /** the only errors preventing draw chart */
    public get hasErrors(): boolean {
        return this.calculated && (this.failed || this.notEnoughTime);
    }

    public get showResults(): boolean {
        return this.consumptionCalculated && !this.hasErrors;
    }

    public get otuExceeded(): boolean {
        return this.otu > (.8 * OtuCalculator.dailyLimit);
    }

    public get cnsExceeded(): boolean {
        return this.cns > 80;
    }

    public get showMaxDuration(): boolean {
        return this.consumptionCalculated && this.showMaxBottomTime;
    }

    public get showMaxBottomTime(): boolean {
        return this.maxTime > 0;
    }

    public get hasErrorEvent(): boolean {
        return this.hasErrors || this.notEnoughGas;
    }

    public get hasWarningEvent(): boolean {
        // TODO move csn and otu to events
        return this.otuExceeded ||
            this.cnsExceeded ||
            !this.events.every(e => {
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
        const count = this.wayPoints.length;
        return count > 0 && this.wayPoints[count - 1].endDepthMeters === 0;
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
            this.emptyProfile();  // TODO adapt to move of ceiling to dive info task
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
        this._calculationFailed = true;
    }

    public profileFinished(): void {
        this.profileCalculation.Finished();
    }

    public diveInfoFinished(): void {
        this.diveInfoCalculation.Finished();
    }

    public consumptionFinished(): void {
        this.consumptionCalculation.Finished();
    }

    private emptyProfile(): void {
        this.wayPoints = [];
        this.ceilings = [];
        this.events = [];
        // TODO empty between profile and dive info or empty all?
        this.tissueOverPressures = [];
    }
}
