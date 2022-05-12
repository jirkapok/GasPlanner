import { NitroxCalculator } from './NitroxCalculator';
import { DepthConverter } from './depth-converter';
import { DepthLevels } from './DepthLevels';
import { SafetyStop } from './Options';

describe('NitroxCalculatorService', () => {
    const depthConverter = DepthConverter.forFreshWater();
    const options = {
        lastStopDepth: 6,
        safetyStop: SafetyStop.never
    };
    const depthLevels = new DepthLevels(depthConverter, options);
    const nitroxCalculator = new NitroxCalculator(depthLevels, depthConverter);

    describe('Maximum operational depth (MOD)', () => {
        it('pO2 1.6 with 50% fO2 has MOD 22.29 m (defaults)', () => {
            const mod = nitroxCalculator.mod(1.6, 50);
            expect(mod).toBe(22.29);
        });

        it('pO2 1.3 with 32% fO2 has MOD 31.09 m', () => {
            const mod = nitroxCalculator.mod(1.3, 32);
            expect(mod).toBe(31.09);
        });
    });

    describe('Equivalent Air depth (EAD)', () => {
        it('Air at 30 m has EAD 30 m', () => {
            const ead = nitroxCalculator.ead(20.9, 30);
            expect(ead).toBe(30);
        });

        it('EAN32 at 30 m has EAD 30 m', () => {
            const ead = nitroxCalculator.ead(32, 30);
            expect(ead).toBe(24.35); // because N2 in air 79.1%
        });

        it('50% fO2 at 22 m has EAD 10.26 (defaults)', () => {
            const ead = nitroxCalculator.ead(50, 22);
            expect(ead).toBe(10.11);
        });

        it('100% fO2 at 6 m has EAD 0m - no negative numbers', () => {
            const ead = nitroxCalculator.ead(100, 6);
            expect(ead).toBe(0);
        });
    });

    describe('Best mix (fO2)', () => {
        it('pO2 1.6 with MOD 22 m has fO2 50.46%', () => {
            const fO2 = nitroxCalculator.bestMix(1.6, 22);
            expect(fO2).toBe(50.46);
        });

        it('pO2 1.3 with MOD 30 m has fO2 32.86%', () => {
            const fO2 = nitroxCalculator.bestMix(1.3, 30);
            expect(fO2).toBe(32.86);
        });

        it('pO2 1.6 with MOD 4 m has fO2 100% - no more than 100%', () => {
            const fO2 = nitroxCalculator.bestMix(1.6, 4);
            expect(fO2).toBe(100);
        });
    });

    describe('Partial O2 (pO2)', () => {
        it('fO2 50% with MOD 22.29 m has pO2 1.6', () => {
            const pO2 = nitroxCalculator.partialPressure(50, 22.29);
            expect(pO2).toBe(1.6);
        });

        it('fO2 32.68% with MOD 30 m has pO2 1.3', () => {
            const pO2 = nitroxCalculator.partialPressure(32.86, 30);
            expect(pO2).toBe(1.3);
        });
    });
});
