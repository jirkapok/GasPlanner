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
        if (!this.alignByEnd) {
            return 0;
        }

        const totalDuration = this.totalDuration;
        const durationA = this.profileAResults.totalDuration;

        return totalDuration - durationA;
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
        if (!this.alignByEnd) {
            return 0;
        }

        const totalDuration = this.totalDuration;
        const durationB = this.profileBResults.totalDuration;

        return totalDuration - durationB;
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

    private get wayPointsA(): WayPoint[]{
        const wayPoints = WayPoint.deepCopyWayPoints(this.profileAResults.wayPoints);

        for (const wayPoint of wayPoints) {
            wayPoint.startTime += this.profileATimeOffset;
            wayPoint.endTime += this.profileATimeOffset;
        }

        return wayPoints;
    }

    private get wayPointsB(): WayPoint[]{
        const wayPoints = WayPoint.deepCopyWayPoints(this.profileBResults.wayPoints);

        for (const wayPoint of wayPoints) {
            wayPoint.startTime += this.profileBTimeOffset;
            wayPoint.endTime += this.profileBTimeOffset;
        }

        return wayPoints;
    }

    public get alignByEnd(): boolean {
        return this._alignByEnd;
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

    /** Waypoints need to be cached to preserve the selection */
    private updateWayPoints(): void {
        this._wayPoints = [];

        if(!this.bothResultsCalculated){
            return;
        }

        const context = new WaypointsDiffContext(
            [...this.profileAResults.wayPoints], [...this.profileBResults.wayPoints],
            [...this.wayPointsA], [...this.wayPointsB]
        );

        while(context.hasNext) {
            const row = context.toRow();
            this._wayPoints.unshift(row);
            context.next();
        }
    }

    private applySurfaceInterval(profile: DiveSchedule, surfaceInterval: number): HeatMapOverPressures {
        if (this.alignByEnd) {
            const surfacePressures = this.applySurfaceIntervalBeforeDive(profile);
            return [...surfacePressures, ...profile.diveResult.tissueOverPressures];
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
            () => Array(16).fill(null)
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

    // Calculate runtime from original WayPoints then set
    // pointers to calculated WayPoints (ones with time offsets)
    constructor(
        private originalWaypointsA: WayPoint[],
        private originalWaypointsB: WayPoint[],
        private calculatedWaypointsA: WayPoint[],
        private calculatedWaypointsB: WayPoint[]
    ) {
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
        this.waypointA = this.calculatedWaypointsA.pop();

        const waypoint = this.originalWaypointsA.pop();
        this._endTimeA = waypoint?.endTime ?? this.defaultTime;

    }

    private updateB(): void {
        this.waypointB = this.calculatedWaypointsB.pop();

        const waypoint = this.originalWaypointsB.pop();
        this._endTimeB = waypoint?.endTime ?? this.defaultTime;
    }
}
