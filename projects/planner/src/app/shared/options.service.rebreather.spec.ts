import { TestBed } from '@angular/core/testing';
import { CircuitType } from 'scuba-physics';
import { OptionsService } from './options.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';

describe('Options Service - Rebreather', () => {
    let service: OptionsService;
    let units: UnitConversion;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [OptionsService, UnitConversion, ReloadDispatcher]
        });
        service = TestBed.inject(OptionsService);
        units = TestBed.inject(UnitConversion);
    });

    it('is open circuit by default', () => {
        expect(service.circuit).toBe(CircuitType.oc);
        expect(service.isRebreather).toBeFalse();
    });

    it('applies pSCR values', () => {
        service.circuit = CircuitType.pscr;
        service.injectionRatio = 10;
        service.metabolicO2 = 1.5;

        const rebreather = service.getOptions().rebreather;
        expect(service.isRebreather).toBeTrue();
        expect(rebreather.circuit).toBe(CircuitType.pscr);
        expect(rebreather.injectionRatio).toBe(10);
        expect(rebreather.metabolicO2).toBeCloseTo(1.5, 6);
    });

    it('stores metabolic O2 in liters for imperial units', () => {
        units.imperialUnits = true;
        service.metabolicO2 = 0.05;
        expect(service.getOptions().rebreather.metabolicO2).toBeCloseTo(units.toLiter(0.05), 6);
        expect(service.metabolicO2).toBeCloseTo(0.05, 6);
    });

    it('reset to simple switches to open circuit', () => {
        service.circuit = CircuitType.pscr;
        service.resetToSimple();
        expect(service.isRebreather).toBeFalse();
    });
});
