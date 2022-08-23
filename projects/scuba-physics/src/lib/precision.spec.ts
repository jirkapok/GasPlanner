import { Precision } from './precision';

describe('Fix precision', () => {
    it('keeps 10 decimal places', () => {
        const expected = 2465.6546879133211;
        const result = Precision.fix(expected);
        expect(result).toEqual(2465.6546879133);
    });

    it('fixes floating point issue', () => {
        const expected = 0.1 + 0.2;
        const result = Precision.fix(expected);
        expect(result).toEqual(0.3);
    });
});
