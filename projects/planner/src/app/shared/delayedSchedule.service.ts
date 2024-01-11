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
    private scheduled = false;
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
        this.views.saveMainView();

        _(this.diveSchedules.dives)
            .filter(d => d.primary)
            .forEach(d => setTimeout(() => this.scheduleDive(d.id), 100));

        this.registerEventListeners();
    }

    private registerEventListeners(): void {
        this.dispatcher.tankChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        this.dispatcher.optionsChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        // the only reloaded in case preferences load, add or removed dive,
        // because following dive may need to be recalculated. Not efficient.
        this.dispatcher.depthsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.scheduleSelected());

        // we need to serialize since next dive can be calculated only after previous one has results
        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.scheduleNextDive(diveId));
    }

    private schedule(diveId: number): void {
        this.views.saveMainView();

        if(this.scheduled) {
            return;
        }

        // TODO restore this.scheduled = true;
        setTimeout(() => this.scheduleDive(diveId), 100);
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
        this.scheduled = false;
    }
}
