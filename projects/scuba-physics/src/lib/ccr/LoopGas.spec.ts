import { LoopGas } from './LoopGas';
import { Gas } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';

describe('Loop gas', () => {
    describe('Constant ppO2', () => {
        it('air diluent at 30 m with setpoint 1.3', () => {
            const loop = LoopGas.constantPpO2(4, StandardGases.air, 1.3);
            expect(loop.fO2).toBeCloseTo(0.325, 6);
            expect(loop.fHe).toBeCloseTo(0, 6);
        });

        it('preserves diluent helium ratio', () => {
            const diluent = new Gas(0.18, 0.45);
            const loop = LoopGas.constantPpO2(7, diluent, 1.3);
            expect(loop.fO2).toBeCloseTo(0.185714, 5);
            expect(loop.fHe).toBeCloseTo(0.446864, 5);
            expect(loop.fHe / loop.fN2).toBeCloseTo(0.45 / 0.37, 5);
        });

        it('uses diluent, when diluent ppO2 is higher than setpoint', () => {
            const diluent = new Gas(0.18, 0.45);
            const loop = LoopGas.constantPpO2(9, diluent, 1.3);
            expect(loop.fO2).toBeCloseTo(0.18, 6);
            expect(loop.fHe).toBeCloseTo(0.45, 6);
        });

        it('clamps to pure oxygen at shallow depth', () => {
            const loop = LoopGas.constantPpO2(1, StandardGases.air, 1.3);
            expect(loop.fO2).toBeCloseTo(1, 6);
            expect(loop.fHe).toBeCloseTo(0, 6);
        });

        it('never exceeds 100 % for hypoxic trimix diluent', () => {
            const diluent = new Gas(0.1, 0.7);
            expect(() => LoopGas.constantPpO2(13, diluent, 1.3)).not.toThrow();
        });

        it('never exceeds 100 % because of rounding for heliox diluent', () => {
            // without capping, the fractions sum to 1.0000000000000002 at this pressure
            const diluent = new Gas(0.12, 0.88);
            const createLoop = () => LoopGas.constantPpO2(10.579999999999819, diluent, 1.3);
            expect(createLoop).not.toThrow();
        });
    });

    describe('pSCR steady state', () => {
        it('EAN32 at 30 m', () => {
            const loop = LoopGas.pscrSteadyState(4, StandardGases.ean32, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0.244444, 5);
        });

        it('is richer deeper', () => {
            const loop = LoopGas.pscrSteadyState(7, StandardGases.ean32, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0.278788, 5);
        });

        it('hypoxic at surface', () => {
            const loop = LoopGas.pscrSteadyState(1, StandardGases.ean32, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0, 6);
        });

        it('supply equal to metabolic consumption', () => {
            const loop = LoopGas.pscrSteadyState(1, StandardGases.ean32, 8, 8, 1);
            expect(loop.fO2).toBeCloseTo(0, 6);
        });

        it('preserves supply helium ratio', () => {
            const supply = new Gas(0.35, 0.25);
            const loop = LoopGas.pscrSteadyState(4, supply, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0.277778, 5);
            expect(loop.fHe).toBeCloseTo(0.277778, 5);
        });
    });
});
