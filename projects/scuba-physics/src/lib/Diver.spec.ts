import { Diver, Tank} from './Diver';

// eslint-disable-next-line jasmine/no-focused-tests
fdescribe('Diver', () => {

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const tank = new Tank(100, 100, 20);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        tank.size = 100;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect(diver.gasSac(tank)).toBe(0.2);
    });
});


