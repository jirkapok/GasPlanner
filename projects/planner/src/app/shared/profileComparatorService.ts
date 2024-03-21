import { Injectable } from '@angular/core';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { DiveResults } from './diveresults';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConsumptionByMix, IConsumedMix } from 'scuba-physics';
import { ComparedWaypoint } from './ComparedWaypoint';
import { WayPoint } from './models';

@Injectable()
export class ProfileComparatorService {
    private _profileAIndex: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _profileBIndex: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    constructor(private schedules: DiveSchedules) {
    }

    public get profileATitle(): string {
        return this.profileA.title;
    }

    public get profileBTitle(): string {
        return this.profileB.title;
    }

    public get totalDuration(): number {
        if(this.profileAResults.totalDuration > this.profileBResults.totalDuration){
            return this.profileAResults.totalDuration;
        }
        return this.profileBResults.totalDuration;
    }

    public get profileAIndex(): Observable<number> {
        return this._profileAIndex.asObservable();
    }

    public get profileBIndex(): Observable<number> {
        return this._profileBIndex.asObservable();
    }

    public get profileA(): DiveSchedule {
        return this.schedules.dives[this._profileAIndex.getValue()];
    }

    public get profileB(): DiveSchedule {
        return this.schedules.dives[this._profileBIndex.getValue()];
    }

    public get profileAResults(): DiveResults {
        return this.profileA.diveResult;
    }

    public get profileBResults(): DiveResults {
        return this.profileB.diveResult;
    }

    public get profileACombinedTanks(): IConsumedMix[] {
        return ConsumptionByMix.combine(this.profileA.tanksService.tankData);
    }

    public get profileBCombinedTanks(): IConsumedMix[] {
        return ConsumptionByMix.combine(this.profileB.tanksService.tankData);
    }

    public get bothResultsCalculated(): boolean {
        return this.profileAResults.calculated && !this.profileAResults.failed &&
            this.profileBResults.calculated && !this.profileBResults.failed;
    }

    public get difference(): ComparedWaypoint[] {
        if(!this.bothResultsCalculated){
            return [];
        }

        const context = new WaypointsDiffContext([...this.wayPointsA], [...this.wayPointsB]);
        const waypointRows = [];

        while(context.hasNext) {
            const row = context.toRow();
            waypointRows.unshift(row);
            context.next();
        }

        return waypointRows;
    }

    private get wayPointsA(): WayPoint[]{
        return this.profileAResults.wayPoints;
    }

    private get wayPointsB(): WayPoint[]{
        return this.profileBResults.wayPoints;
    }

    private set profileAIndex(value: number) {
        this._profileAIndex.next(value);
    }

    private set profileBIndex(value: number) {
        this._profileBIndex.next(value);
    }

    public hasTwoProfiles(): boolean {
        return this.schedules.length > 1;
    }

    public areDiveInfosCalculated(): boolean {
        return this.profileAResults.diveInfoCalculated && this.profileBResults.diveInfoCalculated;
    }

    public areProfilesCalculated(): boolean {
        return this.profileAResults.profileCalculated && this.profileBResults.profileCalculated;
    }

    public appendProfileToProfileComparison(index: number): boolean {
        if(this._profileAIndex.getValue() === index || this._profileBIndex.getValue() === index){
            return true;
        }

        this.profileAIndex = this._profileBIndex.getValue();
        this.profileBIndex = index;
        return true;
    }

    public waitUntilProfilesCalculated(): Promise<void> {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if(this.areProfilesCalculated()){
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
}

class WaypointsDiffContext {
    public waypointA: WayPoint | undefined;
    public waypointB: WayPoint | undefined;
    private readonly defaultTime = -1;
    private _endTimeA = this.defaultTime;
    private _endTimeB = this.defaultTime;

    constructor(private wayPointsA: WayPoint[], private wayPointsB: WayPoint[]) {
        this.updateA();
        this.updateB();
    }

    public get hasNext(): boolean {
        return !!(this.waypointA || this.waypointB);
    }

    private get dominantA(): boolean {
        return this._endTimeA > this._endTimeB;
    }

    private get dominantB(): boolean {
        return this._endTimeB > this._endTimeA;
    }

    public next(): void {
        if (this.dominantA) {
            this.updateA();
        } else if (this.dominantB) {
            this.updateB();
        } else {
            this.updateA();
            this.updateB();
        }
    }

    public toRow(): ComparedWaypoint {
        const runtime = this.dominantA ? this._endTimeA : this._endTimeB;
        const row: ComparedWaypoint = {
            runTime: runtime,
            durationA: this.waypointA?.duration,
            depthA: this.waypointA?.endDepth,
            durationB: this.waypointB?.duration,
            depthB: this.waypointB?.endDepth,
        };

        if (this.dominantA) {
            row.durationB = undefined;
            row.depthB = undefined;
        } else if (this.dominantB) {
            row.durationA = undefined;
            row.depthA = undefined;
        }

        return row;
    }

    private updateA(): void {
        this.waypointA = this.wayPointsA.pop();
        this._endTimeA = this.waypointA?.endTime ?? this.defaultTime;
    }

    private updateB(): void {
        this.waypointB = this.wayPointsB.pop();
        this._endTimeB = this.waypointB?.endTime ?? this.defaultTime;
    }
}
