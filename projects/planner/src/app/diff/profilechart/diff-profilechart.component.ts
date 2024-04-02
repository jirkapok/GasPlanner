import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { faChartArea } from '@fortawesome/free-solid-svg-icons';
import { ResamplingService } from '../../shared/ResamplingService';
import { UnitConversion } from '../../shared/UnitConversion';
import { DiveResults } from '../../shared/diveresults';
import { WayPoint } from '../../shared/models';
import { DateFormats } from '../../shared/formaters';
import * as Plotly from 'plotly.js-basic-dist';
import { Streamed } from '../../shared/streamed';
import { ChartPlotter, ChartPlotterFactory } from '../../shared/chartPlotter';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';

@Component({
    selector: 'app-diff-profilechart',
    templateUrl: './diff-profilechart.component.html',
    styleUrls: ['./diff-profilechart.component.scss']
})
export class ProfileDifferenceChartComponent extends Streamed implements OnInit {
    public icon = faChartArea;
    private readonly elementName = 'diveplot';
    private chartElement: any;

    private options = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        // staticPlot: true,
        autosize: true,
        scrollZoom: false,
        editable: false
    };

    private cursor1: Partial<Plotly.Shape> = ProfileDifferenceChartComponent.createCursor(ChartPlotterFactory.depthLineColorA);
    private cursor2: Partial<Plotly.Shape> = ProfileDifferenceChartComponent.createCursor(ChartPlotterFactory.depthLineColorB);

    private layout: any;
    private resampling: ResamplingService;
    private profileAChartPlotter: ChartPlotter;
    private profileBChartPlotter: ChartPlotter;

    constructor(
        private units: UnitConversion,
        private selectedWaypoints: SelectedDiffWaypoint,
        private profileComparatorService: ProfileComparatorService) {
        super();
        this.resampling = new ResamplingService(units);

        this.layout = {
            autosize: true,
            showlegend: false,
            xaxis: {
                fixedrange: true,
                title: {
                    text: 'Time [min]'
                }
            },
            yaxis: {
                fixedrange: true,
                autorange: 'reversed',
                title: {
                    text: `Depth [${units.length}]`
                }
            },
            margin: { l: 40, r: 10, b: 40, t: 10 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: 'rgba(200, 200, 200, 0.25)',
                bordercolor: 'rgba(200, 200, 200, 0.25)'
            },
            shapes: []
        };

        const chartPlotterFactory = new ChartPlotterFactory(this.resampling, this.units);
        this.profileAChartPlotter = chartPlotterFactory.wthNamePrefix('Profile A ').create(this.profileA);
        this.profileBChartPlotter = chartPlotterFactory
            .wthNamePrefix('Profile B ')
            .wthAverageDepthColor('rgb(188,191,192)')
            .wthDepthColor(ChartPlotterFactory.depthLineColorB)
            .wthCeilingColor(ChartPlotterFactory.depthLineColorB)
            .wthEventFillColor(ChartPlotterFactory.depthLineColorB)
            .wthEventLineColor('rgb(118,119,120)')
            .create(this.profileB);

        this.updateLayoutThickFormat();
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

    private static createCursor(lineColor: string): Partial<Plotly.Shape> {
        return {
            type: 'line',
            // x-reference is assigned to the x-values
            xref: 'x',
            // y-reference is assigned to the plot paper [0,1]
            yref: 'y',
            x0: new Date('2001-06-12 12:30'), // dummy values
            y0: 0,
            x1: new Date('2001-06-12 12:30'),
            y1: 1,
            fillcolor: '#d3d3d3',
            line: {
                color: lineColor,
                width: 5
            }
        };
    }

    public ngOnInit(): void {
        void this.profileComparatorService.waitUntilProfilesCalculated().then(() => {
            this.plotCharts();
            this.hookChartEvents();
        });
    }

    public plotlyHover(data: any): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x;
        this.selectedWaypoints.selectedTimeStamp = timeStampValue;
    }

    private plotlyHoverLeave(data: any) {
        this.selectedWaypoints.selectedTimeStamp = '';
    }

    private selectWayPoint(selected: ComparedWaypoint | undefined) {
        if (!selected) {
            return;
        }

        const update: Partial<Plotly.Layout> = {
            shapes: []
        };

        if(selected.wayPointA) {
            this.updateCursor(selected.wayPointA, this.cursor1);
            update.shapes!.push(this.cursor1);
        }

        if(selected.wayPointB) {
            this.updateCursor(selected.wayPointB, this.cursor2);
            update.shapes!.push(this.cursor2);
        }

        Plotly.relayout(this.elementName, update);
    }

    private updateCursor(wayPoint: WayPoint, cursor: Partial<Plotly.Shape>): void {
        cursor.x0 = DateFormats.toDate(wayPoint.startTime);
        cursor.x1 = DateFormats.toDate(wayPoint.endTime);
        cursor.y0 = wayPoint.startDepth;
        cursor.y1 = wayPoint.endDepth;
    }

    private plotCharts(): void {
        this.updateLayoutThickFormat();
        this.profileAChartPlotter.dive = this.profileA;
        this.profileBChartPlotter.dive = this.profileB;
        // performance: number of samples shown in chart doesn't speedup the drawing significantly
        const profileAAverageDepths = this.profileAChartPlotter.plotAverageDepth();
        const profileADepths = this.profileAChartPlotter.plotDepths();
        const profileACeilings = this.profileAChartPlotter.plotCeilings();
        const profileAEvents = this.profileAChartPlotter.plotEvents();

        const profileBAverageDepths = this.profileBChartPlotter.plotAverageDepth();
        const profileBDepths = this.profileBChartPlotter.plotDepths();
        const profileBCeilings = this.profileBChartPlotter.plotCeilings();
        const profileBEvents = this.profileBChartPlotter.plotEvents();

        const traces = [
            profileBAverageDepths, profileBDepths, profileBCeilings, profileBEvents,
            profileAAverageDepths, profileADepths, profileACeilings, profileAEvents,
        ];

        Plotly.react(this.elementName, traces, this.layout, this.options);
    }

    private hookChartEvents(): void {
        this.chartElement = document.getElementById(this.elementName);
        this.chartElement.on('plotly_hover', (e: any) => this.plotlyHover(e));
        this.chartElement.on('plotly_click', (e: any) => this.plotlyHover(e));
        this.chartElement.on('plotly_unhover', (e: any) => this.plotlyHoverLeave(e));
    }

    private updateLayoutThickFormat(): void {
        // setting to string instead expected d3 formtting function causes warning in console = want fix
        this.layout.xaxis.tickformat = DateFormats.selectChartTimeFormat(this.profileA.totalDuration);
    }
}
