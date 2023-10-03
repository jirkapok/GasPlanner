import { Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { TankBound } from './models';

describe('Bound tank', () => {
    const units: UnitConversion = new UnitConversion();
    let tank: TankBound;

    beforeEach(() => {
        units.imperialUnits = false;
        tank = new TankBound(Tank.createDefault(), units);
    });

    it('Generates Label', () => {
        tank.id = 3;
        expect(tank.label).toBe('3. Air/15/200');
    });

    it('Working pressure can\'t be NaN', () => {
        tank.workingPressure = NaN;
        expect(tank.workingPressure).not.toBeNaN();
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            units.imperialUnits = true;
            tank = new TankBound(Tank.createDefault(), units);
        });

        it('Rounds label depending on units', () => {
            expect(tank.label).toBe('0. Air/125.7/2900.8');
        });

        it('Set Working pressure keeps target size', () => {
            const expectedSize = 160;
            tank.size = expectedSize;
            tank.workingPressure = 3000;
            expect(tank.size).toBeCloseTo(expectedSize, 6);
        });
    });

    describe('N2 content', () => {
        it('N2 fills rest of the content for pinned O2', () => {
            expect(tank.n2).toBeCloseTo(79, 3);
        });

        it('N2 fills rest of the content', () => {
            tank.o2 = 10;
            tank.he = 70;
            expect(tank.n2).toBeCloseTo(20, 3);
        });
    });
});
