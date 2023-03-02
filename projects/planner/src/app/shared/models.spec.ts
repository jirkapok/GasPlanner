import { Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { TankBound } from './models';

describe('Bound tank', () => {
    it('Generates Label', () => {
        const tank = new TankBound(Tank.createDefault(), new UnitConversion());
        tank.id = 3;
        expect(tank.label).toBe('3. Air/15/200');
    });
});
