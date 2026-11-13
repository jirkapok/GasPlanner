import { Injectable, signal } from '@angular/core';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { DiveResults } from '../diveresults';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ConsumptionByMix, IConsumedMix } from 'scuba-physics';
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
    // selection is shown by several components, way points are updated by web worker results
    private readonly _profileAIndex = signal(0);
    private readonly _profileBIndex = signal(0);
    private readonly _alignByEnd = signal(false);
    private _onSelectionChanged = new Subject<void>();
    private _selectionChanged$: Observable<void>;
    private readonly _wayPoints = signal<ComparedWaypoint[]>([]);

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
        return this._profileAIndex();
    }

    public get profileA(): DiveSchedule {
        return this.schedules.dives[this.profileAIndex];
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
        return this._profileBIndex();
    }

    public get profileB(): DiveSchedule {
        return this.schedules.dives[this.profileBIndex];
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
        return this._wayPoints();
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
        const builder = new ProfileComparisonBuilder(this.profileA, this.profileB, this.alignByEnd);
        return builder.createSaturationComparison();
    }

    public get alignByEnd(): boolean {
        return this._alignByEnd();
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
        this._alignByEnd.set(value);
        this._onSelectionChanged.next();
    }

    public selectProfile(index: number): void {
        if(this.profileAIndex === index || this.profileBIndex === index){
            index = this.profileAIndex; // switch selected profiles
        }

        this._profileAIndex.set(this.profileBIndex);
        this._profileBIndex.set(index);
        this._onSelectionChanged.next();
    }

    private resetSelection(): void {
        const maxIndex = this.schedules.length;

        if(this.profileAIndex >= maxIndex) {
            this._profileAIndex.set(0);
        }

        if(this.profileBIndex >= maxIndex) {
            this._profileBIndex.set(0);
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
        if(!this.bothResultsCalculated){
            this._wayPoints.set([]);
            return;
        }

        const builder = new WaypointsDiffBuilder([...this.wayPointsA], [...this.wayPointsB]);
        this._wayPoints.set(builder.createDiveComparison());
    }
}

/** Creates a ComparedWaypoint array from two WayPoint arrays */
class WaypointsDiffBuilder {
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

    public createDiveComparison(): ComparedWaypoint[] {
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
        return this.diveComparison;
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

/** Creates a ProfileComparison from two DiveSchedules, taking alignByEnd into consideration. */
class ProfileComparisonBuilder {
    constructor(
        private readonly scheduleA: DiveSchedule,
        private readonly scheduleB: DiveSchedule,
        private readonly alignByEnd: boolean
    ) {}

    public createSaturationComparison(): SaturationComparison {
        return this.alignByEnd
            ? this.createEndAlignComparison()
            : this.createStartAlignComparison();
    }

    private createStartAlignComparison(): SaturationComparison {
        const totalA = this.totalDuration(this.scheduleA);
        const totalB = this.totalDuration(this.scheduleB);

        const pressuresA = this.pressuresWithPadding(
            this.scheduleA,
            Math.max(0, totalB - totalA)
        );
        const pressuresB = this.pressuresWithPadding(
            this.scheduleB,
            Math.max(0, totalA - totalB)
        );

        return {
            profileAOverPressures: pressuresA,
            profileBOverPressures: pressuresB
        };
    }

    private createEndAlignComparison(): SaturationComparison {
        const divePressuresA = this.scheduleA.diveResult.tissueOverPressures.length;
        const divePressuresB = this.scheduleB.diveResult.tissueOverPressures.length;
        const restA = this.scheduleA.restInterval;
        const restB = this.scheduleB.restInterval;

        const pressuresA = [
            ...this.getEmptyPressures(Math.max(0, divePressuresB - divePressuresA)),
            ...this.pressuresWithPadding(this.scheduleA, Math.max(0, restB - restA))
        ];

        const pressuresB = [
            ...this.getEmptyPressures(Math.max(0, divePressuresA - divePressuresB)),
            ...this.pressuresWithPadding(this.scheduleB, Math.max(0, restA - restB))
        ];

        return {
            profileAOverPressures: pressuresA,
            profileBOverPressures: pressuresB
        };
    }

    private totalDuration(schedule: DiveSchedule): number {
        return schedule.diveResult.totalDuration + schedule.restInterval;
    }

    private pressuresWithPadding(schedule: DiveSchedule, paddingInterval: number): HeatMapOverPressures {
        return paddingInterval > 0
            ? schedule.overPressuresWithSurfaceInterval(paddingInterval)
            : schedule.overPressuresWithSurfaceInterval();
    }

    private getEmptyPressures(length: number): HeatMapOverPressures {
        return Array.from(
            { length },
            () => new Array<null>(16).fill(null)
        ) as HeatMapOverPressures;
    }
}
