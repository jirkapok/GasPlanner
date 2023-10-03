import { UnitConversion } from './UnitConversion';
import { BoundGasProperties } from './gas.properties';

describe('Gas properties bound', () => {
    const units: UnitConversion = new UnitConversion();
    let sut: BoundGasProperties;

    describe('Imperial', () => {
        beforeEach(() => {
            units.imperialUnits = true;
            sut = new BoundGasProperties(units);
            sut.depth = 30;
            sut.tank.o2 = 10;
            sut.tank.he = 70;
        });

        it('MND is 123.3 ft', () => {
            expect(sut.mnd).toBeCloseTo(123.333, 3);
        });

        it('END is 2 ft', () => {
            expect(sut.end).toBeCloseTo(2, 3);
        });

        it('Minimum depth is 8 ft', () => {
            expect(sut.minDepth).toBeCloseTo(8, 3);
        });

        it('Maximum depth (MOD) is 130 ft', () => {
            expect(sut.maxDepth).toBeCloseTo(130, 3);
        });

        it('Density is 2 what ever', () => {
            expect(sut.density).toBeCloseTo(2.0732, 6);
        });
    });
});
