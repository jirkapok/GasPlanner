import { ApplicationRef, Injectable } from '@angular/core';

/**
 * Notifies Angular about state changes outside Angular events (web worker messages, timers),
 * because the application runs without zone.js. Components use ChangeDetectorRef.markForCheck instead.
 */
@Injectable({ providedIn: 'root' })
export class ViewRefresh {
    private scheduled = false;

    constructor(private appRef: ApplicationRef) {
    }

    /** Schedules one change detection after the current task, multiple calls before it are coalesced */
    public refresh(): void {
        if (this.scheduled) {
            return;
        }

        this.scheduled = true;
        // deferred, because tick fails, if called while change detection is running
        queueMicrotask(() => {
            this.scheduled = false;
            this.appRef.tick();
        });
    }
}
