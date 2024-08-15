import { Diver} from 'scuba-physics';
import {Tank} from 'scuba-physics';

describe('Diver', () => {
    // eslint-disable-next-line jasmine/no-focused-tests
    fit('Constructor', () => {
        const diver = new Diver(20, 25);
        expect(diver.rmv).toBe(20);
    });

    describe('Diver StressRmv', () => {
        // eslint-disable-next-line jasmine/no-focused-tests
        fit('Constructor', () => {
            const diver = new Diver(20, 30);
            expect(diver.stressRmv).toBe(30);
        });

        // eslint-disable-next-line jasmine/no-suite-dupes
        describe('Diver', () => {
            // eslint-disable-next-line jasmine/no-focused-tests
            fit('should correctly calculate gas SAC based on tank size', () => {
                const diver = new Diver (20, 30);
                const tank = new Tank(100, 100, 20);
                tank.size = 100;
                expect(diver.gasSac(tank)).toBe(0.2);
            });
        });
    });
});
