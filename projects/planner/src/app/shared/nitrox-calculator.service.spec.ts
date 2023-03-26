import { NitroxCalculatorService } from './nitrox-calculator.service';
import { OptionsService } from './options-dispatcher.service';

describe('NitroxCalculatorService', () => {
    let service: NitroxCalculatorService;

    beforeEach(() => {
        service = new NitroxCalculatorService(new OptionsService());
    });

    describe('Maximum operational depth (MOD)', () => {
        it('pO2 1.6 with 50% fO2 has MOD 22 m (defaults)', () => {
            expect(service.mod).toBe(22);
        });

        it('pO2 1.3 with 32% fO2 has MOD 30.62 m', () => {
            service.fO2 = 32;
            service.pO2 = 1.3;
            expect(service.mod).toBe(30.62);
        });
    });

    describe('Equivalent Air depth (EAD)', () => {
        it('50% fO2 at 22 m has EAD 10.26 (defaults)', () => {
            expect(service.ead).toBe(10.23);
        });
    });

    describe('Best mix (fO2)', () => {
        it('pO2 1.6 with MOD 22 m has fO2 50%', () => {
            service.toBestMix();
            service.mod = 22;
            service.pO2 = 1.6;
            expect(service.fO2).toBe(50);
        });

        it('pO2 1.3 with MOD 30 m has fO2 32.5%', () => {
            service.toBestMix();
            service.mod = 30;
            service.pO2 = 1.3;
            expect(service.fO2).toBe(32.5);
        });
    });

    describe('Partial O2 (pO2)', () => {
        it('fO2 50% with MOD 22 m has pO2 1.6', () => {
            service.toPO2();
            service.mod = 22;
            service.fO2 = 50;
            expect(service.pO2).toBe(1.6);
        });

        it('fO2 32.5% with MOD 30 m has pO2 1.3', () => {
            service.toPO2();
            service.mod = 30;
            service.fO2 = 32.5;
            expect(service.pO2).toBe(1.3);
        });
    });
});
