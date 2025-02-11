import {Component, OnInit} from '@angular/core';
import { takeUntil } from 'rxjs';
import { faChartArea, faFire } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js-dist';
import { Streamed } from '../../shared/streamed';
import { ChartPlotterFactory, ChartPlotter } from '../../shared/chartPlotter';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { HeatMapPlotter } from '../../shared/heatMapPlotter';
import { FeatureFlags } from 'scuba-physics';

@Component({
    selector: 'app-diff-profilechart',
    templateUrl: './diff-profilechart.component.html',
    styleUrls: ['./diff-profilechart.component.scss']
})
export class ProfileDifferenceChartComponent extends Streamed implements OnInit {
    public icon = faChartArea;
    protected readonly heatmapIcon = faFire;
    public showHeatMap = true;
    private plotter: ChartPlotter;
    private heatMapPlotterA: HeatMapPlotter;
    private heatMapPlotterB: HeatMapPlotter;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoints: SelectedDiffWaypoint,
        private profileComparatorService: ProfileComparatorService,
        private reloadDispatcher: ReloadDispatcher) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units);
        const profileATraces = chartPlotterFactory.withNamePrefix('Profile A ')
            .create(() => this.profileComparatorService.profileAResults);
        const profileBTraces = chartPlotterFactory
            .withNamePrefix('Profile B ')
            .wthAverageDepthColor('rgb(188,191,192)')
            .wthDepthColor(ChartPlotterFactory.depthLineColorB)
            .wthCeilingColor(ChartPlotterFactory.depthLineColorB)
            .wthEventFillColor(ChartPlotterFactory.depthLineColorB)
            .wthEventLineColor('rgb(118,119,120)')
            .create(() => this.profileComparatorService.profileBResults);

        this.plotter = new ChartPlotter('diveplotdiff', () => this.profileComparatorService.totalDuration,
            chartPlotterFactory, profileBTraces, profileATraces);
        this.heatMapPlotterA = new HeatMapPlotter('heatmapPlotA');
        this.heatMapPlotterB = new HeatMapPlotter('heatmapPlotB');

        this.profileComparatorService.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.plotCharts();
                }
            });

        this.selectedWaypoints.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((selected: ComparedWaypoint) => {
                this.selectWayPoint(selected);
            });

        this.reloadDispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.plotCharts();
                    this.plotlyHoverLeave();
                }
            });
    }

    public get profilesCalculated(): boolean {
        return this.profileComparatorService.profilesCalculated;
    }

    public ngOnInit(): void {
        if (this.profilesCalculated) {
            this.plotCharts();
            this.hookChartEvents();
        }
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x!.toString();
        this.selectedWaypoints.selectedTimeStamp = timeStampValue;
    }

    public switchHeatMap(): void {
        this.showHeatMap = !this.showHeatMap;
    }

    private plotlyHoverLeave() {
        this.selectedWaypoints.selectedTimeStamp = '';
        this.selectWayPoint(undefined);
    }

    private selectWayPoint(selected: ComparedWaypoint | undefined): void {
        if (!selected) {
            this.plotter.plotCursor(undefined);
            return;
        }

        const wayPoint = selected.durationA ? selected.wayPointA : selected.wayPointB;
        this.plotter.plotCursor(wayPoint);
    }

    private plotCharts(): void {
        this.plotter.plotAllCharts();

        if(this.showHeatMap) {
            var overPressures = this.profileComparatorService.overPressures;
            this.heatMapPlotterA.plotHeatMap(overPressures.profileAOverPressures);
            this.heatMapPlotterB.plotHeatMap(overPressures.profileBOverPressures);
        }
    }

    private hookChartEvents(): void {
        // used any to prevent typescript type gymnastic
        const chartElement: any = document.getElementById(this.plotter.elementName);
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }
}
