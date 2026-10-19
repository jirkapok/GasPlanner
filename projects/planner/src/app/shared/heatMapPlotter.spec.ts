import { HeatMapPlotter } from "./heatMapPlotter";

describe('HeatMapPlotter', () => {
    it('creates', () => {
        const sut = new HeatMapPlotter('fakeElementId');
        expect(sut).toBeTruthy();
    });
    // I would add a .plotHeatMap test here, but it probably
    // needs some sort of Promise in order not to throw errors
});
