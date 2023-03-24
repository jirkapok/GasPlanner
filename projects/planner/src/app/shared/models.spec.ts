import { Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { TankBound } from './models';

describe('Bound tank', () => {
    it('Generates Label', () => {
        const tank = new TankBound(Tank.createDefault(), new UnitConversion());
        tank.id = 3;
        expect(tank.label).toBe('3. Air/15/200');
    });

    it('Rounds label depending on units', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const tank = new TankBound(Tank.createDefault(), units);
        expect(tank.label).toBe('0. Air/125.7/2900.8');
    });
});
