import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import * as Plotly from 'plotly.js-dist';
import * as _ from 'lodash';
import { faChartArea, faFire } from '@fortawesome/free-solid-svg-icons';
import { DiveResults } from '../shared/diveresults';
import { SelectedWaypoint } from '../shared/selectedwaypointService';
import { Streamed } from '../shared/streamed';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ChartPlotter, ChartPlotterFactory } from '../shared/chartPlotter';
import { UnitConversion } from '../shared/UnitConversion';
import { ResamplingService } from '../shared/ResamplingService';
import { WayPoint } from '../shared/wayPoint';
import { HeatMapPlotter } from '../shared/heatMapPlotter';
import { FeatureFlags } from 'scuba-physics';

@Component({
    selector: 'app-profilechart',
    templateUrl: './profilechart.component.html',
    styleUrls: ['./profilechart.component.scss']
})
export class ProfileChartComponent extends Streamed implements OnInit {
    public readonly profileIcon = faChartArea;
    public readonly heatmapIcon = faFire;
    public heatMapEnabled = FeatureFlags.Instance.collectSaturation;
    public showHeatMap = false;
    private readonly elementName = 'diveplot';
    private readonly heatMapElementName = 'heatmapplot';
    private plotter: ChartPlotter;
    private heatmapPlotter: HeatMapPlotter;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoint: SelectedWaypoint,
        private dispatcher: ReloadDispatcher,
        private schedules: DiveSchedules) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units);
        const profileTraces = chartPlotterFactory.withNamePrefix('')
            .create(() => this.dive);
        this.plotter = new ChartPlotter(this.elementName, chartPlotterFactory, profileTraces);
        this.heatmapPlotter = new HeatMapPlotter(this.heatMapElementName);

        this.dispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId?: number) => {
                if (this.schedules.selected.id === diveId) {
                    this.plotCharts();
                    this.plotlyHoverLeave();
                }
            });
        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.plotCharts());
        this.selectedWaypoint.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((wayPoint) => this.selectWayPoint(wayPoint));
    }

    public get profileCalculated(): boolean {
        return this.dive.profileCalculated;
    }

    private get dive(): DiveResults {
        return this.schedules.selected.diveResult;
    }

    public ngOnInit(): void {
        this.plotCharts();
        this.hookChartEvents();
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x!.toString();
        this.selectedWaypoint.selectedTimeStamp = timeStampValue;
    }

    public switchHeatMap(): void {
        this.showHeatMap = !this.showHeatMap;
        this.plotCharts();
    }

    private plotlyHoverLeave() {
        this.selectedWaypoint.selectedTimeStamp = '';
        this.selectWayPoint(undefined);
    }

    private selectWayPoint(wayPoint: WayPoint | undefined) {
        this.plotter.plotCursor(wayPoint);
    }

    private plotCharts(): void {
        this.plotter.plotCharts(this.dive.totalDuration);

        if (this.showHeatMap) {
            let transponed = _.zip.apply(_, this.dive.tissueOverPressures) as number[][];
            transponed = transponed.reverse();
            this.heatmapPlotter.plotHeatMap(transponed);
        }
    }

    private hookChartEvents(): void {
        const chartElement: any = document.getElementById(this.elementName);
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }
}
