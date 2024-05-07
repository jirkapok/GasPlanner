import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { ProfileComparatorService } from '../shared/diff/profileComparatorService';
import { KnownViews } from '../shared/viewStates';
import { Streamed } from '../shared/streamed';
import { SubViewStorage } from '../shared/subViewStorage';
import { DiffViewState } from '../shared/views.model';
import { DiveSchedules } from '../shared/dive.schedules';

@Component({
    selector: 'app-diff',
    templateUrl: './diff.component.html',
    styleUrls: ['./diff.component.scss']
})
export class DiffComponent extends Streamed implements OnInit {
    public readonly exclamation = faExclamationCircle;

    constructor(
        public diff: ProfileComparatorService,
        private viewStates: SubViewStorage,
        private schedules: DiveSchedules,
        private router: Router
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadState();
        this.saveState();

        this.diff.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.saveState());
    }

    public async goToDashboard(): Promise<void> {
        await this.router.navigate(['/']);
    }

    private loadState(): void {
        let state: DiffViewState = this.viewStates.loadView(KnownViews.diff);

        if(!state) {
            state = {
                id: KnownViews.diff,
                profileA: 0,
                profileB: 0
            };
        }

        const profileA = this.resolveValidProfile(state.profileA);
        this.diff.selectProfile(profileA);
        const profileB = this.resolveValidProfile(state.profileB);
        this.diff.selectProfile(profileB);
    }

    private resolveValidProfile(current: number): number {
        return current < 0 || this.schedules.length <= current ? 0 : current;
    }

    private saveState(): void {
        const state = {
            id: KnownViews.diff,
            profileA: this.diff.profileAIndex,
            profileB: this.diff.profileBIndex
        };

        this.viewStates.saveView(state);
    }
}
