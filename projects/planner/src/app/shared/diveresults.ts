import {
    Ceiling, EventType, Event, HighestDensity,
    OtuCalculator, LoadedTissue, TissueOverPressures
} from 'scuba-physics';
import { Injectable } from '@angular/core';
import { WayPoint } from './wayPoint';

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
    public finalTissues: LoadedTissue[] = [];
    // 16 tissues overpressure history
    public tissueOverPressures: TissueOverPressures[] = [];
    public events: Event[] = [];


    private _calculatingProfile = false;
    private _calculatingDiveInfo = false;
    private _calculatingConsumption = false;
    private _profileCalculated = false;
    private _diveInfoCalculated = false;
    private _consumptionCalculated = false;
    private _calculationFailed = false;

    public get diveInfoCalculated(): boolean {
        return this._diveInfoCalculated;
    }

    /**
     * Only if both consumption and dive info finished already, since they are running in parallel.
     * Not checking if background calculation is still running, so this only shows last known state.
     * */
    public get calculated(): boolean {
        return this._consumptionCalculated && this.diveInfoCalculated;
    }

    public get running(): boolean {
        return !this.calculated || this._calculatingConsumption || this._calculatingDiveInfo;
    }

    public get profileCalculated(): boolean {
        return this._profileCalculated;
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
        return this._diveInfoCalculated && this.noDecoTime < DiveResults.maxAcceptableNdl;
    }

    public get noDecoExceeded(): boolean {
        return this.planDuration > this.noDecoTime;
    }

    /** the only errors preventing draw chart */
    public get hasErrors(): boolean {
        return this.calculated && (this.failed || this.notEnoughTime);
    }

    public get showResults(): boolean {
        return this._consumptionCalculated && !this.hasErrors;
    }

    public get otuExceeded(): boolean {
        return this.otu > (.8 * OtuCalculator.dailyLimit);
    }

    public get cnsExceeded(): boolean {
        return this.cns > 80;
    }

    public get showMaxDuration(): boolean {
        return this._consumptionCalculated && this.showMaxBottomTime;
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
        this._calculatingProfile = true;
        this._calculatingConsumption = true;
        this._calculatingDiveInfo = true;
        this._calculationFailed = false;
    }

    /** Marks each part as not calculated */
    public showStillRunning(): void {
        if (this._calculatingProfile) {
            this._profileCalculated = false;
            this.emptyProfile();
        }

        if (this._calculatingDiveInfo) {
            this._diveInfoCalculated = false;
        }

        if (this._calculatingConsumption) {
            this._consumptionCalculated = false;
        }
    }

    public profileFinished(): void {
        this._profileCalculated = true;
        this._calculatingProfile = false;
    }

    public diveInfoFinished(): void {
        this._diveInfoCalculated = true;
        this._calculatingDiveInfo = false;
    }

    public consumptionFinished(): void {
        this._consumptionCalculated = true;
        this._calculatingConsumption = false;
    }

    public endFailed(): void {
        this.profileFinished();
        this.diveInfoFinished();
        this.consumptionFinished();
        this.emptyProfile();
        this._calculationFailed = true;
    }

    private emptyProfile(): void {
        this.wayPoints = [];
        this.ceilings = [];
        this.events = [];
        this.tissueOverPressures = [];
    }
}
