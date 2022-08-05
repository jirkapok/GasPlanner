import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PreferencesService } from '../shared/preferences.service';
import { PlannerService } from '../shared/planner.service';
import { PlanUrlSerialization } from '../shared/PlanUrlSerialization';
import { Dive } from '../shared/models';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    public showDisclaimer = true;
    public exclamation = faExclamationTriangle;
    private dive: Dive;

    constructor(private activatedRoute: ActivatedRoute,
        private router: Router, private preferences: PreferencesService, private planner: PlannerService) {
        this.dive = planner.dive;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public ngOnInit(): void {
        this.showDisclaimer = this.preferences.disclaimerEnabled();
        const query = window.location.search;
        if (query !=='') {
            // TODO doesn't apply changes when isComplex doesn't reflect rest of the values in url
            PlanUrlSerialization.fromUrl(query, this.planner);
        }

        this.planner.calculate();

        // first calculate, than subscribe for later updates by user
        this.planner.infoCalculated.subscribe(() => {
            this.updateQueryParams();
        });
    }

    public stopDisclaimer(): void {
        this.showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    private updateQueryParams(): void {
        const urlParams = PlanUrlSerialization.toUrl(this.planner);
        this.router.navigateByUrl( '?' + urlParams);
    }
}
