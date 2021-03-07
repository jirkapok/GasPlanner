import { DepthConverter } from './depth-converter';
import { SacCalculator } from './SacCalculator';

describe('Sac Calculator', () => {
    const sut = new SacCalculator(DepthConverter.forFreshWater());

    describe('Sac calculations', () => {
        it('15m for 45 min with 15L tank (defaults) has sac 20.13 L/min.', () => {
            const result = sut.calculateSac(15, 15, 150, 45);
            expect(result).toBe(20.13);
        });

        it('15m for 60 min with 15L tank has sac 15.1 L/min.', () => {
            const result = sut.calculateSac(15, 15, 150, 60);
            expect(result).toBe(15.1);
        });

        it('at 0 m calculates 49.35 L/min.', () => {
            const result = sut.calculateSac(0, 15, 150, 45);
            expect(result).toBe(49.35);
        });

        it('0 bar consumed has SAC 0 L/min.', () => {
            const result = sut.calculateSac(15, 15, 0, 45);
            expect(result).toBe(0);
        });

        it('0 L large tank has SAC 0 L/min.', () => {
            const result = sut.calculateSac(15, 0, 150, 45);
            expect(result).toBe(0);
        });

        it('for 0 min has infinite SAC', () => {
            const result = sut.calculateSac(15, 15, 150, 0);
            expect(result).toBe(Infinity);
        });
    });

    describe('Duration calculations', () => {
        it('15m with 15L tank (defaults) with sac 20.24 L/min. holds 45 minutes.', () => {
            const result = sut.calculateDuration(15, 15, 150, 20.24);
            expect(result).toBe(45);
        });
    });

    describe('Used bars calculations', () => {
        it('15m for 45 min with 15L tank (defaults) with sac 20.24 L/min. consumes 151 bar.', () => {
            const result = sut.calculateUsed(15, 15, 45, 20.24);
            expect(result).toBe(151);
        });
    });
});
