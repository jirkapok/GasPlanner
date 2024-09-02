import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { DiveResults } from '../shared/diveresults';
import { faChartArea } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js-basic-dist';
import { SelectedWaypoint } from '../shared/selectedwaypointService';
import { Streamed } from '../shared/streamed';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ChartPlotter, ChartPlotterFactory } from '../shared/chartPlotter';
import { UnitConversion } from '../shared/UnitConversion';
import { ResamplingService } from '../shared/ResamplingService';
import { WayPoint } from '../shared/wayPoint';

@Component({
    selector: 'app-profilechart',
    templateUrl: './profilechart.component.html',
    styleUrls: ['./profilechart.component.scss']
})
export class ProfileChartComponent extends Streamed implements OnInit {
    public icon = faChartArea;
    private readonly elementName = 'diveplot';
    private plotter: ChartPlotter;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoint: SelectedWaypoint,
        private dispatcher: ReloadDispatcher,
        private schedules: DiveSchedules) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units);
        const profileTraces = chartPlotterFactory.wthNamePrefix('')
            .create(() => this.dive);
        this.plotter = new ChartPlotter('diveplot', chartPlotterFactory, profileTraces);

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

    private plotlyHoverLeave() {
        this.selectedWaypoint.selectedTimeStamp = '';
        this.selectWayPoint(undefined);
    }

    private selectWayPoint(wayPoint: WayPoint | undefined) {
        this.plotter.plotCursor(wayPoint);
    }

    private plotCharts(): void {
        this.plotter.plotCharts(this.dive.totalDuration);
    }

    private hookChartEvents(): void {
        const chartElement: any = document.getElementById(this.elementName);
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }
}
