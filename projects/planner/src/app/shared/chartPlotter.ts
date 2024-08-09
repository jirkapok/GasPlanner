import * as Plotly from 'plotly.js-basic-dist';
import _ from 'lodash';
import { UnitConversion } from './UnitConversion';
import { ResamplingService } from './ResamplingService';
import { DiveResults } from './diveresults';
import { DateFormats } from './formaters';
import { Ceiling, Event } from 'scuba-physics';
import { WayPoint } from './wayPoint';

/** Cant be Injectable because is builder pattern which keeps state from last configuration */
export class ChartPlotterFactory {
    public static readonly depthLineColorA = 'rgb(31, 119, 180)';
    public static readonly depthLineColorB = 'rgb(141, 143, 144)';
    private namePrefix = '';
    private averageDepthLineColor = 'rgb(62, 157, 223)';
    private ceilingLineColor = 'rgb(255, 160, 73)';
    private eventLineColor = 'rgba(31, 119, 180, 0.7)';
    private eventFillColor = 'rgba(31, 119, 180, 0.5)';
    private depthLineColor = ChartPlotterFactory.depthLineColorA;

    constructor(private resampling: ResamplingService, private units: UnitConversion) {
    }

    public createOptions(): Partial<Plotly.Config> {
        return {
            displaylogo: false,
            displayModeBar: false,
            responsive: true,
            // staticPlot: true,
            autosizable: true,
            scrollZoom: false,
            editable: false
        };
    }

    public createCursor(): Partial<Plotly.Shape> {
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
                color: ChartPlotterFactory.depthLineColorA,
                width: 5
            }
        };
    }

    public createLayout(): Partial<Plotly.Layout> {
        return {
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
                    text: `Depth [${this.units.length}]`
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
    }

    public wthNamePrefix(prefix: string): ChartPlotterFactory {
        this.namePrefix = prefix;
        return this;
    }
    public wthAverageDepthColor(color: string): ChartPlotterFactory {
        this.averageDepthLineColor = color;
        return this;
    }

    public wthDepthColor(color: string): ChartPlotterFactory {
        this.depthLineColor = color;
        return this;
    }

    public wthCeilingColor(color: string): ChartPlotterFactory {
        this.ceilingLineColor = color;
        return this;
    }

    public wthEventLineColor(color: string): ChartPlotterFactory {
        this.eventLineColor = color;
        return this;
    }

    public wthEventFillColor(color: string): ChartPlotterFactory {
        this.eventFillColor = color;
        return this;
    }

    public create(dive: () => DiveResults): DiveTracesBuilder {
        return new DiveTracesBuilder(
            dive,
            this.resampling,
            this.units,
            this.namePrefix,
            this.averageDepthLineColor,
            this.depthLineColor,
            this.ceilingLineColor,
            this.eventLineColor,
            this.eventFillColor
        );
    }
}

export class DiveTracesBuilder {
    private readonly namePrefix: string = '';
    private readonly averageDepthLineColor: string = 'rgb(62, 157, 223)';
    private readonly depthLineColor: string = 'rgb(31, 119, 180)';
    private readonly ceilingLineColor: string = 'rgb(255, 160, 73)';
    private readonly eventLineColor: string = 'rgba(31, 119, 180, 0.7)';
    private readonly eventFillColor: string = 'rgba(31, 119, 180, 0.5)';

    constructor(
        private dive: () => DiveResults,
        private resampling: ResamplingService,
        private units: UnitConversion,
        namePrefix: string,
        averageDepthLineColor: string,
        depthLineColor: string,
        ceilingLineColor: string,
        eventLineColor: string,
        eventFillColor: string
    ) {
        this.namePrefix = namePrefix;
        this.averageDepthLineColor = averageDepthLineColor;
        this.depthLineColor = depthLineColor;
        this.ceilingLineColor = ceilingLineColor;
        this.eventLineColor = eventLineColor;
        this.eventFillColor = eventFillColor;
    }

    public traces(): Partial<Plotly.PlotData>[] {
        const diveResult = this.dive();
        // performance: number of samples shown in chart doesn't speedup the drawing significantly
        const averageDepths = this.plotAverageDepth(diveResult.wayPoints);
        const depths = this.plotDepths(diveResult.wayPoints);
        const ceilings = this.plotCeilings(diveResult.ceilings);
        const events = this.plotEvents(diveResult.events);
        return [ averageDepths, depths, ceilings, events ];
    }

    private plotAverageDepth(wayPoints: WayPoint[]): Partial<Plotly.PlotData> {
        const resampleAverageDepth = this.resampling.resampleAverageDepth(wayPoints);

        return {
            x: resampleAverageDepth.xValues,
            y: resampleAverageDepth.yValues,
            type: <Plotly.PlotType>'scatter',
            line: {
                dash: <Plotly.Dash>'dot'
            },
            name: this.namePrefix + 'Avg. depth',
            marker: {
                color: this.averageDepthLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };
    }

    private plotDepths(wayPoints: WayPoint[]): Partial<Plotly.PlotData> {
        const resampled = this.resampling.resampleWaypoints(wayPoints);

        return {
            x: resampled.xValues,
            y: resampled.yValues,
            type: <Plotly.PlotType>'scatter',
            name: this.namePrefix + 'Depth',
            marker: {
                color: this.depthLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };
    }

    private plotCeilings(ceilings: Ceiling[]): Partial<Plotly.PlotData> {
        const resampled = this.resampling.resampleCeilings(ceilings);

        const dataCeilings = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: <Plotly.PlotType>'scatter',
            fill: 'tozeroy',
            name: this.namePrefix + 'Ceiling',
            marker: {
                color: this.ceilingLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return <Partial<Plotly.PlotData>>dataCeilings;
    }

    private plotEvents(events: Event[]): Partial<Plotly.PlotData> {
        const resampled = this.resampling.convertEvents(events);

        const dataEvents = {
            x: resampled.xValues,
            y: resampled.yValues,
            labels: resampled.labels,
            text: resampled.labels,
            type: <Plotly.PlotType>'scatter',
            mode: 'text+markers',
            fill: 'tozeroy',
            name: this.namePrefix + 'Event',
            hovertemplate: '%{text}',
            texttemplate: '%{text}',
            textposition: 'top center',
            fillcolor: 'rgba(0, 0, 0, 0)',
            marker: {
                color: this.eventFillColor,
                size: 8,
                // symbol: 'bowtie-open', // https://plotly.com/javascript/reference/#box-marker-symbol
                line: {
                    color: this.eventLineColor,
                    width: 2
                }
            },
            showlegend: false
        };

        return <Partial<Plotly.PlotData>>dataEvents;
    }
}

export class ChartPlotter {
    private builders: DiveTracesBuilder[];
    private options: Partial<Plotly.Config>;
    private cursor1: Partial<Plotly.Shape>;
    private layout: Partial<Plotly.Layout>;

    /** Provide traces in reverse order to keep the last on top */
    constructor(public elementName: string, chartPlotterFactory: ChartPlotterFactory, ...traceBuilders: DiveTracesBuilder[]) {
        this.builders = traceBuilders;
        this.cursor1 = chartPlotterFactory.createCursor();
        this.layout = chartPlotterFactory.createLayout();
        this.options = chartPlotterFactory.createOptions();
    }

    public plotCharts(totalDuration: number): void {
        this.updateLayoutThickFormat(totalDuration);
        const traces: Plotly.Data[] = _(this.builders).map(b => b.traces())
            .flatten()
            .toArray().value();
        void Plotly.react(this.elementName, traces, this.layout, this.options);
    }

    public plotCursor(wayPoint: WayPoint | undefined): void {
        if(wayPoint) {
            this.updateCursor(wayPoint, this.cursor1);
            const update: Partial<Plotly.Layout> = {
                shapes: [ this.cursor1 ]
            };

            void Plotly.relayout(this.elementName, update);
        }
    }

    private updateLayoutThickFormat(totalDuration: number): void {
        // setting to string instead expected d3 formatting function causes warning in console = want fix
        this.layout.xaxis!.tickformat = DateFormats.selectChartTimeFormat(totalDuration);
    }

    private updateCursor(wayPoint: WayPoint, cursor: Partial<Plotly.Shape>): void {
        cursor.x0 = DateFormats.toDate(wayPoint.startTime);
        cursor.x1 = DateFormats.toDate(wayPoint.endTime);
        cursor.y0 = wayPoint.startDepth;
        cursor.y1 = wayPoint.endDepth;
    }
}
