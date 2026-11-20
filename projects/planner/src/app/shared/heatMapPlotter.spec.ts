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

            const plotted = (graphDiv as unknown as Plotly.PlotlyHTMLElement).data[0] as Partial<Plotly.HeatmapData>;
            expect(plotted.type).toBe('heatmap');
            expect(plotted.z).toEqual(expectedZ);
            expect(graphDiv.querySelector('svg.main-svg')).not.toBeNull();
        } finally {
            // Causes error when uncommented
            // Plotly.purge(graphDiv);
            graphDiv.remove();
        }
    });

    describe('Long heat map', () => {
        // one sample per second, browser can't draw canvas wider than 65 535 pixels
        const samples = 24 * 3600 + 1;
        let graphDiv: HTMLDivElement;

        const plotLongHeatMap = async (): Promise<number[][]> => {
            const input = Array.from({ length: samples }, (_, i) => new Array<number>(16).fill(i)) as HeatMapOverPressures;
            await new HeatMapPlotter(graphDiv.id).plotHeatMap(input);
            const plotted = (graphDiv as unknown as Plotly.PlotlyHTMLElement).data[0] as Partial<Plotly.HeatmapData>;
            return plotted.z as number[][];
        };

        beforeEach(() => {
            graphDiv = document.createElement('div');
            graphDiv.id = 'heatmap-long-test';
            graphDiv.style.width = '600px';
            graphDiv.style.height = '50px';
            document.body.appendChild(graphDiv);
        });

        afterEach(() => {
            graphDiv.remove();
        });

        it('is shortened to 1000 columns', async () => {
            const z = await plotLongHeatMap();

            expect(z.length).toBe(16);
            expect(z[0].length).toBe(1000);
        });

        it('keeps first and last sample', async () => {
            const z = await plotLongHeatMap();

            expect(z[0][0]).toBe(0);
            expect(z[0][999]).toBe(samples - 1);
        });

        it('is drawn', async () => {
            await plotLongHeatMap();

            // empty canvas is exported as 'data:,'
            const image = graphDiv.querySelector('image');
            expect(image?.getAttribute('href')?.length).toBeGreaterThan(100);
        });
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
        // Plotly reports its errors to the console, unhandled promise rejections fail the Vitest run
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            await new HeatMapPlotter(id).plotHeatMap([]);

            const plotted = (graphDiv as unknown as Plotly.PlotlyHTMLElement).data[0] as Partial<Plotly.HeatmapData>;
            expect(plotted.type).toBe('heatmap');
            expect(consoleError).not.toHaveBeenCalled();
        } finally {
            graphDiv.remove();
        }
    });
});
