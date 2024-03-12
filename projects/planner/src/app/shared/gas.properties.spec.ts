import { UnitConversion } from './UnitConversion';
import { BoundGasProperties } from './gas.properties';

describe('Gas properties bound', () => {
    const units: UnitConversion = new UnitConversion();
    let sut: BoundGasProperties;

    describe('Imperial', () => {
        beforeEach(() => {
            units.imperialUnits = true;
            sut = new BoundGasProperties(units);
            sut.depth = 100;
            sut.tank.o2 = 10;
            sut.tank.he = 70;
        });

        it('MND is 404 ft', () => {
            expect(sut.mnd).toBeCloseTo(404.637, 3);
        });

        it('END is 7 ft', () => {
            expect(sut.end).toBeCloseTo(7.034, 3);
        });

        it('Minimum depth is 26 ft', () => {
            expect(sut.minDepth).toBeCloseTo(26.247, 3);
        });

        it('Maximum depth (MOD) is 426 ft', () => {
            expect(sut.maxDepth).toBeCloseTo(426.509, 3);
        });

        it('Density is 0.130 lb/cuft', () => {
            expect(sut.density).toBeCloseTo(0.130979, 6);
        });

        it('Max. density is 0.130 lb/cuft', () => {
            expect(sut.maxDensity).toBeCloseTo(0.355839, 6);
        });

        it('Depth is 100 ft', () => {
            expect(sut.depth).toBeCloseTo(100, 6);
        });

        it('Narcotic depth limit is applied', () => {
            sut.tank.o2 = 21;
            sut.tank.he = 0;
            sut.mndLimit = 133;
            units.imperialUnits = false;
            expect(sut.mnd).toBeCloseTo(40.5384, 6);
        });
    });

    describe('Metric', () => {
        beforeEach(() => {
            units.imperialUnits = false;
            sut = new BoundGasProperties(units);
            sut.depth = 30;
            sut.tank.o2 = 10;
            sut.tank.he = 70;
        });

        it('MND is 123.3 m', () => {
            expect(sut.mnd).toBeCloseTo(123.333, 3);
        });

        it('END is 2 m', () => {
            expect(sut.end).toBeCloseTo(2, 3);
        });

        it('Minimum depth is 8 m', () => {
            expect(sut.minDepth).toBeCloseTo(8, 3);
        });

        it('Maximum depth (MOD) is 130 m', () => {
            expect(sut.maxDepth).toBeCloseTo(130, 3);
        });

        it('Density is 2 g/l', () => {
            expect(sut.density).toBeCloseTo(2.0732, 6);
        });

        it('Switch O2 narcotic changes MND', () => {
            sut.switchOxygenNarcotic();
            expect(sut.mnd).toBeCloseTo(190, 3);
        });

        it('Min. PpO2 is 0.18', () => {
            expect(sut.minPpO2).toBeCloseTo(0.18, 6);
        });

        it('Max. PpO2 is applied', () => {
            sut.maxPpO2 = 1.5;
            expect(sut.maxDepth).toBeCloseTo(140, 6);
        });

        it('Narcotic depth limit is applied', () => {
            sut.tank.o2 = 21;
            sut.tank.he = 0;
            sut.mndLimit = 40;
            expect(sut.mnd).toBeCloseTo(40, 6);
        });

        it('Max. density is 5.7 g/l', () => {
            expect(sut.maxDensity).toBeCloseTo(5.7, 6);
        });
    });
});
