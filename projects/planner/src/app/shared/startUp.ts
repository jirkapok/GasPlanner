import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../environments/environment';
import { PreferencesStore } from '../shared/preferencesStore';
import { PlannerService } from '../shared/planner.service';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { Streamed } from '../shared/streamed';
import { takeUntil } from 'rxjs';


@Injectable()
export class StartUp extends Streamed {
    public _showDisclaimer = true;

    constructor(
        private location: Location,
        private preferences: PreferencesStore,
        private planner: PlannerService,
        private delayedCalc: DelayedScheduleService,
        private urlSerialization: PlanUrlSerialization) {
        super();
    }

    public get showDisclaimer(): boolean {
        return this._showDisclaimer;
    }

    public onStart(): void {
        this.preferences.load();
        this._showDisclaimer = this.preferences.disclaimerEnabled();

        // because the calculation runs in background first it subscribes,
        // than it starts to receive the event. Even for the initial calls.
        this.planner.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.updateQueryParams());
    }

    public onDashboard(): void {
        const query = window.location.search;

        if (query !== '') {
            this.urlSerialization.fromUrl(query);
            // in case it fails we need to reset the parameters
            this.updateQueryParams();
        } else {
            // TODO redirect to last known view
            this.delayedCalc.schedule();
        }
    }

    public stopDisclaimer(): void {
        this._showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    private updateQueryParams(): void {
        if (!environment.production) {
            console.log('Planner calculated');
        }

        const urlParams = this.urlSerialization.toUrl();
        const maxUrlRecommendedLength = 2048;

        if (urlParams.length > maxUrlRecommendedLength) {
            console.warn('Created url parameters with length longer than acceptable in some browsers');
        }

        this.location.go('?' + urlParams);
    }
}
