import * as Plotly from 'plotly.js-dist';
import { HeatMapOverPressures, HeatMapPlotter } from './heatMapPlotter';

describe('HeatMapPlotter', () => {
    it('creates', () => {
        const sut = new HeatMapPlotter('fake-element-id');
        expect(sut).toBeTruthy();
    });

    it('plots the heat map', async () => {
        const id = 'heatmap-dom-test';
        const graphDiv = document.createElement('div');
        graphDiv.id = id;
        graphDiv.style.width = '600px';
        graphDiv.style.height = '400px';
        document.body.appendChild(graphDiv);

        const input = [
            Array.from({ length: 16 }, (_, i) => i),
            Array.from({ length: 16 }, (_, i) => 100 + i)
        ] as HeatMapOverPressures;

        const expectedZ = Array.from(
            { length: 16 },
            (_, i) => [i, 100 + i]
        ).reverse();

        try {
            await new HeatMapPlotter(id).plotHeatMap(input);

            const plotted = (graphDiv as unknown as Plotly.PlotlyHTMLElement).data[0] as Partial<Plotly.PlotData>;
            expect(plotted.type).toBe('heatmap');
            expect(plotted.z).toEqual(expectedZ);
            expect(graphDiv.querySelector('svg.main-svg')).not.toBeNull();
        } finally {
            // Causes error when uncommented
            // Plotly.purge(graphDiv);
            graphDiv.remove();
        }
    });

    it('resolves after the heat map is sized to its element', async () => {
        const id = 'heatmap-resolve-test';
        const graphDiv = document.createElement('div');
        graphDiv.id = id;
        graphDiv.style.width = '600px';
        graphDiv.style.height = '50px';
        document.body.appendChild(graphDiv);

        try {
            await expect(new HeatMapPlotter(id).plotHeatMap([])).resolves.toBeUndefined();

            const layout = (graphDiv as unknown as { _fullLayout: Plotly.Layout })._fullLayout;
            expect(layout.width).toBe(600);
        } finally {
            graphDiv.remove();
        }
    });

    it('plots into hidden element without error', async () => {
        const id = 'heatmap-hidden-test';
        const graphDiv = document.createElement('div');
        graphDiv.id = id;
        graphDiv.style.display = 'none';
        document.body.appendChild(graphDiv);
        // zone.js reports unhandled promise rejections to the console
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            await new HeatMapPlotter(id).plotHeatMap([]);

            const plotted = (graphDiv as unknown as Plotly.PlotlyHTMLElement).data[0] as Partial<Plotly.PlotData>;
            expect(plotted.type).toBe('heatmap');
            expect(consoleError).not.toHaveBeenCalled();
        } finally {
            graphDiv.remove();
        }
    });
});
