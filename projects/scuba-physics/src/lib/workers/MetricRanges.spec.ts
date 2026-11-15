import { MetricRanges } from './MetricRanges';

describe('MetricRanges', () => {
    const ranges = new MetricRanges();

    it('depth', () => {
        expect(ranges.depth).toEqual([0, 350]);
    });

    it('tank size', () => {
        expect(ranges.tankSize).toEqual([1, 50]);
    });

    it('rmv', () => {
        expect(ranges.diverRmv).toEqual([5, 90]);
    });

    it('labels in metric units', () => {
        expect(ranges.depthLabel).toBe('0 - 350 m');
    });
});
