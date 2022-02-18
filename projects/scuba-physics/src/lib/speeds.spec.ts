import { AscentSpeeds } from './speeds';

describe('Speeds', () => {
    const sut = new AscentSpeeds({
        ascentSpeed6m: 3,
        ascentSpeed50percTo6m: 6,
        ascentSpeed50perc: 9
    });

    beforeEach(() => {
        sut.averageDepth = 30;
    });

    describe('Ascent', () => {
        it('Returns always 3 m/min. at 0 m', () => {
            expect(sut.ascent(0)).toBe(3);
        });

        it('Returns 3 m/min. at 6 m', () => {
            expect(sut.ascent(6)).toBe(3);
        });

        describe('from 4 m average depth', () => {
            beforeEach(() => {
                sut.averageDepth = 4;
            });

            it('Returns always 3 m/min. at 2 m', () => {
                expect(sut.ascent(4)).toBe(3);
            });

            it('Returns always 3 m/min. below 6 m', () => {
                expect(sut.ascent(6)).toBe(3);
            });

            it('Returns always 9 m/min. at 7 m', () => {
                expect(sut.ascent(7)).toBe(9);
            });
        });

        describe('from 30 m average depth', () => {
            it('Returns always 3 m/min. at 6 m', () => {
                expect(sut.ascent(6)).toBe(3);
            });

            it('Returns always 6 m/min. at 15 m', () => {
                expect(sut.ascent(15)).toBe(6);
            });

            it('Returns always 9 m/min. at 60 m', () => {
                expect(sut.ascent(60)).toBe(9);
            });
        });
    });
});
