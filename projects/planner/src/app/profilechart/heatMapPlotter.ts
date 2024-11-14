import * as Plotly from 'plotly.js-dist';

export class HeatMapPlotter {
    // TODO define proper colorscale: blue, black, green, yellow, red
    private readonly colorscaleValue = [
        [0, 'green'],
        [0.5, 'yellow'],
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
            colorscale: this.colorscaleValue,
            showscale: false,
            cmin: 0,
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

    public plotHeatMap(): void {
        const data = [
            {
                z: [
                    [0, 0.3, 0.8, 0.7, 0.2],
                    [0.8, 0.9, 1.2, 0.7, 0.9],
                    [0.8, 0.9, 1.2, 1.1, 1]
                ],
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
