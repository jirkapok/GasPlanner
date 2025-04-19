import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { faExclamationTriangle, faShareFromSquare } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { Streamed } from '../../shared/streamed';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { UnitConversion } from '../../shared/UnitConversion';
import { DashboardStartUp } from '../../shared/startUp';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ShareDiveService } from "../../shared/ShareDiveService";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends Streamed implements OnInit {
    public exclamation = faExclamationTriangle;
    public iconShare = faShareFromSquare;
    public rootForm!: FormGroup;

    constructor(
        private shareDive: ShareDiveService,
        private viewSwitch: ViewSwitchService,
        private units: UnitConversion,
        private dispatcher: ReloadDispatcher,
        public startup: DashboardStartUp,
        private schedules: DiveSchedules,
        private fb: NonNullableFormBuilder) {
        super();
        this.rootForm = this.fb.group({});
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get imperialUnits(): boolean {
        return this.units.imperialUnits;
    }

    public ngOnInit(): void {
        this.startup.onDashboard();

        // because the calculation runs in background first it subscribes,
        // than it starts to receive the event.
        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId?: number) => {
                if (this.schedules.selected.id === diveId) {
                    this.startup.updateQueryParams();
                }
            });

        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.startup.updateQueryParams();
            });
    }

    public get toastVisible(): boolean {
        return this.shareDive.toastVisible;
    }

    public hideToast(): void {
        this.shareDive.hideToast();
    }

    @HostListener('window:beforeinstallprompt', ['$event'])
    public onbeforeinstallprompt(e: Event): void {
        this.startup.onbeforeinstallprompt(e);
    }
}
