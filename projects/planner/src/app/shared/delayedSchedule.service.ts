import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { SubViewStorage } from './subViewStorage';
import { ReloadDispatcher } from './reloadDispatcher';
import { Streamed } from './streamed';
import { takeUntil } from 'rxjs';

@Injectable()
export class DelayedScheduleService extends Streamed {
    private scheduled = false;

    constructor(
        private dispatcher: ReloadDispatcher,
        private planner: PlannerService,
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
    }

    public schedule(): void {
        this.views.saveMainView();

        if(this.scheduled) {
            return;
        }

        this.scheduled = true;
        setTimeout(() => {
            this.planner.calculate();
            this.scheduled = false;
        }, 100);
    }
}
