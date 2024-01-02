import {
    Ceiling, EventType, Event, HighestDensity, OtuCalculator, LoadedTissue
} from 'scuba-physics';
import { WayPoint } from './models';
import { Injectable } from '@angular/core';

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
    public otu = 0;
    public cns = 0;
    public highestDensity = HighestDensity.createDefault();
    public wayPoints: WayPoint[] = [];
    public ceilings: Ceiling[] = [];
    public finalTissues: LoadedTissue[] = [];
    public events: Event[] = [];


    private _calculatingProfile = false;
    private _calculatingDiveInfo = false;
    private _calculating = false;
    private _profileCalculated = false;
    private _diveInfoCalculated = false;
    private _calculated = false;
    private _calculationFailed = false;

    public get diveInfoCalculated(): boolean {
        return this._diveInfoCalculated;
    }

    public get calculated(): boolean {
        return this._calculated;
    }

    public get profileCalculated(): boolean {
        return this._profileCalculated;
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
        return this._calculated && (this._calculationFailed || this.notEnoughTime);
    }

    public get showResults(): boolean {
        return this._calculated && !this.hasErrors;
    }

    public get otuExceeded(): boolean {
        return this.otu > (.8 * OtuCalculator.dailyLimit);
    }

    public get cnsExceeded(): boolean {
        return this.cns > 80;
    }

    public get showMaxDuration(): boolean {
        return this._calculated && this.maxTime > 0;
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
                    case EventType.switchToHigherN2:
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

    public emptyProfile(): void {
        this.wayPoints = [];
        this.ceilings = [];
        this.events = [];
    }

    public endCalculation(): void {
        this._profileCalculated = true;
        this._diveInfoCalculated = true;
        this._calculated = true;
    }

    public startCalculatingState(): void {
        this._calculating = true;
        this._calculatingProfile = true;
        this._calculatingDiveInfo = true;
    }

    public endCalculationProgress(): void {
        this._calculating = false;
        this._calculatingProfile = false;
        this._calculatingDiveInfo = false;
    }

    public showStillRunning(): void {
        if (this._calculatingProfile) {
            this._profileCalculated = false;
            this.emptyProfile();
        }

        if (this._calculatingDiveInfo) {
            this._diveInfoCalculated = false;
        }

        if (this._calculating) {
            this._calculated = false;
        }
    }

    public profileCalculationFinished(): void {
        this._profileCalculated = true;
        this._calculatingProfile = false;
    }

    public diveInfoCalculationFinished(): void {
        this._diveInfoCalculated = true;
        this._calculatingDiveInfo = false;
    }

    public consumptionCalculationFinished(): void {
        this._calculationFailed = false;
        this._calculating = false;
    }

    public calculationFailed(): void {
        this._calculationFailed = true;
        this.events = [];
        this.wayPoints = [];
        this.ceilings = [];
    }
}
