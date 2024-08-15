import { Diver } from 'scuba-physics';

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
    });
});

