import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../environments/environment';
import { PreferencesStore } from '../shared/preferencesStore';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { SubViewStorage } from './subViewStorage';

@Injectable()
export class DashboardStartUp {
    public _showDisclaimer = true;

    constructor(
        private location: Location,
        private preferences: PreferencesStore,
        private delayedCalc: DelayedScheduleService,
        private urlSerialization: PlanUrlSerialization,
        private views: SubViewStorage) {
        this._showDisclaimer = this.preferences.disclaimerEnabled();
    }

    public get showDisclaimer(): boolean {
        return this._showDisclaimer;
    }

    public onDashboard(): void {
        const query = window.location.search;

        if (query === '') {
            // no need to restore the state, since dives are kept in service states
            this.delayedCalc.schedule();
        } else {
            // the only view which loads from parameters instead of view state
            this.urlSerialization.fromUrl(query);
            // cant do in constructor, since the state may be changed
            this.views.saveMainView();
            // in case it fails we need to reset the parameters
            this.updateQueryParams();
        }
    }

    public stopDisclaimer(): void {
        this._showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

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
