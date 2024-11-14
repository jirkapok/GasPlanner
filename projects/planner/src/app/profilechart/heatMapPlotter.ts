import * as Plotly from 'plotly.js-dist';

export class HeatMapPlotter {
    private readonly colorScale = [
        [0, 'blue'],
        [0.4, 'black'],
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
        height:50,
        autosize: true,
        showlegend: false,
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
     * -1: is 100% speed of offgasing
     *  0: is equilibrium (tissue is not offgasing or ongasing)
     */
    public plotHeatMap(): void {
        const dataValues = [
            [-1, -0.5, -0.3, 0, 0.2],
            [0, 0.1, 0.2, 0.5, 0.7],
            [0.5, 0.6, 0.7, 0.8, 1]
        ];

        const data = [
            {
                z: dataValues,
                type: <Plotly.PlotType>'heatmap',
                coloraxis: 'coloraxis',
                showscale: false
            }
        ];

        // TODO heatmap chart:
        // * remove hover
        // * width still jumps
        Plotly.newPlot(this.elementName, data, this.layout, this.config);
    }
}
