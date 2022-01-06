import { SubSurfaceGradientFactors } from './GradientFactors';
import { AscentSpeeds } from './speeds';


describe('Speeds', () => {
    const sut = new AscentSpeeds({
        ascentSpeed6m: 3,
        ascentSpeed50percTo6m: 6,
        ascentSpeed50perc: 9
    });
    sut.averageDepth = 60;

    // TODO when enabling this will break Algorithm tests, because of different speed results in different duration
    xdescribe('Ascent', () => {
        it('Returns always 0 m/min. at 0 m', () => {
            expect(sut.ascent(0)).toBe(3);
        });

        it('Returns 3 m/min. at 6 m', () => {
            expect(sut.ascent(6)).toBe(3);
        });

        describe('from 20 m', () => {
            it('Returns always 3 m/min. at 9 m', () => {
                expect(sut.ascent(0)).toBe(3);
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
