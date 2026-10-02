import { Rebreathers } from './Rebreathers';

describe('Rebreathers', () => {
    describe('pSCR supply rate', () => {
        it('scales with ambient pressure', () => {
            expect(Rebreathers.pscrSupplyRate(4, 20, 8)).toBeCloseTo(10, 6);
        });

        it('is lower at surface', () => {
            expect(Rebreathers.pscrSupplyRate(1, 20, 8)).toBeCloseTo(2.5, 6);
        });

        it('throws for not positive injection ratio', () => {
            expect(() => Rebreathers.pscrSupplyRate(1, 20, 0)).toThrowError('Injection ratio needs to be positive number.');
        });
    });

    describe('mCCR O2 rate', () => {
        it('uses metabolic rate when needle valve flow is lower', () => {
            expect(Rebreathers.mccrO2Rate(0.8, 1.0)).toBeCloseTo(1.0, 6);
        });

        it('uses needle valve flow when higher than metabolic rate', () => {
            expect(Rebreathers.mccrO2Rate(1.5, 1.0)).toBeCloseTo(1.5, 6);
        });
    });

    describe('eCCR O2 rate', () => {
        it('adds losses to metabolic rate', () => {
            expect(Rebreathers.eccrO2Rate(1.0, 0.1)).toBeCloseTo(1.1, 6);
        });
    });

    describe('Diluent for descent', () => {
        it('fills loop volume by pressure difference', () => {
            expect(Rebreathers.diluentForDescent(6, 1, 7)).toBeCloseTo(36, 6);
        });

        it('is zero for ascent', () => {
            expect(Rebreathers.diluentForDescent(6, 7, 1)).toBeCloseTo(0, 6);
        });
    });
});
