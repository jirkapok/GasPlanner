import { AscentSpeeds } from './speeds';
import { Segments } from './Segments';
import { StandardGases } from '../gases/StandardGases';

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

    describe('Mark average depth', () => {
        const options = {
            ascentSpeed6m: 3,
            ascentSpeed50percTo6m: 6,
            ascentSpeed50perc: 9
        };

        it('Empty profile = 0 m', () => {
            const speeds = new AscentSpeeds(options);
            speeds.markAverageDepth(new Segments());
            expect(speeds.averageDepth).toBe(0);
        });

        it('Counts only the profile till the deepest point', () => {
            const segments = new Segments();
            segments.add(40, StandardGases.air, 120);
            segments.addFlat(StandardGases.air, 600);
            segments.add(20, StandardGases.air, 120);
            const speeds = new AscentSpeeds(options);

            speeds.markAverageDepth(segments);

            // (20 m * 120 s + 40 m * 600 s) / 720 s, the ascent isn't counted
            expect(speeds.averageDepth).toBeCloseTo(36.667, 3);
        });
    });
});
