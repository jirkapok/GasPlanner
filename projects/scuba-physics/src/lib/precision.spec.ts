import { Precision } from './precision';

describe('Precision', () => {
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

    describe('Fix based on decimal rounding', () => {
        describe('Round', () => {
            it('Rounds down to two places', () => {
                const expected = 2465.6546879133211;
                const result = Precision.round(expected, 2);
                expect(result).toEqual(2465.65);
            });

            it('Rounds up', () => {
                const expected = 2465.6546879133211;
                const result = Precision.round(expected, 6);
                expect(result).toEqual(2465.654688);
            });

            it('Rounds to 0 decimals', () => {
                const expected = 6543213.024964;
                const result = Precision.round(expected, 0);
                expect(result).toEqual(6543213);
            });
        });

        describe('Floor 2 decimals', () => {
            it('Calculates floor for 2 places', () => {
                const expected = 2465.6546879133211;
                const result = Precision.floorTwoDecimals(expected);
                expect(result).toEqual(2465.65);
            });
        });

        describe('Ceil two decimals', () => {
            it('Calculates ceiling for 2 places', () => {
                const expected = 2465.6546879133211;
                const result = Precision.ceilTwoDecimals(expected);
                expect(result).toEqual(2465.66);
            });
        });
    });

    describe('Fix based on distance', () => {
        it('Ceil 0 returns 0', () => {
            const result = Precision.ceilDistance(0, 3);
            expect(result).toEqual(0);
        });

        it('Ceil 15 returns 15', () => {
            const result = Precision.ceilDistance(15, 3);
            expect(result).toEqual(15);
        });

        it('Ceil 14 returns 15', () => {
            const result = Precision.ceilDistance(14, 3);
            expect(result).toEqual(15);
        });

        it('Floor 14 returns 12', () => {
            const result = Precision.floorDistance(14, 3);
            expect(result).toEqual(12);
        });
    });
});
