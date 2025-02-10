import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { formatNumber } from '@angular/common';
import { takeUntil } from 'rxjs';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import {
    faSlidersH, faShareFromSquare, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { MdbTabChange, MdbTabsComponent } from 'mdb-angular-ui-kit/tabs/tabs.component';

import { Tank, GasToxicity, Time } from 'scuba-physics';
import { DiveResults } from '../../shared/diveresults';
import { UnitConversion } from '../../shared/UnitConversion';
import { Streamed } from '../../shared/streamed';
import { DepthsService } from '../../shared/depths.service';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { DiveSchedules } from '../../shared/dive.schedules';
import {TextConstants} from '../../shared/TextConstants';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';

@Component({
    selector: 'app-diveinfo',
    templateUrl: './diveinfo.component.html',
    styleUrls: ['./diveinfo.component.scss']
})
export class DiveInfoComponent extends Streamed implements AfterViewInit {
    @ViewChild('tabs') public tabs: MdbTabsComponent | undefined;
    public icon = faSlidersH;
    public iconShare = faShareFromSquare;
    public readonly warnIcon = faExclamationTriangle;
    public toastVisible = false;
    private lastSelected = 0;
    private readonly issuesTabIndex = 2;

    constructor(
        private clipboard: ClipboardService,
        private viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        private dispatcher: ReloadDispatcher,
        private schedules: DiveSchedules) {
        super();

        this.clipboard.copyResponse$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res: IClipboardResponse) => {
                this.copyToClipBoard(res);
            });

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId)=> {
                this.checkIssuesTab(diveId);
            });
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get tanks(): Tank[] {
        return this.schedules.selectedTanks.tankData;
    }

    public get noDeco(): number {
        return this.dive.noDecoTime;
    }

    public get showApply(): boolean {
        return !this.isComplex && this.dive.calculated;
    }

    public get averageDepth(): number {
        return this.units.fromMeters(this.dive.averageDepth);
    }

    public get highestDensity(): number {
        const density = this.dive.highestDensity.density;
        return this.units.fromGramPerLiter(density);
    }

    public get densityText(): string {
        const gas = this.dive.highestDensity.gas.name;
        const depth = this.units.fromMeters(this.dive.highestDensity.depth);
        return `${gas} at ${depth} ${this.units.length}`;
    }

    public get cnsText(): string {
        if(this.dive.cns >= 1000) {
            return TextConstants.cnsOverOneThousand;
        }

        return formatNumber(this.dive.cns, 'en', '1.0-0');
    }

    public get surfaceGradient(): number {
        return this.dive.surfaceGradient * 100;
    }

    public get offgasingStartTime(): number {
        return this.dive.offgasingStartTime;
    }

    public get offgasingStartDepth(): number {
        return this.dive.offgasingStartDepth;
    }

    public get dive(): DiveResults {
        return this.schedules.selectedResult;
    }

    public get toxicity(): GasToxicity {
        return this.schedules.selectedToxicity;
    }

    private get depthsService(): DepthsService {
        return this.schedules.selectedDepths;
    }

    public ngAfterViewInit(): void {
        this.tabs?.activeTabChange.pipe(takeUntil(this.unsubscribe$))
            .subscribe((e: MdbTabChange) => {
                this.selectedChanged(e);
            });
    }

    public applyMaxDuration(): void {
        this.depthsService.applyMaxDuration();
    }

    public applyNdlDuration(): void {
        this.depthsService.applyNdlDuration();
    }

    public sharePlan(): void {
        this.clipboard.copy(window.location.href);
    }

    public hideToast(): void {
        this.toastVisible = false;
    }

    private selectedChanged(e: MdbTabChange): void {
        this.lastSelected = e.index;
    }

    private checkIssuesTab(diveId: number | undefined) {
        const selectedDive = this.schedules.selected;
        if (selectedDive.id === diveId &&
            (selectedDive.diveResult.hasErrorEvent || selectedDive.diveResult.hasWarningEvent) &&
            (this.lastSelected === 0 || (!selectedDive.diveResult.notEnoughGas && this.lastSelected === 1))) {
            this.tabs?.setActiveTab(this.issuesTabIndex);
        }
    }

    private copyToClipBoard(res: IClipboardResponse) {
        // stupid replacement of Bootstrap toasts, because not part of the free mdb package
        if (res.isSuccess) {
            this.toastVisible = true;
            setTimeout(() => {
                this.hideToast();
            }, 5000);
        }
    }
}
