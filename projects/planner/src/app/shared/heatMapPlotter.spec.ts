import { HeatMapOverPressures, HeatMapPlotter } from "./heatMapPlotter";

describe('HeatMapPlotter', () => {
    it('creates', () => {
        const sut = new HeatMapPlotter('fake-element-id');
        expect(sut).toBeTruthy();
    });

    it('plots the heat map', () => {
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
            new HeatMapPlotter(id).plotHeatMap(input);

            expect((graphDiv as any).data[0].type).toBe('heatmap');
            expect((graphDiv as any).data[0].z).toEqual(expectedZ);
            expect(graphDiv.querySelector('svg.main-svg')).not.toBeNull();
        } finally {
            // Causes error when uncommented
            //Plotly.purge(graphDiv);
            graphDiv.remove();
        }
    });
});
