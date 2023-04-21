import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../environments/environment';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PreferencesService } from '../shared/preferences.service';
import { PlannerService } from '../shared/planner.service';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { Streamed } from '../shared/streamed';
import { takeUntil } from 'rxjs';
import { ViewSwitchService } from '../shared/viewSwitchService';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends Streamed implements OnInit {
    public showDisclaimer = true;
    public exclamation = faExclamationTriangle;

    constructor(
        private location: Location,
        private preferences: PreferencesService,
        private planner: PlannerService,
        private viewSwitch: ViewSwitchService,
        private delayedCalc: DelayedScheduleService,
        private urlSerialization: PlanUrlSerialization) {
        super();
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public ngOnInit(): void {
        this.showDisclaimer = this.preferences.disclaimerEnabled();
        const query = window.location.search;

        if (query !== '') {
            this.urlSerialization.fromUrl(query);
            // in case it fails we need to reset the parameters
            this.updateQueryParams();
        } else {
            this.delayedCalc.schedule();
        }

        // because the calculation runs in background first it subscribes,
        // than it starts to receive the event. Even for the initial calls.
        this.planner.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.updateQueryParams());
    }

    public stopDisclaimer(): void {
        this.showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    private updateQueryParams(): void {
        if (!environment.production) {
            console.log('Planner calculated');
        }

        const urlParams = this.urlSerialization.toUrl();
        const maxUrlRecommendedLength = 2048;

        if(urlParams.length > maxUrlRecommendedLength) {
            console.warn('Created url parameters with length longer than acceptable in some browsers');
        }

        this.location.go('?' + urlParams);
    }
}
