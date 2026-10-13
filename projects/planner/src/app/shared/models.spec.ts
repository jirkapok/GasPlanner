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

    it('Rounds size to one decimal', () => {
        tank.size = 12.354;
        expect(tank.size).toBe(12.4);
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            units.imperialUnits = true;
            tank = new TankBound(Tank.createDefault(), units);
        });

        it('Rounds label depending on units', () => {
            expect(tank.label).toBe('0. Air/125.7/2900.8');
        });

        it('Rounds size to one decimal in cuft', () => {
            tank.size = 80.0789;
            expect(tank.size).toBeCloseTo(80.1, 10);
        });

        it('Set Working pressure keeps unrounded size', () => {
            const expectedSize = tank.size;
            tank.workingPressure = 3000;
            expect(tank.size).toBeCloseTo(expectedSize, 6);
        });

        it('Set Working pressure keeps target size', () => {
            const expectedSize = 160;
            tank.size = expectedSize;
            tank.workingPressure = 3000;
            expect(tank.size).toBeCloseTo(expectedSize, 6);
        });
    });
});
