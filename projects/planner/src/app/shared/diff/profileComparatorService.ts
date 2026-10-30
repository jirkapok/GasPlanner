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

        const context = new WaypointsDiffBuilder([...this.wayPointsA], [...this.wayPointsB]);
        context.createDiveComparison();
        this._wayPoints = context.diveComparison;
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

/** Creates a ComparedWaypoint array from two WayPoint arrays */
export class WaypointsDiffBuilder {
    public diveComparison: ComparedWaypoint[] = [];
    private wayPointA: WayPoint | undefined;
    private wayPointB: WayPoint | undefined;
    private startTimeA = Infinity;
    private startTimeB = Infinity;
    private endTimeA = -Infinity;
    private endTimeB = -Infinity;

    constructor(
        private wayPointsA: WayPoint[],
        private wayPointsB: WayPoint[]
    ) {
        this.updateA();
        this.updateB();
    }

    private get shorterA(): boolean {
        return this.endTimeA < this.endTimeB;
    }

    private get shorterB(): boolean {
        return this.endTimeB < this.endTimeA;
    }

    private get otherWayPoint(): WayPoint | undefined {
        // If either dive hasn't started yet, don't compare it yet
        if (this.startTimeB > this.endTimeA || this.startTimeA > this.endTimeB) {
            return undefined;
        }

        return this.shorterA ? this.wayPointB : this.wayPointA;
    }

    public createDiveComparison(): void {
        while (this.wayPointA && this.wayPointB) {
            if (this.shorterA) {
                const next = this.pushAWith(this.otherWayPoint);
                next.durationB = undefined;
                next.depthB = undefined;
            } else if (this.shorterB) {
                const next = this.pushBWith(this.otherWayPoint);
                next.durationA = undefined;
                next.depthA = undefined;
            } else {
                this.pushBoth();
            }

            this.next();
        }

        this.finishWithRemaining();
    }

    private next() {
        if (this.shorterA) {
            this.updateA();
        } else if (this.shorterB) {
            this.updateB();
        } else {
            this.updateA();
            this.updateB();
        }
    }

    private updateA(): void {
        this.wayPointA = this.wayPointsA.shift();
        this.startTimeA = this.wayPointA?.startTime ?? Infinity;
        this.endTimeA = this.wayPointA?.endTime ?? -Infinity;
    }

    private updateB(): void {
        this.wayPointB = this.wayPointsB.shift();
        this.startTimeB = this.wayPointB?.startTime ?? Infinity;
        this.endTimeB = this.wayPointB?.endTime ?? -Infinity;
    }

    private pushBoth(): ComparedWaypoint {
        const next = new ComparedWaypoint(this.endTimeA, this.wayPointA, this.wayPointB);
        this.diveComparison.push(next);
        return next;
    }

    private pushAWith(otherWayPoint: WayPoint | undefined): ComparedWaypoint {
        const next = new ComparedWaypoint(this.endTimeA, this.wayPointA, otherWayPoint);
        this.diveComparison.push(next);
        return next;
    }

    private pushBWith(otherWayPoint: WayPoint | undefined): ComparedWaypoint {
        const next = new ComparedWaypoint(this.endTimeB, otherWayPoint, this.wayPointB);
        this.diveComparison.push(next);
        return next;
    }

    private finishWithRemaining() {
        if (!this.wayPointA) {
            this.finishWithDiveB();
        } else if (!this.wayPointB) {
            this.finishWithDiveA();
        }
    }

    private finishWithDiveA(): void {
        while (this.wayPointA) {
            this.pushAWith(undefined);
            this.updateA();
        }
    }

    private finishWithDiveB(): void {
        while (this.wayPointB) {
            this.pushBWith(undefined);
            this.updateB();
        }
    }
}
