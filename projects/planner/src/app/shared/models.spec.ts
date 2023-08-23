import { Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { TankBound } from './models';

describe('Bound tank', () => {
    it('Generates Label', () => {
        const tank = new TankBound(Tank.createDefault(), new UnitConversion());
        tank.id = 3;
        expect(tank.label).toBe('3. Air/15/200');
    });

    it('Working pressure can\'t be NaN', () => {
        const tank = new TankBound(Tank.createDefault(), new UnitConversion());
        tank.workingPressure = NaN;
        expect(tank.workingPressure).not.toBeNaN();
    });

    it('Rounds label depending on units', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const tank = new TankBound(Tank.createDefault(), units);
        expect(tank.label).toBe('0. Air/125.7/2900.8');
    });

    it('Set Working pressure keeps target size', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const tank = new TankBound(Tank.createDefault(), units);
        const expectedSize = 160;
        tank.size = expectedSize;
        tank.workingPressure = 3000;
        expect(tank.size).toBeCloseTo(expectedSize, 6);
    });
});
