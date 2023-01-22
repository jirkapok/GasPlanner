import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PreferencesService } from '../shared/preferences.service';
import { PlannerService } from '../shared/planner.service';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { environment } from '../../environments/environment';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { Streamed } from '../shared/streamed';
import { takeUntil } from 'rxjs';

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
        private options: OptionsDispatcherService,
        private planner: PlannerService,
        private delayedCalc: DelayedScheduleService) {
        super();
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public ngOnInit(): void {
        this.showDisclaimer = this.preferences.disclaimerEnabled();
        const query = window.location.search;

        if (query !== '') {
            PlanUrlSerialization.fromUrl(query, this.options, this.planner);
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

        const urlParams = PlanUrlSerialization.toUrl(this.planner, this.options);
        this.location.go('?' + urlParams);
    }
}
