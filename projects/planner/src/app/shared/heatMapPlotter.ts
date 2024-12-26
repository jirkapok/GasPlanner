import * as Plotly from 'plotly.js-dist';
import * as _ from "lodash";

export class HeatMapPlotter {
    private readonly colorScale = [
        [0, 'rgb(31, 119, 180)'],
        [0.3, 'white'],
        [0.4, 'lightgrey'],
        [0.5, 'green'],
        [0.7, 'yellow'],
        [1, 'red']
    ];

    private readonly config = {
        displaylogo: false,
        displayModeBar: false,
        responsive: true,
        // staticPlot: true,
        autosizable: true,
        scrollZoom: false,
        editable: false
    };

    private readonly layout = {
        autosize: true,
        showlegend: false,
        hoverinfo: 'none',
        xaxis: {
            fixedrange: true,
            visible: false
        },
        yaxis: {
            fixedrange: true,
            visible: false
        },
        coloraxis: {
            colorscale: this.colorScale,
            showscale: false,
            cmin: -1,
            cmax: 1
        },
        margin: {
            l: 40,
            r: 5,
            b: 0,
            t: 10,
            pad: 0
        },
    };

    public constructor(private elementName: string) {
    }

    /**
     * Every data array represents a tissue saturation speed changes in time.
     * Expecting values in range of -1 to 1 where:
     * -1: is 100% speed of offgasing.
     *  0: is equilibrium (tissue is not offgasing or ongasing).
     * +1: is 100% speed of ongasing.
     */
    public plotHeatMap(dataValues: number[][]): void {
        let transponed = _.zip.apply(_, dataValues) as number[][];
        transponed = transponed.reverse();

        const data: Plotly.Data[] = [
            {
                z: transponed,
                type: <Plotly.PlotType>'heatmap',
                colorscale: this.colorScale as Plotly.ColorScale,
                showscale: false,
                hoverinfo: 'none',
            }
        ];

        Plotly.newPlot(this.elementName, data, this.layout, this.config);
        Plotly.relayout(this.elementName, this.layout);
    }
}
