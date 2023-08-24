import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../environments/environment';
import { PreferencesStore } from '../shared/preferencesStore';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';

@Injectable()
export class DashboardStartUp {
    public _showDisclaimer = true;

    constructor(
        private location: Location,
        private preferences: PreferencesStore,
        private delayedCalc: DelayedScheduleService,
        private urlSerialization: PlanUrlSerialization) {
        this._showDisclaimer = this.preferences.disclaimerEnabled();
    }

    public get showDisclaimer(): boolean {
        return this._showDisclaimer;
    }

    public onDashboard(): void {
        const query = window.location.search;

        if (query !== '') {
            this.urlSerialization.fromUrl(query);
            // in case it fails we need to reset the parameters
            this.updateQueryParams();
        } else {
            this.delayedCalc.schedule();
        }
    }

    public stopDisclaimer(): void {
        this._showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    // TODO load of dashboard component should set its state
    public updateQueryParams(): void {
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
