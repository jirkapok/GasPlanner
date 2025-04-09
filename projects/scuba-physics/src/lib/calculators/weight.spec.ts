import { Tank } from '../consumption/Tanks';
import { AirWeight } from './weight';

describe('Air weight', () => {
    it('0 liters consumed returns 0 kg', () => {
        const weight = AirWeight.volumeWeight(0);
        expect(weight).toBeCloseTo(0);
    });

    it('1500 L volume returns 1.8 kg', () => {
        const weight = AirWeight.volumeWeight(1500);
        expect(weight).toBeCloseTo(1.8375, 4);
    });

    it('150 b consumed from 10L tank returns 1.8 kg', () => {
        const tank = new Tank(10, 150, 20);
        tank.consumed  = 150;
        const weight = AirWeight.tankVolumeWeight(tank);
        expect(weight).toBeCloseTo(1.8162, 4);
    });
});
