import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PreferencesService } from '../shared/preferences.service';
import { PlannerService } from '../shared/planner.service';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { Dive } from '../shared/models';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    public showDisclaimer = true;
    public exclamation = faExclamationTriangle;
    private dive: Dive;

    constructor(private router: Router,
        private preferences: PreferencesService,
        private options: OptionsDispatcherService,
        private planner: PlannerService) {
        this.dive = planner.dive;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public ngOnInit(): void {
        this.showDisclaimer = this.preferences.disclaimerEnabled();
        const query = window.location.search;
        if (query !=='') {
            PlanUrlSerialization.fromUrl(query, this.options, this.planner);
        }
        // first calculate, than subscribe for later updates by user
        this.planner.infoCalculated.subscribe(() => {
            this.updateQueryParams();
        });

        this.planner.calculate();
    }

    public stopDisclaimer(): void {
        this.showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    private updateQueryParams(): void {
        const urlParams = PlanUrlSerialization.toUrl(this.planner, this.options);
        this.router.navigateByUrl( '?' + urlParams);
    }
}
