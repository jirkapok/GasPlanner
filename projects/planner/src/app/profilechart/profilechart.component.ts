import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint } from '../shared/models';
import { faChartArea } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js';
import { Subscription } from 'rxjs';
import { EventType, Time, Gas, StandardGases } from 'scuba-physics';
import { DateFormats } from '../shared/formaters';

@Component({
    selector: 'app-profilechart',
    templateUrl: './profilechart.component.html',
    styleUrls: ['./profilechart.component.css']
})
export class ProfileChartComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    public dive: Dive;
    public icon = faChartArea;
    private readonly elementName = 'diveplot';

    private options = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        // staticPlot: true,
        autosize: true,
        scrollZoom: false,
        editable: false
    };

    private layout: any;

    constructor(private planer: PlannerService) {
        this.dive = this.planer.dive;

        this.layout = {
            autosize: true,
            showlegend: false,
            xaxis: {
                fixedrange: true,
                title: {
                    text: 'Time [minutes]'
                }
            },
            yaxis: {
                fixedrange: true,
                autorange: 'reversed',
                title: {
                    text: 'Depth [meters]'
                }
            },
            margin: { l: 40, r: 10, b: 40, t: 10 },
        };

        this.updateLayoutThickFormat();
        this.subscription = this.planer.calculated.subscribe(() => {
            this.plotCharts();
        });
    }

    @Output()
    public chartHover: EventEmitter<string> = new EventEmitter<string>();

    ngOnInit() {
        this.plotCharts();
        const chartElement: any = document.getElementById(this.elementName);
        chartElement.on('plotly_hover', (e: any) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: any) => this.plotlyHover(e));
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

    public get noDecoTime(): number {
        return this.planer.plan.noDecoTime;
    }

    public plotlyHover(data: any): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x;
        this.chartHover.emit(timeStampValue);
    }

    private plotCharts(): void {
        this.updateLayoutThickFormat();
        this.plotDepths();
        this.plotCeilings();
        this.plotEvents();
    }

    private updateLayoutThickFormat(): void {
        this.layout.xaxis.tickformat = DateFormats.selectChartTimeFormat(this.dive.totalDuration);
    }

    private plotDepths(): void {
        const xValues: Date[] = [];
        const yValues: number[] = [];

        const data = [{
            x: xValues,
            y: yValues,
            type: 'scatter',
            name: 'dive',
            marker: {
                color: 'rgb(31, 119, 180)'
            }
        }];

        this.dive.wayPoints.forEach((item, index, waypoints) => {
            this.resampleToSeconds(xValues, yValues, item);
        });

        Plotly.react(this.elementName, data, this.layout, this.options);
    }

    private plotCeilings(): void {
        const xCeilingValues: Date[] = [];
        const yCeilingValues: number[] = [];

        // possible performance optimization = remove all waypoints, where ceiling = 0 and depth didn't change
        this.dive.ceilings.forEach((item, index, ceilings) => {
            xCeilingValues.push(Time.toDate(item.time));
            const depth = this.roundDepth(item.depth);
            yCeilingValues.push(depth);
        });

        const dataCeilings = [{
            x: xCeilingValues,
            y: yCeilingValues,
            type: 'scatter',
            fill: 'tozeroy',
            name: 'ceilings',
            marker: {
                color: 'rgb(255, 160, 73)'
            }
        }];

        Plotly.plot(this.elementName, dataCeilings, this.layout, this.options);
    }

    private plotEvents(): void {
        const x: Date[] = [];
        const y: number[] = [];
        const labels: string[] = [];

        const dataEvents = [{
            x: x,
            y: y,
            labels: labels,
            text: labels,
            type: 'scatter',
            mode: 'text+markers',
            fill: 'tozeroy',
            name: 'events',
            hovertemplate: '%{x}<br>%{text} at %{y}m',
            texttemplate: '%{text}',
            textposition: 'top left',
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
        }];

        const eventsLayout = {
            xaxis: {
                showgrid: false,
                showline: false
            },
            fig_bgcolor: 'rgb(255, 255, 255)',
            plot_bgcolor: 'rgba(0, 0, 0, 0)',
            paper_bgcolor: 'rgba(0, 0, 0, 0)'
        };

        this.convertEvents(x, y, labels);
        Plotly.plot(this.elementName, dataEvents, eventsLayout);
    }

    private convertEvents(x: Date[], y: number[], labels: string[]): void {
        this.dive.events.forEach((event, index, events) => {
            if (event.type === EventType.gasSwitch) {
                x.push(Time.toDate(event.timeStamp));
                y.push(event.depth);
                const gas = <Gas>event.data;
                const gasName = StandardGases.nameFor(gas.fO2);
                labels.push(`Switch to ${gasName}`);
            }
        });
    }

    private roundDepth(depth: number): number {
        return Math.round(depth * 100) / 100;
    }

    private resampleToSeconds(xValues: Date[], yValues: number[], item: WayPoint) {
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
