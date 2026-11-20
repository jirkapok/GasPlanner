import * as Plotly from 'plotly.js-dist';
import * as _ from 'lodash';

/**
 * Same as TissueOverPressures[], except all number
 * fields are replaced with number | null
 */
export type HeatMapOverPressures =
    [number | null, number | null, number | null, number | null,
    number | null, number | null, number | null, number | null,
    number | null, number | null, number | null, number | null,
    number | null, number | null, number | null, number | null][];

export class HeatMapPlotter {
    /** Max. columns drawn, more than heat map width in pixels */
    private static readonly maxSamples = 1000;

    private readonly colorScale: Plotly.ColorScale = [
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
     * Plotly draws one canvas pixel per sample, browser can't draw canvas wider than 65 535 pixels.
     * Samples evenly distributed in time including the first and last one are kept,
     * so heat maps of the same length are resampled to the same times.
     */
    private static resample(dataValues: HeatMapOverPressures): HeatMapOverPressures {
        const length = dataValues.length;
        const maxSamples = HeatMapPlotter.maxSamples;

        if (length <= maxSamples) {
            return dataValues;
        }

        const step = (length - 1) / (maxSamples - 1);
        return Array.from({ length: maxSamples }, (_v, index) => dataValues[Math.round(index * step)]);
    }

    /**
     * Every data array represents a tissue saturation speed changes in time.
     * Expecting values in range of -1 to 1 where:
     * -1: is 100% speed of offgasing.
     *  0: is equilibrium (tissue is not offgasing or ongasing).
     * +1: is 100% speed of ongasing.
     */
    public async plotHeatMap(dataValues: HeatMapOverPressures): Promise<void> {
        const resampled = HeatMapPlotter.resample(dataValues);
        let transponed = _.zip(...resampled) as number[][];
        transponed = transponed.reverse();

        const data: Partial<Plotly.HeatmapData>[] = [
            {
                z: transponed,
                type: 'heatmap',
                colorscale: this.colorScale,
                showscale: false,
                hoverinfo: 'none',
            }
        ];

        await Plotly.newPlot(this.elementName, data, this.layout, this.config);
        await Plotly.relayout(this.elementName, this.layout);
        // fixes initial sizing issues when the plot is hidden on init,
        // but Plotly can resize only displayed elements
        const element = document.getElementById(this.elementName);
        if (element?.offsetParent) {
            // typings declare void, but Plotly returns a promise resolved after the delayed redraw
            await (Plotly.Plots.resize(element) as unknown as Promise<void>);
        }
    }
}
