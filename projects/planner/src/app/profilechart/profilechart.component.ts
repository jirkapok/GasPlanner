import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { WayPoint } from '../shared/models';
import { DiveResults } from '../shared/diveresults';
import { faChartArea } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js-basic-dist';
import { takeUntil } from 'rxjs';
import { Time } from 'scuba-physics';
import { DateFormats } from '../shared/formaters';
import { UnitConversion } from '../shared/UnitConversion';
import { SelectedWaypoint } from '../shared/selectedwaypointService';
import { Streamed } from '../shared/streamed';
import { Plan } from '../shared/plan.service';
import { ResamplingService } from '../shared/ResamplingService';

@Component({
    selector: 'app-profilechart',
    templateUrl: './profilechart.component.html',
    styleUrls: ['./profilechart.component.scss']
})
export class ProfileChartComponent extends Streamed implements OnInit {
    public dive: DiveResults;
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

    private cursor1 = {
        xid: 1,
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
            color: 'rgb(31, 119, 180)',
            width: 5
        }
    };

    private layout: any;
    private resampling: ResamplingService;

    constructor(private planer: PlannerService,
        private units: UnitConversion,
        private selectedWaypoint: SelectedWaypoint,
        private plan: Plan) {
        super();
        this.dive = this.planer.dive;
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

        this.updateLayoutThickFormat();
        this.planer.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.plotCharts());
        this.selectedWaypoint.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((wayPoint) => this.selectWayPoint(wayPoint));
    }

    public get noDecoTime(): number {
        return this.planer.dive.noDecoTime;
    }

    public ngOnInit(): void {
        this.plotCharts();
        this.hookChartEvents();
    }

    public scaleWidth(x: number, graphWidth: number): number {
        return x * graphWidth / this.dive.totalDuration;
    }

    public scaleHeight(y: number, graphHeight: number): number {
        return y * (graphHeight - 10) / this.plan.maxDepth;
    }

    public plotlyHover(data: any): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x;
        this.selectedWaypoint.selectedTimeStamp = timeStampValue;
    }

    private plotlyHoverLeave(data: any) {
        this.selectedWaypoint.selectedTimeStamp = '';
    }

    private selectWayPoint(wayPoint: WayPoint | undefined) {
        const shapes: any[] = [];
        const update = {
            shapes: shapes
        };

        if (wayPoint) {
            this.cursor1.x0 = Time.toDate(wayPoint.startTime);
            this.cursor1.x1 = Time.toDate(wayPoint.endTime);
            this.cursor1.y0 = wayPoint.startDepth;
            this.cursor1.y1 = wayPoint.endDepth;
            update.shapes.push(this.cursor1);
        }

        Plotly.relayout(this.elementName, update);
    }

    private plotCharts(): void {
        this.updateLayoutThickFormat();
        // performance: number of samples shown in chart doesn't speedup the drawing significantly
        const dataAverageDepths = this.plotAverageDepth();
        const depths = this.plotDepths();
        const ceilings = this.plotCeilings();
        const plotEvents = this.plotEvents();
        const traces = [dataAverageDepths, depths, ceilings, plotEvents];

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
        this.layout.xaxis.tickformat = DateFormats.selectChartTimeFormat(this.dive.totalDuration);
    }

    private plotAverageDepth(): any {
        const resampled = this.resampling.resampleAverageDepth(this.dive.wayPoints);

        const dataAverageDepths = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            line: {
                dash: 'dot'
            },
            name: 'Avg. depth',
            marker: {
                color: 'rgb(62, 157, 223)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return dataAverageDepths;
    }

    private plotDepths(): any {
        const resampled = this.resampling.resampleWaypoints(this.dive.wayPoints);

        const data = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            name: 'Depth',
            marker: {
                color: 'rgb(31, 119, 180)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return data;
    }

    private plotCeilings(): any {
        const resampled = this.resampling.resampleCeilings(this.dive.ceilings);

        const dataCeilings = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            fill: 'tozeroy',
            name: 'Ceiling',
            marker: {
                color: 'rgb(255, 160, 73)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return dataCeilings;
    }

    private plotEvents(): any {
        const resampled = this.resampling.convertEvents(this.dive.events);

        const dataEvents = {
            x: resampled.xValues,
            y: resampled.yValues,
            labels: resampled.labels,
            text: resampled.labels,
            type: 'scatter',
            mode: 'text+markers',
            fill: 'tozeroy',
            name: 'Event',
            hovertemplate: '%{text}',
            texttemplate: '%{text}',
            textposition: 'top center',
            fillcolor: 'rgba(0, 0, 0, 0)',
            marker: {
                color: 'rgba(31, 119, 180, 0.5)',
                size: 8,
                // symbol: 'bowtie-open', // https://plotly.com/javascript/reference/#box-marker-symbol
                line: {
                    color: 'rgba(31, 119, 180, 0.7)',
                    width: 2
                }
            },
            showlegend: false
        };


        return dataEvents;
    }
}
