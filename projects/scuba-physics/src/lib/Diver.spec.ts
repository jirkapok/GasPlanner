import { Diver} from 'scuba-physics';
import {Tank} from 'scuba-physics';

describe('Diver', () => {

    it('Diver.rmv', () => {
        const diver = new Diver(20, 25);
        expect(diver.rmv).toBe(20);
    });

    it('Diver.stressRmv', () => {
        const diver = new Diver(20, 30);
        expect(diver.stressRmv).toBe(30);
    });

    it('should correctly calculate gas SAC based on tank size', () => {
        const diver = new Diver (20, 30);
        const tank = new Tank(100, 100, 20);
        tank.size = 100;
        expect(diver.gasSac(tank)).toBe(0.2);
    });
});


