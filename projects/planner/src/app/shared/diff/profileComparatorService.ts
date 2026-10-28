import { Injectable } from '@angular/core';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { DiveResults } from '../diveresults';
import { Observable, Subject, takeUntil } from 'rxjs';
import {
    ConsumptionByMix, IConsumedMix,
    SurfaceIntervalParameters, BuhlmannAlgorithm,
    TissueOverPressures
} from 'scuba-physics';
import { ComparedWaypoint } from './ComparedWaypoint';
import { ReloadDispatcher } from '../reloadDispatcher';
import { Streamed } from '../streamed';
import { WayPoint } from '../wayPoint';
import { type HeatMapOverPressures } from '../heatMapPlotter';

export interface SaturationComparison {
    profileAOverPressures: HeatMapOverPressures;
    profileBOverPressures: HeatMapOverPressures;
}

@Injectable()
export class ProfileComparatorService extends Streamed {
    private _profileAIndex = 0;
    private _profileBIndex = 0;
    private _alignByEnd = false;
    private _onSelectionChanged = new Subject<void>();
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

        this.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.updateWayPoints());
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

    /** In seconds */
    public get profileATimeOffset(): number {
        return this.timeOffset(this.profileAResults);
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

    /** In seconds */
    public get profileBTimeOffset(): number {
        return this.timeOffset(this.profileBResults);
    }

    /** Emits upon changed selection of profiles or other diff component options */
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

    public get showConsumption(): boolean {
        return this.profileAResults.showResults && this.profileBResults.showResults;
    }

    public get overPressures(): SaturationComparison {
        const durationDiff = this.profileAResults.totalDuration - this.profileBResults.totalDuration;
        const surfaceInterval = Math.abs(durationDiff);

        // Add to the shorter one and don't store it in the result, since it is used only for the diff
        if(durationDiff > 0) {
            const profileBOverPressures = this.applySurfaceInterval(this.profileB, surfaceInterval);
            return {
                profileAOverPressures: this.profileAResults.tissueOverPressures,
                profileBOverPressures: profileBOverPressures
            };
        }

        const profileAOverPressures = this.applySurfaceInterval(this.profileA, surfaceInterval);
        return {
            profileAOverPressures: profileAOverPressures,
            profileBOverPressures: this.profileBResults.tissueOverPressures
        };
    }

    public get alignByEnd(): boolean {
        return this._alignByEnd;
    }

    /** Deep-copied waypoints with offset applied */
    private get wayPointsA(): WayPoint[]{
        return WayPoint.shiftProfile(
            this.profileAResults.wayPoints,
            this.profileATimeOffset
        );
    }

    /** Deep-copied waypoints with offset applied */
    private get wayPointsB(): WayPoint[]{
        return WayPoint.shiftProfile(
            this.profileBResults.wayPoints,
            this.profileBTimeOffset
        );
    }

    public set alignByEnd(value: boolean) {
        this._alignByEnd = value;
        this._onSelectionChanged.next();
    }

    public selectProfile(index: number): void {
        if(this._profileAIndex === index || this._profileBIndex === index){
            index = this._profileAIndex; // switch selected profiles
        }

        this._profileAIndex = this._profileBIndex;
        this._profileBIndex = index;
        this._onSelectionChanged.next();
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

    /** In seconds, offset aligning end of the given profile to end of the longer one */
    private timeOffset(results: DiveResults): number {
        if (!this.alignByEnd) {
            return 0;
        }

        return this.totalDuration - results.totalDuration;
    }

    /** Waypoints need to be cached to preserve the selection */
    private updateWayPoints(): void {
        this._wayPoints = [];

        if(!this.bothResultsCalculated){
            return;
        }

        const context = new WaypointsDiffContext2([...this.wayPointsA].reverse(), [...this.wayPointsB].reverse());
        this._wayPoints = context.create();
    }

    private applySurfaceInterval(profile: DiveSchedule, surfaceInterval: number): HeatMapOverPressures {
        if (this.alignByEnd) {
            const pressuresBeforeDive = this.applySurfaceIntervalBeforeDive(profile);
            return [...pressuresBeforeDive, ...profile.diveResult.tissueOverPressures];
        }

        const surfacePressures = this.applySurfaceIntervalAfterDive(profile, surfaceInterval);
        return [...profile.diveResult.tissueOverPressures, ...surfacePressures];
    }

    private applySurfaceIntervalBeforeDive(profile: DiveSchedule): HeatMapOverPressures {
        const shorterLength = profile.diveResult.tissueOverPressures.length;
        const longerLength = this.profileAResults.tissueOverPressures.length === shorterLength
            ? this.profileBResults.tissueOverPressures.length
            : this.profileAResults.tissueOverPressures.length;
        return Array.from(
            { length: longerLength - shorterLength },
            () => new Array<null>(16).fill(null)
        ) as HeatMapOverPressures;
    }

    private applySurfaceIntervalAfterDive(profile: DiveSchedule, surfaceInterval: number): TissueOverPressures[] {
        const altitude = profile.optionsService.altitude;
        const tissues = profile.diveResult.finalTissues;
        const parameters = new SurfaceIntervalParameters(tissues, altitude, surfaceInterval);
        const algorithm = new BuhlmannAlgorithm();
        const changes = algorithm.applySurfaceIntervalStatistics(parameters);
        return changes.tissueOverPressures;
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

class WaypointsDiffContext2 {
    private resultComparedWayPoints: ComparedWaypoint[] = [];

    constructor(
        private wayPointsA: WayPoint[],
        private wayPointsB: WayPoint[]
    ) {};

    create() {
        const wayPointsA = this.wayPointsA;
        const wayPointsB = this.wayPointsB;

        let wayPointA = wayPointsA.pop();
        let wayPointB = wayPointsB.pop();

        while (wayPointA || wayPointB) {
            if (!wayPointA) {
                this.finishWithWayPointsB();
                break;
            }
            if (!wayPointB) {
                this.finishWithWayPointsA();
                break;
            }

            if (wayPointA.endTime === wayPointB.endTime) {
                const runtime = wayPointA.endTime;
                const next = new ComparedWaypoint(runtime, wayPointA, wayPointB);
                this.resultComparedWayPoints.push(next);

                wayPointA = this.wayPointsA.pop();
                wayPointB = this.wayPointsB.pop();

            } else if (wayPointA.endTime < wayPointB.endTime) {
                const otherWayPoint = wayPointB.startTime <= wayPointA.endTime
                    ? wayPointB
                    : undefined;

                const runtime = wayPointA.endTime;
                const next = new ComparedWaypoint(runtime, wayPointA, otherWayPoint);
                next.durationB = undefined;
                next.depthB = undefined;

                this.resultComparedWayPoints.push(next);

                if (wayPointB.endTime < this.middleTimeOf(wayPointA)) {
                    wayPointB = wayPointsB.pop();
                }
                wayPointA = wayPointsA.pop();

            } else {
                const otherWayPoint = wayPointA.startTime <= wayPointB.endTime
                    ? wayPointA
                    : undefined;

                const runtime = wayPointB.endTime;
                const next = new ComparedWaypoint(runtime, otherWayPoint, wayPointB);
                next.durationA = undefined;
                next.depthA = undefined;

                this.resultComparedWayPoints.push(next);

                if (wayPointA.endTime < this.middleTimeOf(wayPointB)) {
                    wayPointA = wayPointsA.pop();
                }
                wayPointB = wayPointsB.pop();
            }
        }

        return this.resultComparedWayPoints;
    }

    private middleTimeOf(waypoint: WayPoint | undefined): number {
        return waypoint ? (waypoint.endTime + waypoint.startTime) / 2 : Infinity;
    }

    private pushWayPointA(wayPoint: WayPoint) {
        const next = new ComparedWaypoint(wayPoint.endTime, wayPoint, undefined);
        this.resultComparedWayPoints.push(next);
    }

    private pushWayPointB(wayPoint: WayPoint) {
        const next = new ComparedWaypoint(wayPoint.endTime, undefined, wayPoint);
        this.resultComparedWayPoints.push(next);
    }

    private finishWithWayPointsA(): void {
        let wayPoint = this.wayPointsA.pop();
        while (wayPoint) {
            this.pushWayPointA(wayPoint);
            wayPoint = this.wayPointsA.pop();
        }
    }

    private finishWithWayPointsB(): void {
        let wayPoint = this.wayPointsB.pop();
        while (wayPoint) {
            this.pushWayPointB(wayPoint);
            wayPoint = this.wayPointsB.pop();
        }
    }
}
