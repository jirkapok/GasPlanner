import { Injectable } from '@angular/core';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { DiveResults } from '../diveresults';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ConsumptionByMix, IConsumedMix } from 'scuba-physics';
import { ComparedWaypoint } from './ComparedWaypoint';
import { WayPoint } from '../models';
import { ReloadDispatcher } from '../reloadDispatcher';
import { Streamed } from '../streamed';

@Injectable()
export class ProfileComparatorService extends Streamed {
    private _profileAIndex = 0;
    private _profileBIndex = 0;
    private _onSelectionChanged: Subject<void> = new Subject<void>();
    private _selectionChanged$: Observable<void>;
    private _wayPoints: ComparedWaypoint[] = [];

    constructor(private schedules: DiveSchedules, private dispatcher: ReloadDispatcher) {
        super();
        this._selectionChanged$ = this._onSelectionChanged.asObservable();

        if(this.hasTwoProfiles) {
            this.selectProfile(1);
        }

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.updateWayPoints());

        // In case dive removed
        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.resetSelection());
    }

    public get profileAIndex(): number {
        return this._profileAIndex;
    }

    public get profileA(): DiveSchedule {
        return this.schedules.dives[this._profileAIndex];
    }

    public get profileATitle(): string {
        return this.profileA.title;
    }

    public get profileAResults(): DiveResults {
        return this.profileA.diveResult;
    }

    public get profileAConsumed(): IConsumedMix[] {
        return ConsumptionByMix.combine(this.profileA.tanksService.tankData);
    }

    public get profileBIndex(): number {
        return this._profileBIndex;
    }

    public get profileB(): DiveSchedule {
        return this.schedules.dives[this._profileBIndex];
    }

    public get profileBTitle(): string {
        return this.profileB.title;
    }

    public get profileBResults(): DiveResults {
        return this.profileB.diveResult;
    }

    public get profileBConsumed(): IConsumedMix[] {
        return ConsumptionByMix.combine(this.profileB.tanksService.tankData);
    }

    public get selectionChanged$(): Observable<void> {
        return this._selectionChanged$;
    }

    public get totalDuration(): number {
        if(this.profileAResults.totalDuration > this.profileBResults.totalDuration){
            return this.profileAResults.totalDuration;
        }
        return this.profileBResults.totalDuration;
    }

    public get bothResultsCalculated(): boolean {
        return this.profileAResults.calculated && !this.profileAResults.failed &&
            this.profileBResults.calculated && !this.profileBResults.failed;
    }

    public get difference(): ComparedWaypoint[] {
        return this._wayPoints;
    }

    public get hasTwoProfiles(): boolean {
        return this.schedules.length > 1;
    }

    public get diveInfosCalculated(): boolean {
        return this.profileAResults.diveInfoCalculated && this.profileBResults.diveInfoCalculated;
    }

    public get profilesCalculated(): boolean {
        return this.profileAResults.profileCalculated && this.profileBResults.profileCalculated;
    }

    private get wayPointsA(): WayPoint[]{
        return this.profileAResults.wayPoints;
    }

    private get wayPointsB(): WayPoint[]{
        return this.profileBResults.wayPoints;
    }

    public selectProfile(index: number): void {
        if(this._profileAIndex === index || this._profileBIndex === index){
            index = this._profileAIndex; // switch selected profiles
        }

        this._profileAIndex = this._profileBIndex;
        this._profileBIndex = index;
        this.updateWayPoints();
        this._onSelectionChanged.next();
    }

    public waitUntilProfilesCalculated(): Promise<void> {
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if(this.profilesCalculated){
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    private resetSelection(): void {
        const maxIndex = this.schedules.length;

        if(this._profileAIndex >= maxIndex) {
            this._profileAIndex = 0;
        }

        if(this._profileBIndex >= maxIndex) {
            this._profileBIndex = 0;
        }

        this.updateWayPoints();
    }

    /** Waypoints need to be cached to preserve the selection */
    private updateWayPoints(): void {
        this._wayPoints = [];

        if(!this.bothResultsCalculated){
            return;
        }

        const context = new WaypointsDiffContext([...this.wayPointsA], [...this.wayPointsB]);

        while(context.hasNext) {
            const row = context.toRow();
            this._wayPoints.unshift(row);
            context.next();
        }
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
        const row = new ComparedWaypoint(runtime, this.waypointA, this.waypointB);

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
