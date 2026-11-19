import { Component, OnInit, effect, signal, untracked } from '@angular/core';
import { takeUntil } from 'rxjs';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { ProfileComparatorService } from '../shared/diff/profileComparatorService';
import { KnownViews } from '../shared/viewStates';
import { Streamed } from '../shared/streamed';
import { SubViewStorage } from '../shared/subViewStorage';
import { DiffViewState } from '../shared/views.model';
import { DiveSchedules } from '../shared/dive.schedules';
import { DiffTabsComponent } from './tabs/diff-tabs.component';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ProfileDifferenceChartComponent } from './profilechart/diff-profilechart.component';
import { WaypointsDifferenceComponent } from './waypoints/diff-waypoints.component';
import { DiveResultsDifferenceComponent } from './diveresults/diff-diveresults.component';
import { GasConsumedDifferenceComponent } from './gasconsumed/diff-gas-consumed/diff-gas-consumed.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-diff',
    templateUrl: './diff.component.html',
    styleUrls: ['./diff.component.scss'],
    imports: [DiffTabsComponent, FaIconComponent, ProfileDifferenceChartComponent, WaypointsDifferenceComponent,
        DiveResultsDifferenceComponent, GasConsumedDifferenceComponent, TranslatePipe]
})
export class DiffComponent extends Streamed implements OnInit {
    public readonly exclamation = faExclamationCircle;
    /** Rest interval of the diff chart heatmaps in seconds, kept only in the diff view state */
    protected readonly restInterval = signal(0);
    private loaded = false;

    constructor(
        public diff: ProfileComparatorService,
        private viewStates: SubViewStorage,
        private schedules: DiveSchedules,
        private router: Router
    ) {
        super();

        effect(() => {
            this.restInterval();
            untracked(() => this.restIntervalChanged());
        });
    }

    ngOnInit(): void {
        this.loadState();
        this.saveState();
        this.loaded = true;

        this.diff.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.saveState());
    }

    public async goToDashboard(): Promise<void> {
        await this.router.navigate(['/']);
    }

    private loadState(): void {
        let state = this.viewStates.loadView<DiffViewState>(KnownViews.diff);

        if(!state) {
            state = {
                id: KnownViews.diff,
                profileA: 0,
                profileB: 0,
                alignByEnd: false,
                restInterval: 0
            };
        }

        const profileA = this.resolveValidProfile(state.profileA);
        const profileB = this.resolveValidProfile(state.profileB);

        this.diff.selectProfile(profileA);
        this.diff.selectProfile(profileB);
        this.diff.alignByEnd = state.alignByEnd;
        this.restInterval.set(state.restInterval ?? 0);
    }

    private restIntervalChanged(): void {
        if (this.loaded) {
            this.saveState();
        }
    }

    private resolveValidProfile(current: number): number {
        return current < 0 || this.schedules.length <= current ? 0 : current;
    }

    private saveState(): void {
        const state: DiffViewState = {
            id: KnownViews.diff,
            profileA: this.diff.profileAIndex,
            profileB: this.diff.profileBIndex,
            alignByEnd: this.diff.alignByEnd,
            restInterval: this.restInterval()
        };

        this.viewStates.saveView(state);
    }
}
