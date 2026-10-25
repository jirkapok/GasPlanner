import { ApplicationRef, Injectable } from '@angular/core';

/**
 * Notifies Angular about state changes outside Angular events (web worker messages, timers),
 * because the application runs without zone.js. Components use ChangeDetectorRef.markForCheck instead.
 */
@Injectable({ providedIn: 'root' })
export class ViewRefresh {
    constructor(private appRef: ApplicationRef) {
    }

    /**
     * Schedules change detection of the whole component tree.
     * Zoneless ApplicationRef.tick refreshes only views marked dirty, so the root components are marked.
     * Children of a refreshed view are checked in the global mode, which also refreshes all their descendants.
     * The Angular scheduler coalesces multiple calls and it is safe to call while change detection is running.
     */
    public refresh(): void {
        for (const component of this.appRef.components) {
            component.changeDetectorRef.markForCheck();
        }
    }
}
