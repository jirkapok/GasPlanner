import { Component, OnInit, OnDestroy, EventEmitter, Output, Input } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint } from '../shared/models';
import { faChartArea } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js';
import { Subscription } from 'rxjs';
import { EventType, Time, Gas, StandardGases, Segment } from 'scuba-physics';
import { DateFormats } from '../shared/formaters';
import { UnitConversion } from '../shared/UnitConversion';
import { SelectedWaypoint } from '../shared/selectedwaypointService';

@Component({
    selector: 'app-profilechart',
    templateUrl: './profilechart.component.html',
    styleUrls: ['./profilechart.component.css']
})
export class ProfileChartComponent implements OnInit, OnDestroy {
    public dive: Dive;
    public icon = faChartArea;
    private readonly elementName = 'diveplot';
    private subscription: Subscription;
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

    constructor(private planer: PlannerService, private units: UnitConversion, private selectedWaypoint: SelectedWaypoint) {
        this.dive = this.planer.dive;

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
        this.subscription = this.planer.wayPointsCalculated.subscribe(() => this.plotCharts());
        this.selectedWaypoint.selectedChanged.subscribe((wayPoint) => this.selectWayPoint(wayPoint));
    }

    public get noDecoTime(): number {
        return this.planer.plan.noDecoTime;
    }

    ngOnInit() {
        this.plotCharts();
        this.chartElement = document.getElementById(this.elementName);
        this.chartElement.on('plotly_hover', (e: any) => this.plotlyHover(e));
        this.chartElement.on('plotly_click', (e: any) => this.plotlyHover(e));
        this.chartElement.on('plotly_unhover', (e: any) => this.plotlyHoverLeave(e));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    public scaleWidth(x: number, graphWidth: number): number {
        return x * graphWidth / this.dive.totalDuration;
    }

    public scaleHeight(y: number, graphHeight: number): number {
        return y * (graphHeight - 10) / this.planer.plan.maxDepth;
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

        if(wayPoint) {
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
        // TODO performance: reduce number of samples shown in chart to speedup the drawing
        const dataAverageDepths = this.plotAverageDepth();
        const depths = this.plotDepths();
        const ceilings = this.plotCeilings();
        const plotEvents = this.plotEvents();
        const traces = [ dataAverageDepths, depths, ceilings, plotEvents ];

        Plotly.react(this.elementName, traces, this.layout, this.options);
    }

    private updateLayoutThickFormat(): void {
        this.layout.xaxis.tickformat = DateFormats.selectChartTimeFormat(this.dive.totalDuration);
    }

    private plotAverageDepth(): any {
        const xDepthValues: Date[] = [];
        const yDepthValues: number[] = [];

        if(this.dive.wayPoints.length > 0) {
            const wayPoints = this.dive.wayPoints;
            this.transformAverageDepth(wayPoints, xDepthValues, yDepthValues);
        }

        const dataAverageDepths = {
            x: xDepthValues,
            y: yDepthValues,
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

    private transformAverageDepth(waiPoints: WayPoint[], xDepthValues: Date[], yDepthValues: number[]): number {
        if (waiPoints.length <= 0) {
            return 0;
        }

        let cumulativeAverage = 0;
        let totalDuration = 0;

        // Uses cumulative average to prevent number overflow for large segment durations
        waiPoints.forEach(wayPoint => {
            if(wayPoint.duration > 0) {
                for (let seconds = 0; seconds < wayPoint.duration; seconds++) {
                    xDepthValues.push(Time.toDate(totalDuration));
                    const depth = wayPoint.depthAt(seconds);
                    const cumulativeWeight = depth + totalDuration * cumulativeAverage;
                    totalDuration++;
                    cumulativeAverage = cumulativeWeight / totalDuration;
                    const rounded = Math.round(cumulativeAverage * 10) / 10;
                    yDepthValues.push(rounded);
                }
            }
        });

        return cumulativeAverage;
    }

    private plotDepths(): any {
        const xValues: Date[] = [];
        const yValues: number[] = [];

        const data = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            name: 'Depth',
            marker: {
                color: 'rgb(31, 119, 180)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        this.dive.wayPoints.forEach((item, index, waypoints) => {
            this.resampleDepthsToSeconds(xValues, yValues, item);
        });

        return data;
    }

    private plotCeilings(): any  {
        const xCeilingValues: Date[] = [];
        const yCeilingValues: number[] = [];

        // possible performance optimization = remove all waypoints, where ceiling = 0 and depth didn't change
        this.dive.ceilings.forEach((item, index, ceilings) => {
            xCeilingValues.push(Time.toDate(item.time));
            const depth = this.roundDepth(item.depth);
            yCeilingValues.push(depth);
        });

        const dataCeilings = {
            x: xCeilingValues,
            y: yCeilingValues,
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
        const x: Date[] = [];
        const y: number[] = [];
        const labels: string[] = [];

        const dataEvents = {
            x: x,
            y: y,
            labels: labels,
            text: labels,
            type: 'scatter',
            mode: 'text+markers',
            fill: 'tozeroy',
            name: 'Event',
            hovertemplate: 'Switch to %{text}',
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

        this.convertEvents(x, y, labels);
        return dataEvents;
    }

    private convertEvents(x: Date[], y: number[], labels: string[]): void {
        this.dive.events.forEach((event, index, events) => {
            if (event.type === EventType.gasSwitch) {
                x.push(Time.toDate(event.timeStamp));
                y.push(event.depth);
                const gas = <Gas>event.data;
                const gasName = StandardGases.nameFor(gas.fO2, gas.fHe);
                labels.push(`${gasName}`);
            }
        });
    }

    private roundDepth(depth: number): number {
        return Math.round(depth * 100) / 100;
    }

    private resampleDepthsToSeconds(xValues: Date[], yValues: number[], item: WayPoint) {
        const speed = (item.endDepth - item.startDepth) / item.duration;
        for (let timeStamp = item.startTime; timeStamp < item.endTime; timeStamp++) {
            xValues.push(Time.toDate(timeStamp));
            let depth = item.startDepth + (timeStamp - item.startTime) * speed;
            depth = this.roundDepth(depth);
            yValues.push(depth);
        }

        // fix end of the dive
        xValues.push(Time.toDate(item.endTime));
        yValues.push(item.endDepth);
    }
}
