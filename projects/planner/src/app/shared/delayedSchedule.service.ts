import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { SubViewStorage } from './subViewStorage';
import { ReloadDispatcher } from './reloadDispatcher';
import { Streamed } from './streamed';
import { takeUntil } from 'rxjs';
import { DiveSchedules } from './dive.schedules';
import _ from 'lodash';

@Injectable()
export class DelayedScheduleService extends Streamed {
    /**
     * Prevent reoccurring schedule of the same dive.
     * Check one dive only is enough, expecting that withing the delay
     * user is unable to switch to another dive and change it.
     **/
    private scheduledDiveId = 0;
    private delayMilliseconds = 100;
    private lastDiveId = 1;

    constructor(
        private dispatcher: ReloadDispatcher,
        private planner: PlannerService,
        private diveSchedules: DiveSchedules,
        private views: SubViewStorage) {
        super();
    }

    /** Call only once at startup */
    public startScheduling(): void {
        _(this.diveSchedules.dives)
            .filter(d => d.primary)
            .forEach(d => setTimeout(() => this.scheduleDive(d.id), this.delayMilliseconds));

        this.registerEventListeners();
    }

    private registerEventListeners(): void {
        this.dispatcher.tankChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        this.dispatcher.optionsChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        this.dispatcher.depthsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        // we need to serialize since next dive can be calculated only after previous one has results
        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.scheduleNextDive(diveId));
    }

    private schedule(diveId: number): void {
        this.views.saveMainView();

        if(this.scheduledDiveId === diveId) {
            return;
        }

        this.scheduledDiveId = diveId;
        setTimeout(() => this.scheduleDive(diveId), this.delayMilliseconds);
    }

    private scheduleSelected(): void {
        const selectedId = this.diveSchedules.selected.id;
        this.schedule(selectedId);
    }

    private scheduleNextDive(diveId: number): void {
        const nextId = diveId + 1;
        const nextDive = this.diveSchedules.byId(nextId);

        if(nextDive && !nextDive.primary) {
            this.schedule(nextId);
        }
    }

    private scheduleDive(diveId: number): void {
        this.planner.calculate(diveId);
        this.scheduledDiveId = 0;
    }
}
