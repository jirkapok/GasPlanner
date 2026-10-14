import { DensityAtDepth, GasDensity, HighestDensity } from './GasDensity';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { DepthConverter } from '../physics/depth-converter';
import { StandardGases } from './StandardGases';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';

describe('Gas Density', () => {
    describe('at 1 ATA', () => {
        const sut = new GasDensity();

        it('of Air is 1.28817', () => {
            const density = sut.forContent(.21, 0);
            expect(density).toBeCloseTo(1.28817, 5);
        });

        it('of Ean32 is 1.30764', () => {
            const density = sut.forContent(.32, 0);
            expect(density).toBeCloseTo(1.30764, 5);
        });

        it('of Oxygen is 1.428', () => {
            const density = sut.forContent(1, 0);
            expect(density).toBeCloseTo(1.428, 5);
        });

        it('of Trimix 18/45 is 0.80046', () => {
            const density = sut.forContent(.18, .45);
            expect(density).toBeCloseTo(0.80046, 5);
        });
    });

    describe('At depth', () => {
        const depthConverter = DepthConverter.simple();
        const sut = new DensityAtDepth(depthConverter, new OpenCircuitBreathing(depthConverter));

        it('Air at 30 m is 5', () => {
            const freshWater = DepthConverter.forFreshWater();
            const calc = new DensityAtDepth(freshWater, new OpenCircuitBreathing(freshWater));
            const density = calc.atDepth(StandardGases.air, 30);
            expect(density).toBeCloseTo(5.094, 3);
        });

        describe('For Profile', () => {
            it('No segments return empty density', () => {
                const density = sut.forProfile([]);
                const expected = HighestDensity.createDefault();
                expect(density).toEqual(expected);
            });

            it('Segments return density', () => {
                const profile: Segment[] = [
                    new Segment(0, 2, StandardGases.air, Time.oneMinute),
                    new Segment(2, 20, StandardGases.trimix1845, Time.oneMinute),
                    new Segment(20, 0, StandardGases.ean32, Time.oneMinute),
                ];

                const density = sut.forProfile(profile);
                expect(density.gas).toEqual(StandardGases.ean32);
                expect(density.depth).toBeCloseTo(20);
                expect(density.density).toBeCloseTo(3.923, 3);
            });
        });
    });
});
