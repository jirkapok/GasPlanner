import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { faChartArea } from '@fortawesome/free-solid-svg-icons';
import { DiveResults } from '../../shared/diveresults';
import * as Plotly from 'plotly.js-basic-dist';
import { Streamed } from '../../shared/streamed';
import { ChartPlotterFactory, ChartPlotter } from '../../shared/chartPlotter';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';

@Component({
    selector: 'app-diff-profilechart',
    templateUrl: './diff-profilechart.component.html',
    styleUrls: ['./diff-profilechart.component.scss']
})
export class ProfileDifferenceChartComponent extends Streamed implements OnInit {
    public icon = faChartArea;
    private plotter: ChartPlotter;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoints: SelectedDiffWaypoint,
        private profileComparatorService: ProfileComparatorService) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units);
        const profileATraces = chartPlotterFactory.wthNamePrefix('Profile A ')
            .create(() => this.profileA);
        const profileBTraces = chartPlotterFactory
            .wthNamePrefix('Profile B ')
            .wthAverageDepthColor('rgb(188,191,192)')
            .wthDepthColor(ChartPlotterFactory.depthLineColorB)
            .wthCeilingColor(ChartPlotterFactory.depthLineColorB)
            .wthEventFillColor(ChartPlotterFactory.depthLineColorB)
            .wthEventLineColor('rgb(118,119,120)')
            .create(() => this.profileB);

        this.plotter = new ChartPlotter('diveplotdiff', chartPlotterFactory, profileBTraces, profileATraces);

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
    }

    public get profilesCalculated(): boolean {
        return this.profileComparatorService.profilesCalculated;
    }

    private get profileA(): DiveResults {
        return this.profileComparatorService.profileAResults;
    }

    private get profileB(): DiveResults {
        return this.profileComparatorService.profileBResults;
    }

    public ngOnInit(): void {
        void this.profileComparatorService.waitUntilProfilesCalculated().then(() => {
            this.plotCharts();
        });

        this.plotCharts();
        this.hookChartEvents();
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x!.toString();
        this.selectedWaypoints.selectedTimeStamp = timeStampValue;
    }

    private plotlyHoverLeave() {
        this.selectedWaypoints.selectedTimeStamp = '';
    }

    private selectWayPoint(selected: ComparedWaypoint | undefined): void {
        if (!selected) {
            return;
        }

        const wayPoint = selected.durationA ? selected.wayPointA : selected.wayPointB;
        this.plotter.plotCursor(wayPoint);
    }

    private plotCharts(): void {
        this.plotter.plotCharts(this.profileComparatorService.totalDuration);
    }

    private hookChartEvents(): void {
        // used any to prevent typescript type gymnastic
        const chartElement: any = document.getElementById(this.plotter.elementName);
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }
}
