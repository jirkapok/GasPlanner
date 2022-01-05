import { AscentSpeeds } from './speeds';


describe('Speeds', () => {
    const sut = new AscentSpeeds({
        ascentSpeed6m: 3,
        ascentSpeed75percTo6m: 6,
        ascentSpeed75perc: 9
    });

    describe('Ascent', () => {
        it('Returns always 0 m/min. at 0 m', () => {
            expect(sut.ascent(0, 0)).toBe(3);
        });

        it('Returns 3 m/min. at 6 m', () => {
            expect(sut.ascent(6, 6)).toBe(3);
        });

        describe('from 20 m', () => {
            const maxDepth = 60;

            it('Returns always 3 m/min. at 9 m', () => {
                expect(sut.ascent(0, maxDepth)).toBe(3);
            });

            it('Returns always 6 m/min. at 15 m', () => {
                expect(sut.ascent(15, maxDepth)).toBe(6);
            });

            it('Returns always 9 m/min. at 60 m', () => {
                expect(sut.ascent(60, maxDepth)).toBe(9);
            });
        });
    });
});
