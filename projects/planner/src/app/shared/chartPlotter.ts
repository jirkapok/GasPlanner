import {UnitConversion} from './UnitConversion';
import {ResamplingService} from './ResamplingService';
import {DiveResults} from './diveresults';

export class ChartPlotter {

    constructor(public dive: DiveResults, private resampling: ResamplingService, private units: UnitConversion) {
    }

    public plotAverageDepth(name: string = 'Avg. depth'): any {
        const resampleAverageDepth = this.resampling.resampleAverageDepth(this.dive.wayPoints);

        const dataAverageDepths = {
            x: resampleAverageDepth.xValues,
            y: resampleAverageDepth.yValues,
            type: 'scatter',
            line: {
                dash: 'dot'
            },
            name: name,
            marker: {
                color: 'rgb(62, 157, 223)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return dataAverageDepths;
    }

    public plotDepths(name: string = 'Depth'): any {
        const resampled = this.resampling.resampleWaypoints(this.dive.wayPoints);

        const data = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            name: name,
            marker: {
                color: 'rgb(31, 119, 180)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return data;
    }

    public plotCeilings(name: string = 'Ceiling'): any {
        const resampled = this.resampling.resampleCeilings(this.dive.ceilings);

        const dataCeilings = {
            x: resampled.xValues,
            y: resampled.yValues,
            type: 'scatter',
            fill: 'tozeroy',
            name: name,
            marker: {
                color: 'rgb(255, 160, 73)'
            },
            hovertemplate: `%{y:.2f}  ${this.units.length}`
        };

        return dataCeilings;
    }

    public plotEvents(name: string = 'Events'): any {
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
