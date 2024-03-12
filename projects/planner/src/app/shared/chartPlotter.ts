import {UnitConversion} from './UnitConversion';
import {ResamplingService} from './ResamplingService';
import {DiveResults} from './diveresults';



export class ChartPlotterFactory {

    private namePrefix = '';
    private averageDepthLineColor = 'rgb(62, 157, 223)';
    private depthLineColor = 'rgb(31, 119, 180)';
    private ceilingLineColor = 'rgb(255, 160, 73)';
    private eventLineColor = 'rgba(31, 119, 180, 0.7)';
    private eventFillColor = 'rgba(31, 119, 180, 0.5)';

    constructor(private resampling: ResamplingService, private units: UnitConversion) {
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

    public create(dive: DiveResults): ChartPlotter {
        return new ChartPlotter(
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

export class ChartPlotter {

    private readonly namePrefix: string = '';
    private readonly averageDepthLineColor: string = 'rgb(62, 157, 223)';
    private readonly depthLineColor: string = 'rgb(31, 119, 180)';
    private readonly ceilingLineColor: string = 'rgb(255, 160, 73)';
    private readonly eventLineColor: string = 'rgba(31, 119, 180, 0.7)';
    private readonly eventFillColor: string = 'rgba(31, 119, 180, 0.5)';

    constructor(
        public dive: DiveResults,
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

    public plotAverageDepth(): any {
        const resampleAverageDepth = this.resampling.resampleAverageDepth(this.dive.wayPoints);

        const dataAverageDepths = {
            x: resampleAverageDepth.xValues,
            y: resampleAverageDepth.yValues,
            type: 'scatter',
            line: {
                dash: 'dot'
            },
            name: this.namePrefix + 'Avg. depth',
            marker: {
                color: this.averageDepthLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return dataAverageDepths;
    }

    public plotDepths(): any {
        const resampled = this.resampling.resampleWaypoints(this.dive.wayPoints);

        const data = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            name: this.namePrefix + 'Depth',
            marker: {
                color: this.depthLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return data;
    }

    public plotCeilings(): any {
        const resampled = this.resampling.resampleCeilings(this.dive.ceilings);

        const dataCeilings = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            fill: 'tozeroy',
            name: this.namePrefix + 'Ceiling',
            marker: {
                color: this.ceilingLineColor
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return dataCeilings;
    }

    public plotEvents(): any {
        const resampled = this.resampling.convertEvents(this.dive.events);

        const dataEvents = {
            x: resampled.xValues,
            y: resampled.yValues,
            labels: resampled.labels,
            text: resampled.labels,
            type: 'scatter',
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

        return dataEvents;
    }
}
