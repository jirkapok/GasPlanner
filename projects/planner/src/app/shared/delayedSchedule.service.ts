import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { SubViewStorage } from './subViewStorage';
import { ReloadDispatcher } from './reloadDispatcher';
import { Streamed } from './streamed';
import { takeUntil } from 'rxjs';
import { DiveSchedules } from './dive.schedules';

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

        this.dispatcher.tankChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.schedule());

        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.schedule());

        this.dispatcher.optionsChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.schedule());

        // the only reloaded in case tank removed and preferences load
        this.dispatcher.depthsReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.schedule());

        // we need to serialize since next dive can be calculated only after previous one has results
        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.scheduleNextDive(diveId));
    }

    // TODO remove manual call, everything should be scheduled based on events
    public schedule(diveId: number = 1): void {
        this.views.saveMainView();

        if(this.scheduled) {
            return;
        }

        this.scheduled = true;
        setTimeout(() => this.scheduleDive(diveId), 100);
    }

    private scheduleNextDive(diveId: number): void {
        const nextId = diveId + 1;

        if(this.diveSchedules.validId(nextId)) {
            this.schedule(nextId);
        }
    }

    private scheduleDive(diveId: number): void {
        this.planner.calculate(diveId);
        this.scheduled = false;
    }
}
