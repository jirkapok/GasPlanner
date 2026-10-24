import * as Plotly from 'plotly.js-dist';
import _ from 'lodash';
import { UnitConversion } from './UnitConversion';
import { ResamplingService } from './ResamplingService';
import { DiveResults } from './diveresults';
import { DateFormats } from './formaters';
import { Ceiling, Precision, Segment } from 'scuba-physics';
import { WayPoint } from './wayPoint';
import { BoundEvent } from './models';
import type { ProfileHoverValues } from './profileHoverValues';

/** Layout which always defines both axes, so they can be updated without null checks */
type ChartLayout = Partial<Plotly.Layout> & Pick<Plotly.Layout, 'xaxis' | 'yaxis'>;

/** Legend including properties supported by plotly, but missing in its typings */
export type ChartLegend = Partial<Plotly.Legend> & {
    entrywidth?: number;
    entrywidthmode?: 'fraction' | 'pixels';
};

/** Last segment of every trace uid, identifies the trace in hover events */
export enum TraceKind {
    averageDepth = 'averageDepth',
    depth = 'depth',
    emergency = 'emergency',
    ceiling = 'ceiling',
    events = 'events'
}

/** Resolves kind from trace uid, which may be prefixed (e.g. 'diffResultsTable.profileA.depth') */
export const traceKindOf = (uid: string | undefined): TraceKind | undefined => {
    const candidate = uid?.split('.').pop();
    return Object.values(TraceKind).find(k => k === candidate);
};

/** Cant be Injectable because is builder pattern which keeps state from last configuration */
export class ChartPlotterFactory {
    public static readonly depthLineColorA = 'rgb(31, 119, 180)';
    public static readonly depthLineColorB = 'rgb(141, 143, 144)';
    private namePrefixKey: string | null = null;
    private averageDepthLineColor = 'rgb(62, 157, 223)';
    private ceilingLineColor = 'rgb(255, 160, 73)';
    private eventLineColor = 'rgba(31, 119, 180, 0.7)';
    private eventFillColor = 'rgba(31, 119, 180, 0.5)';
    private depthLineColor = ChartPlotterFactory.depthLineColorA;
    private hideHoverLabels = false;
    private legendAbove = false;
    /** in seconds */
    private timeOffset: () => number;

    constructor(
        private resampling: ResamplingService,
        private units: UnitConversion,
        private translate: (key: string) => string = key => key) {
        this.timeOffset = () => 0;
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

    public createLayout(): ChartLayout {
        const layout: ChartLayout = {
            autosize: true,
            showlegend: false,
            xaxis: {
                fixedrange: true,
                title: {
                    text: `${this.translate('profileChart.timeAxisLabel')} [min]`
                }
            },
            yaxis: {
                fixedrange: true,
                autorange: 'reversed',
                title: {
                    text: `${this.translate('profileChart.depthAxisLabel')} [${this.units.length}]`
                }
            },
            margin: { l: 40, r: 10, b: 40, t: 10 },
            // unified box ignores trace hoverinfo 'none', so it would still be drawn
            hovermode: this.hideHoverLabels ? 'x' : 'x unified',
            hoverlabel: {
                bgcolor: 'rgba(200, 200, 200, 0.25)',
                bordercolor: 'rgba(200, 200, 200, 0.25)'
            },
            shapes: []
        };

        if (this.hideHoverLabels) {
            // the same vertical line, which unified hover draws by default
            layout.xaxis.showspikes = true;
            layout.xaxis.spikemode = 'across';
            layout.xaxis.spikedash = 'dot';
            layout.xaxis.spikethickness = 1.5;
            layout.xaxis.spikecolor = '#444';
        }

        if (this.legendAbove) {
            layout.showlegend = true;
            const legend: ChartLegend = {
                orientation: 'h',
                x: 0,
                xanchor: 'left',
                y: 1.02,
                yanchor: 'bottom',
                // chart is redrawn after each calculation, which would reset the hidden lines
                itemclick: false,
                itemdoubleclick: false,
                // fixed columns, so longer names with hovered values don't add legend rows,
                // smaller font fits names with values into the columns on phones
                entrywidth: 0.5,
                font: { size: 10 },
                entrywidthmode: 'fraction'
            };
            layout.legend = legend;
            // hovered time and events as chart title in reserved top margin above the legend,
            // legend title would shift the legend entries
            layout.margin = { ...layout.margin, t: 70 };
            layout.title = {
                text: '',
                font: { size: 12 },
                xref: 'paper',
                x: 0,
                xanchor: 'left',
                yref: 'container',
                y: 1,
                yanchor: 'top',
                pad: { t: 4 }
            };
        }

        return layout;
    }

    /** Translation key (e.g. 'diffResultsTable.profileA') for the trace-name prefix, or null for no prefix. */
    public withNamePrefix(prefixKey: string | null): ChartPlotterFactory {
        this.namePrefixKey = prefixKey;
        return this;
    }

    /** Plotly doesn't draw the hover box, but still fires the hover events */
    public withoutHoverLabels(): ChartPlotterFactory {
        this.hideHoverLabels = true;
        return this;
    }

    /** Static key of the chart lines above the plot area */
    public withLegendAbove(): ChartPlotterFactory {
        this.legendAbove = true;
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

    /** Set time (x axis) offset in seconds */
    public withTimeOffset(offsetFn: () => number): ChartPlotterFactory {
        this.timeOffset = offsetFn;
        return this;
    }

    public create(dive: () => DiveResults): DiveTracesBuilder {
        return new DiveTracesBuilder(
            dive,
            this.resampling,
            this.units,
            this.translate,
            this.timeOffset,
            this.namePrefixKey,
            this.averageDepthLineColor,
            this.depthLineColor,
            this.ceilingLineColor,
            this.eventLineColor,
            this.eventFillColor,
            this.hideHoverLabels,
        );
    }
}

export class DiveTracesBuilder {
    private static readonly nameKeys: Record<TraceKind, string> = {
        [TraceKind.averageDepth]: 'profileChart.avgDepthTraceName',
        [TraceKind.depth]: 'profileChart.depthTraceName',
        [TraceKind.emergency]: 'profileChart.emergencyTraceName',
        [TraceKind.ceiling]: 'profileChart.ceilingTraceName',
        [TraceKind.events]: 'profileChart.eventTraceName'
    };

    public showEmergencyAscent = false;
    private readonly namePrefixKey: string | null = null;
    private readonly averageDepthLineColor: string = 'rgb(62, 157, 223)';
    private readonly depthLineColor: string = 'rgb(31, 119, 180)';
    private readonly ceilingLineColor: string = 'rgb(255, 160, 73)';
    private readonly eventLineColor: string = 'rgba(31, 119, 180, 0.7)';
    private readonly eventFillColor: string = 'rgba(31, 119, 180, 0.5)';

    constructor(
        private dive: () => DiveResults,
        private resampling: ResamplingService,
        private units: UnitConversion,
        private translate: (key: string) => string,
        /** in seconds */
        private timeOffset: () => number,
        namePrefixKey: string | null,
        averageDepthLineColor: string,
        depthLineColor: string,
        ceilingLineColor: string,
        eventLineColor: string,
        eventFillColor: string,
        private hideHoverLabels: boolean,
    ) {
        this.namePrefixKey = namePrefixKey;
        this.averageDepthLineColor = averageDepthLineColor;
        this.depthLineColor = depthLineColor;
        this.ceilingLineColor = ceilingLineColor;
        this.eventLineColor = eventLineColor;
        this.eventFillColor = eventFillColor;
    }

    /** Re-resolved on every trace build so a language switch updates it without recreating the builder. */
    private get namePrefix(): string {
        return this.namePrefixKey ? this.translate(this.namePrefixKey) + ' ' : '';
    }

    private static hoveredValue(kind: TraceKind, hovered: ProfileHoverValues): number | undefined {
        switch (kind) {
            case TraceKind.averageDepth:
                return hovered.averageDepth;
            case TraceKind.depth:
                return hovered.depth;
            case TraceKind.emergency:
                return hovered.emergencyDepth;
            case TraceKind.ceiling:
                return hovered.ceiling;
            default:
                return undefined;
        }
    }

    /** Name shown in legend, with value at hovered time if available */
    public traceName(kind: TraceKind, hovered?: ProfileHoverValues): string {
        const name = this.namePrefix + this.translate(DiveTracesBuilder.nameKeys[kind]);
        const value = hovered ? DiveTracesBuilder.hoveredValue(kind, hovered) : undefined;

        if (value === undefined) {
            return name;
        }

        return `${name} ${Precision.round(value, 1)} ${this.units.length}`;
    }

    public allTraces(): Partial<Plotly.PlotData>[] {
        const diveResult = this.dive();
        // performance: number of samples shown in chart doesn't speedup the drawing significantly
        const profileTraces = this.profileTraces();
        const ceilings = this.plotCeilings(diveResult.ceilings);
        const events = this.plotEvents(diveResult.events, diveResult.totalDuration);
        const emergencyDepths = this.plotEmergencyDepths(diveResult.emergencyAscent);

        if(this.showEmergencyAscent) {
            return [ ...profileTraces, emergencyDepths, ceilings, events ];
        }

        return [ ...profileTraces, ceilings, events ];
    }

    public profileTraces(): Partial<Plotly.PlotData>[] {
        const diveResult = this.dive();
        const averageDepths = this.plotAverageDepth(diveResult.profile);
        const depths = this.plotDepths(diveResult.wayPoints);
        return [averageDepths, depths];
    }

    private plotAverageDepth(profile: Segment[]): Partial<Plotly.PlotData> {
        const resampleAverageDepth = this.resampling.resampleAverageDepth(profile);

        return this.identify(TraceKind.averageDepth, {
            x: this.applyTimeOffset(resampleAverageDepth.xValues),
            y: resampleAverageDepth.yValues,
            type: 'scatter',
            line: {
                dash: <Plotly.Dash>'dot'
            },
            name: this.traceName(TraceKind.averageDepth),
            marker: {
                color: this.averageDepthLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        });
    }

    private plotDepths(wayPoints: WayPoint[]): Partial<Plotly.PlotData> {
        const resampled = this.resampling.resampleWaypoints(wayPoints);

        return this.identify(TraceKind.depth, {
            x: this.applyTimeOffset(resampled.xValues),
            y: resampled.yValues,
            type: 'scatter',
            name: this.traceName(TraceKind.depth),
            marker: {
                color: this.depthLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        });
    }

    private plotEmergencyDepths(wayPoints: WayPoint[]): Partial<Plotly.PlotData> {
        const resampled = this.resampling.resampleWaypoints(wayPoints);

        return this.identify(TraceKind.emergency, {
            x: this.applyTimeOffset(resampled.xValues),
            y: resampled.yValues,
            type: 'scatter',
            name: this.traceName(TraceKind.emergency),
            line: {
                dash: <Plotly.Dash>'dash'
            },
            marker: {
                color: 'rgb(255, 77, 77)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        });
    }

    private plotCeilings(ceilings: Ceiling[]): Partial<Plotly.PlotData> {
        const resampled = this.resampling.resampleCeilings(ceilings);

        const dataCeilings = {
            x: this.applyTimeOffset(resampled.xValues),
            y: resampled.yValues,
            type: <Plotly.PlotType>'scatter',
            fill: 'tozeroy',
            name: this.traceName(TraceKind.ceiling),
            marker: {
                color: this.ceilingLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return this.identify(TraceKind.ceiling, <Partial<Plotly.PlotData>>dataCeilings);
    }

    private plotEvents(events: BoundEvent[], totalDuration: number): Partial<Plotly.PlotData> {
        const resampled = this.resampling.convertEvents(events, totalDuration);

        const dataEvents = {
            x: this.applyTimeOffset(resampled.xValues),
            y: resampled.yValues,
            labels: resampled.labels,
            text: resampled.labels,
            type: <Plotly.PlotType>'scatter',
            mode: 'text+markers',
            fill: 'tozeroy',
            name: this.traceName(TraceKind.events),
            hovertemplate: '%{text}',
            texttemplate: '%{text}',
            // plotly supports position per point, but typings allow only single value
            textposition: <Plotly.PlotData['textposition']><unknown>resampled.textPositions,
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

        return this.identify(TraceKind.events, <Partial<Plotly.PlotData>>dataEvents);
    }

    private identify(kind: TraceKind, trace: Partial<Plotly.PlotData>): Partial<Plotly.PlotData> {
        trace.uid = this.namePrefixKey ? `${this.namePrefixKey}.${kind}` : kind;

        if (this.hideHoverLabels) {
            trace.hoverinfo = 'none';
            // takes precedence over hoverinfo
            delete trace.hovertemplate;
        }

        return trace;
    }

    private applyTimeOffset(timestamps: Date[]): Date[] {
        const millisecondsOffset = this.timeOffset() * 1000;
        return timestamps.map(date =>
            new Date(date.getTime() + millisecondsOffset)
        );
    }
}

export class ChartPlotter {
    private builders: DiveTracesBuilder[];
    private options: Partial<Plotly.Config>;
    private cursor1: Partial<Plotly.Shape>;
    private layout: ChartLayout;
    /** Builder and kind of each plotted trace in the same order as in the chart */
    private plotted: { builder: DiveTracesBuilder; kind: TraceKind | undefined }[] = [];
    /** prevents redrawing the legend, when the mouse moves but the values didn't change */
    private lastLegend: string | undefined;

    /** Provide traces in reverse order to keep the last on top */
    constructor(public elementName: string,
                private totalDuration: () => number,
                private chartPlotterFactory: ChartPlotterFactory,
                ...traceBuilders: DiveTracesBuilder[]) {
        this.builders = traceBuilders;
        this.cursor1 = chartPlotterFactory.createCursor();
        this.layout = chartPlotterFactory.createLayout();
        this.options = chartPlotterFactory.createOptions();
    }

    public plotAllCharts(): void {
        this.plotCharts(b => b.allTraces());
    }

    public plotProfileChartsOnly(): void {
        this.plotCharts(b => b.profileTraces());
    }

    public plotCursor(wayPoint: WayPoint | undefined): void {
        const shapes: Partial<Plotly.Shape>[] = [];

        if(wayPoint) {
            this.updateCursor(wayPoint, this.cursor1);
            shapes.push(this.cursor1);
        }

        const update: Partial<Plotly.Layout> = { shapes };
        void Plotly.relayout(this.elementName, update);
    }

    public plotCharts(getTraces: (b: DiveTracesBuilder) => Partial<Plotly.PlotData>[]): void {
        this.updateLayoutThickFormat();
        this.updateLayoutAxisTitles();
        const plotted = this.builders.map(b => getTraces(b).map(trace => ({ builder: b, trace })));
        const flattened = _.flatten(plotted);
        this.plotted = flattened.map(p => ({ builder: p.builder, kind: traceKindOf(p.trace.uid) }));
        this.lastLegend = undefined;
        const traces: Plotly.Data[] = flattened.map(p => p.trace);
        void Plotly.react(this.elementName, traces, this.layout, this.options);
    }

    /** Shows values at hovered time in legend entries and time with events in chart title, or plain names if nothing hovered */
    public plotHoverValues(hovered: ProfileHoverValues | undefined): void {
        const names = this.plotted.map(p => p.kind ? p.builder.traceName(p.kind, hovered) : '');
        const title = hovered ? [DateFormats.formatRuntime(hovered.timeStamp), ...hovered.events].join(' | ') : '';
        const legend = [title, ...names].join('\n');

        if (legend === this.lastLegend) {
            return;
        }

        this.lastLegend = legend;
        const traceUpdate = { name: names } as unknown as Plotly.Data;
        const layoutUpdate = { 'title.text': title } as unknown as Partial<Plotly.Layout>;
        void Plotly.update(this.elementName, traceUpdate, layoutUpdate);
    }

    private updateLayoutThickFormat(): void {
        // setting to string instead expected d3 formatting function causes warning in console = want fix
        const maxDuration = this.totalDuration();
        this.layout.xaxis.tickformat = DateFormats.selectChartTimeFormat(maxDuration);
    }

    /** Axis titles are translated text, re-resolved on every redraw so a language switch is reflected immediately. */
    private updateLayoutAxisTitles(): void {
        const freshLayout = this.chartPlotterFactory.createLayout();
        this.layout.xaxis.title = freshLayout.xaxis.title;
        this.layout.yaxis.title = freshLayout.yaxis.title;
    }

    private updateCursor(wayPoint: WayPoint, cursor: Partial<Plotly.Shape>): void {
        cursor.x0 = DateFormats.toDate(wayPoint.startTime);
        cursor.x1 = DateFormats.toDate(wayPoint.endTime);
        cursor.y0 = wayPoint.startDepth;
        cursor.y1 = wayPoint.endDepth;
    }
}
