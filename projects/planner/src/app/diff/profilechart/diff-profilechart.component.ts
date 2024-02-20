import {Component, OnInit} from '@angular/core';
import {faChartArea} from '@fortawesome/free-solid-svg-icons';
import {ResamplingService} from '../../shared/ResamplingService';
import {UnitConversion} from '../../shared/UnitConversion';
import {SelectedWaypoint} from '../../shared/selectedwaypointService';
import {ReloadDispatcher} from '../../shared/reloadDispatcher';
import {DiveSchedules} from '../../shared/dive.schedules';
import {takeUntil} from 'rxjs';
import {DiveResults} from '../../shared/diveresults';
import {WayPoint} from '../../shared/models';
import {DateFormats} from '../../shared/formaters';
import * as Plotly from 'plotly.js-basic-dist';
import {Streamed} from '../../shared/streamed';
import {ChartPlotter} from '../../shared/chartPlotter';

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
    private profileChartPlotter: ChartPlotter;

    constructor(
        private units: UnitConversion,
        private selectedWaypoint: SelectedWaypoint,
        private dispatcher: ReloadDispatcher,
        private schedules: DiveSchedules) {
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

        this.profileChartPlotter = new ChartPlotter(this.dive, this.resampling, this.units);
        this.updateLayoutThickFormat();
        this.dispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId?: number) => {
                if (this.schedules.selected.id === diveId) {
                    this.plotCharts();
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
            this.cursor1.x0 = DateFormats.toDate(wayPoint.startTime);
            this.cursor1.x1 = DateFormats.toDate(wayPoint.endTime);
            this.cursor1.y0 = wayPoint.startDepth;
            this.cursor1.y1 = wayPoint.endDepth;
            update.shapes.push(this.cursor1);
        }

        Plotly.relayout(this.elementName, update);
    }

    private plotCharts(): void {
        this.updateLayoutThickFormat();
        this.profileChartPlotter.dive = this.dive;
        // performance: number of samples shown in chart doesn't speedup the drawing significantly
        const dataAverageDepths = this.profileChartPlotter.plotAverageDepth();
        const depths = this.profileChartPlotter.plotDepths();
        const ceilings = this.profileChartPlotter.plotCeilings();
        const plotEvents = this.profileChartPlotter.plotEvents();
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
}
