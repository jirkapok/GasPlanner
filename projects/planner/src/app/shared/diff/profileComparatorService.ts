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

/** Creates a ProfileComparison from two DiveSchedules, taking alignByEnd into consideration */
export class ProfileComparisonBuilder {
    private pressuresA: HeatMapOverPressures = [];
    private pressuresB: HeatMapOverPressures = [];

    constructor(
        private scheduleA: DiveSchedule,
        private scheduleB: DiveSchedule,
        private alignByEnd: boolean
    ) {}

    private get diveDurationA(): number {
        return this.scheduleA.diveResult.totalDuration;
    }

    private get diveDurationB(): number {
        return this.scheduleB.diveResult.totalDuration;
    }

    private get restDurationA(): number {
        return this.scheduleA.restInterval;
    }

    private get restDurationB(): number {
        return this.scheduleB.restInterval;
    }

    private get totalDurationA(): number {
        return this.diveDurationA + this.restDurationA;
    }

    private get totalDurationB(): number {
        return this.diveDurationB + this.restDurationB;
    }

    private get dives(): { longer: DiveResults, shorter: DiveResults } {
        if (this.diveDurationA < this.diveDurationB) {
            return {
                longer: this.scheduleB.diveResult,
                shorter: this.scheduleA.diveResult
            };
        }
        return {
            longer: this.scheduleA.diveResult,
            shorter: this.scheduleB.diveResult
        };
    }

    private get schedules(): { longer: DiveSchedule, shorter: DiveSchedule } {
        if (this.totalDurationA < this.totalDurationB) {
            return {
                longer: this.scheduleB,
                shorter: this.scheduleA
            };
        }
        return {
            longer: this.scheduleA,
            shorter: this.scheduleB
        };
    }

    private get restSchedules(): { longer: DiveSchedule, shorter: DiveSchedule } {
        if (this.restDurationA < this.restDurationB) {
            return {
                longer: this.scheduleB,
                shorter: this.scheduleA
            };
        }
        return {
            longer: this.scheduleA,
            shorter: this.scheduleB
        };
    }

    private get rests(): { longer: number, shorter: number } {
        if (this.restDurationA < this.restDurationB) {
            return {
                longer: this.restDurationB,
                shorter: this.restDurationA
            };
        }
        return {
            longer: this.restDurationA,
            shorter: this.restDurationB
        };
    }

    private get pressuresAsComparison(): SaturationComparison {
        return {
            profileAOverPressures: this.pressuresA,
            profileBOverPressures: this.pressuresB
        };
    }

    public createSaturationComparison(): SaturationComparison {
        if (this.alignByEnd) {
            this.createEndAlignPressures();
        } else {
            this.createStartAlignPressures();
        }

        return this.pressuresAsComparison;
    }

    private createStartAlignPressures(): void {
        const longerDuration = this.dives.longer.totalDuration + this.rests.longer;
        const shorterDuration = this.dives.shorter.totalDuration + this.rests.shorter;
        const diff = longerDuration - shorterDuration;

        const longerPressures = this.schedules.longer.overPressuresWithSurfaceInterval();
        const shorterPressures = this.schedules.shorter.overPressuresWithSurfaceInterval(diff);

        if (this.totalDurationA < this.totalDurationB) {
            this.pressuresA = shorterPressures;
            this.pressuresB = longerPressures;
        } else {
            this.pressuresA = longerPressures;
            this.pressuresB = shorterPressures;
        }
    }

    private createEndAlignPressures(): void {
        const divePressuresDiff =
            Math.abs(this.dives.longer.tissueOverPressures.length - this.dives.shorter.tissueOverPressures.length);
        const emptyPressures = this.getEmptyPressures(divePressuresDiff);

        const restDiff = this.rests.longer - this.rests.shorter;
        const longerPressures = this.restSchedules.longer.overPressuresWithSurfaceInterval();
        const shorterPressures = this.restSchedules.shorter.overPressuresWithSurfaceInterval(restDiff);

        if (this.diveDurationA < this.diveDurationB) {
            this.pressuresA = emptyPressures;
        } else {
            this.pressuresB = emptyPressures;
        }

        if (this.restDurationA < this.restDurationB) {
            this.pressuresA = [...this.pressuresA, ...shorterPressures];
            this.pressuresB = [...this.pressuresB, ...longerPressures];
        } else {
            this.pressuresA = [...this.pressuresA, ...longerPressures];
            this.pressuresB = [...this.pressuresB, ...shorterPressures];
        }
    }

    private getEmptyPressures(lengthDiff: number): HeatMapOverPressures {
        return Array.from(
            { length: lengthDiff },
            () => new Array<null>(16).fill(null)
        ) as HeatMapOverPressures;
    }
}
