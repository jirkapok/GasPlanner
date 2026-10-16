import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { Streamed } from '../streamed';
import { PlanRequestFactory } from '../planRequestFactory';
import { WorkersFactoryCommon } from '../serial.workers.factory';
import { IRestartableTask } from '../../workers/background-task';
import {
    ComputerPointDto, ComputerRequestDto,
    ComputerResultDto, ComputerStartedDto
} from '../serialization.model';
import { ComputerData, RunTimePoint, StopEvent } from './computer.model';
import { ComputerProfile } from './computerProfile';

/**
 * Source data for the dive computer simulator.
 * Keeps its own dive selection (first dive by default), independent of the planner selected dive.
 * The computer data of the selected dive are calculated in background and streamed point by point.
 * The collected data and progress are published at most every 200 ms and always when the calculation finished.
 */
@Injectable()
export class ComputerProfileService extends Streamed {
    /** in milliseconds */
    private static readonly reportInterval = 200;
    /**
     * Empty, when new calculation starts, then copy of already calculated data every 200 ms
     * and complete data when the calculation finished.
     */
    public readonly computerData$: Observable<ComputerData>;
    /** Percents (0 - 100) of already calculated points of the current calculation, published together with computerData$ */
    public readonly progress$: Observable<number>;
    private _selectedDive: DiveSchedule;
    private readonly onComputerData = new BehaviorSubject<ComputerData>(ComputerProfile.empty());
    private readonly onProgress = new BehaviorSubject<number>(0);
    private readonly task: IRestartableTask<ComputerRequestDto, ComputerResultDto>;
    private calculationId = 0;
    private running = false;
    private total = 0;
    /** Data received from the worker in the current calculation, not published yet */
    private collected: ComputerData = ComputerProfile.empty();
    /** Date.now() of last published data or start of the calculation */
    private lastReportTime = 0;

    constructor(private schedules: DiveSchedules, private dispatcher: ReloadDispatcher, workers: WorkersFactoryCommon) {
        super();
        this._selectedDive = this.schedules.dives[0];
        this.computerData$ = this.onComputerData.asObservable();
        this.progress$ = this.onProgress.asObservable();
        this.task = workers.createComputerWorker();

        // subscribe before the first calculation, the serial worker reports synchronously
        this.task.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((message) => this.processMessage(message));

        this.task.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.calculationFailed());

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.diveCalculated(diveId));

        // In case dive removed
        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.resetIfRemoved());

        this.refresh();
    }

    /** The dive selected within this service, the current computer data are calculated from */
    public get selectedDive(): DiveSchedule {
        return this._selectedDive;
    }

    public get selectedIndex(): number {
        return this._selectedDive.index;
    }

    /** Last published computer data */
    public get computerData(): ComputerData {
        return this.onComputerData.value;
    }

    private get selectedRemoved(): boolean {
        return !this.schedules.dives.includes(this._selectedDive);
    }

    public select(index: number): void {
        const dives = this.schedules.dives;

        if (index < 0 || index >= dives.length || dives[index] === this._selectedDive) {
            return;
        }

        this._selectedDive = dives[index];
        this.refresh();
    }

    private diveCalculated(diveId?: number): void {
        // dives may be cleared and reloaded without depth changed event
        if (this.selectedRemoved) {
            this.selectFirst();
            return;
        }

        if (diveId === undefined || diveId === this._selectedDive.id) {
            this.refresh();
        }
    }

    private resetIfRemoved(): void {
        if (this.selectedRemoved) {
            this.selectFirst();
        }
    }

    private selectFirst(): void {
        this._selectedDive = this.schedules.dives[0];
        this.refresh();
    }

    /** Interrupts running calculation, resets the data and starts new calculation */
    private refresh(): void {
        if (this.running) {
            this.task.cancel();
        }

        this.calculationId++;
        this.running = false;
        this.total = 0;
        this.collected = ComputerProfile.empty();
        this.lastReportTime = Date.now();
        this.onComputerData.next(ComputerProfile.empty());
        this.onProgress.next(0);
        const results = this._selectedDive.diveResult;

        if (results.failed || !results.profileCalculated || !results.diveInfoCalculated) {
            return;
        }

        const dive = this._selectedDive;
        const request = PlanRequestFactory.create(dive, this.schedules.previousDiveTissues(dive.id));
        this.running = true;
        this.task.calculate({ ...request, calculationId: this.calculationId });
    }

    private processMessage(message: ComputerResultDto): void {
        // message of interrupted calculation
        if (message.calculationId !== this.calculationId) {
            return;
        }

        switch (message.type) {
            case 'started':
                this.started(message);
                break;
            case 'point':
                this.pointCalculated(message);
                break;
            case 'finished':
                this.finished();
                break;
        }
    }

    private started(message: ComputerStartedDto): void {
        this.total = message.total;
        this.collected = { profile: [], events: message.events };
    }

    private pointCalculated(message: ComputerPointDto): void {
        const { nextStopIndex, ...values } = message.point;
        const point: RunTimePoint = { ...values };

        if (nextStopIndex !== undefined) {
            point.nextStop = this.collected.events[nextStopIndex] as StopEvent;
        }

        this.collected.profile.push(point);

        if (Date.now() - this.lastReportTime >= ComputerProfileService.reportInterval) {
            this.report(Math.round(this.collected.profile.length * 100 / this.total));
        }
    }

    private finished(): void {
        this.running = false;
        this.report(100);
    }

    /** Publishes copy of already collected data, so the published data aren't changed by later points */
    private report(progress: number): void {
        this.lastReportTime = Date.now();
        this.onComputerData.next({
            profile: this.collected.profile.slice(),
            events: this.collected.events
        });
        this.onProgress.next(progress);
    }

    private calculationFailed(): void {
        this.running = false;
        this.onComputerData.next(ComputerProfile.empty());
        this.onProgress.next(100);
    }
}
