import { ImperialTanks, MetricTanks } from './StandardTanks';

describe('Standard tanks', () => {
    describe('Rebreather oxygen', () => {
        it('metric is 3 L cylinder', () => {
            const oxygen = new MetricTanks().rebreatherOxygen;
            expect(oxygen).toEqual({ name: '3 L', size: 3, workingPressure: 0 });
        });

        it('imperial is AL19 cylinder', () => {
            const oxygen = new ImperialTanks().rebreatherOxygen;
            expect(oxygen).toEqual({ name: 'AL19', size: 19, workingPressure: 3000 });
        });

        it('metric is available as template', () => {
            const sut = new MetricTanks();
            expect(sut.available).toContainEqual(sut.rebreatherOxygen);
        });

        it('imperial is available as template', () => {
            const sut = new ImperialTanks();
            expect(sut.available).toContainEqual(sut.rebreatherOxygen);
        });
    });
});
