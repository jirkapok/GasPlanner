import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntil } from 'rxjs';
import * as Plotly from 'plotly.js-dist';
import { faChartArea, faFire, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { TissueOverPressures } from 'scuba-physics';
import { DiveResults } from '../../shared/diveresults';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { Streamed } from '../../shared/streamed';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import {
    ChartPlotter, ChartPlotterFactory, DiveTracesBuilder
} from '../../shared/chartPlotter';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { WayPoint } from '../../shared/wayPoint';
import { HeatMapPlotter } from '../../shared/heatMapPlotter';
import { CardHeaderComponent } from '../../card-header/card-header.component';
import { NgClass } from '@angular/common';
import { ProfileHoverValues } from '../../shared/profileHoverValues';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CalculatingComponent } from '../../controls/calculating/calculating.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-profilechart',
    templateUrl: './profilechart.component.html',
    styleUrls: ['./profilechart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CardHeaderComponent, NgClass, FaIconComponent, CalculatingComponent, TranslatePipe]
})
export class ProfileChartComponent extends Streamed implements OnInit {
    public readonly profileIcon = faChartArea;
    public readonly emergencyIcon = faThumbsUp;
    public readonly heatmapIcon = faFire;
    public showHeatMap = false;
    private readonly elementName = 'diveplot';
    private readonly heatMapElementName = 'heatmapplot';
    private plotter: ChartPlotter;
    private heatmapPlotter: HeatMapPlotter;
    private profileTraces: DiveTracesBuilder;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoint: SelectedWaypoint,
        private dispatcher: ReloadDispatcher,
        private schedules: DiveSchedules,
        private translate: TranslateService,
        private cd: ChangeDetectorRef) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units, key => this.translate.instant(key));
        this.profileTraces = chartPlotterFactory.withNamePrefix(null)
            .withoutHoverLabels()
            .withLegendAbove()
            .create(() => this.dive);
        this.plotter = new ChartPlotter(this.elementName, () => this.dive.totalDuration, chartPlotterFactory, this.profileTraces);
        this.heatmapPlotter = new HeatMapPlotter(this.heatMapElementName);

        this.dispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId?: number) => {
                if (this.schedules.selected.id === diveId) {
                    this.plotProfile();
                    this.plotlyHoverLeave();
                }
            });

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId?: number) => {
                if (this.schedules.selected.id === diveId) {
                    this.plotAllCharts();
                    this.plotlyHoverLeave();
                }
            });

        // touch devices don't always send unhover, so hovered values would be stale
        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.plotAllCharts();
                this.plotlyHoverLeave();
            });
        this.selectedWaypoint.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((wayPoint) => this.selectWayPoint(wayPoint));
        this.translate.onLangChange.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.plotAllCharts();
                this.plotlyHoverLeave();
            });
    }

    public get profileCalculated(): boolean {
        return this.dive.profileCalculated;
    }

    /** Since ceilings are calculated in dive info task */
    public get infoCalculated(): boolean {
        return this.dive.diveInfoCalculated;
    }

    public get showEmergencyAscent(): boolean {
        return this.profileTraces.showEmergencyAscent;
    }

    private get dive(): DiveResults {
        return this.schedules.selected.diveResult;
    }

    public ngOnInit(): void {
        this.plotAllCharts();
        this.hookChartEvents();
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x?.toString() ?? '';
        this.selectedWaypoint.selectedTimeStamp = timeStampValue;
        this.plotter.plotHoverValues(ProfileHoverValues.fromPoints(data.points));
    }

    public switchHeatMap(): void {
        this.showHeatMap = !this.showHeatMap;
        // applies pending template changes first, because Plotly can't size hidden plot elements
        this.cd.detectChanges();
        this.plotAllCharts();
    }

    public switchEmergencyAscent(): void {
        this.profileTraces.showEmergencyAscent = !this.profileTraces.showEmergencyAscent;
        this.plotAllCharts();
        this.plotlyHoverLeave();
    }

    public plotlyHoverLeave(): void {
        this.selectedWaypoint.selectedTimeStamp = '';
        this.selectWayPoint(undefined);
        this.plotter.plotHoverValues(undefined);
    }

    private selectWayPoint(wayPoint: WayPoint | undefined) {
        this.plotter.plotCursor(wayPoint);
    }

    private plotProfile(): void {
        this.plotter.plotProfileChartsOnly();
        this.plotHeatMap([]);
    }

    private plotAllCharts(): void {
        this.plotter.plotAllCharts();
        this.plotHeatMap(this.dive.tissueOverPressures);
    }

    private plotHeatMap(tissueOverPressures: TissueOverPressures[]): void {
        if (this.showHeatMap) {
            void this.heatmapPlotter.plotHeatMap(tissueOverPressures);
        }
    }

    private hookChartEvents(): void {
        const chartElement: any = document.getElementById(this.elementName);
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }
}
