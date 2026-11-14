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
        expect(service.isRebreather).toBe(false);
    });

    it('applies pSCR values', () => {
        service.circuit = CircuitType.pscr;
        service.injectionRatio = 10;
        service.metabolicO2 = 1.5;

        const rebreather = service.getOptions().rebreather;
        expect(service.isRebreather).toBe(true);
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

    it('applies mCCR values', () => {
        service.circuit = CircuitType.mccr;
        service.setpoint = 1.2;
        service.o2Flow = 1.1;
        service.loopVolume = 5;

        const rebreather = service.getOptions().rebreather;
        expect(service.isMccr).toBe(true);
        expect(service.isPscr).toBe(false);
        expect(rebreather.setpoint).toBeCloseTo(1.2, 6);
        expect(rebreather.o2Flow).toBeCloseTo(1.1, 6);
        expect(rebreather.loopVolume).toBeCloseTo(5, 6);
    });

    it('identifies pSCR', () => {
        service.circuit = CircuitType.pscr;
        expect(service.isPscr).toBe(true);
        expect(service.isMccr).toBe(false);
    });

    it('stores mCCR volumes in liters for imperial units', () => {
        units.imperialUnits = true;
        service.o2Flow = 0.04;
        service.loopVolume = 0.2;
        const rebreather = service.getOptions().rebreather;
        expect(rebreather.o2Flow).toBeCloseTo(units.toLiter(0.04), 6);
        expect(rebreather.loopVolume).toBeCloseTo(units.toLiter(0.2), 6);
        expect(service.o2Flow).toBeCloseTo(0.04, 6);
        expect(service.loopVolume).toBeCloseTo(0.2, 6);
    });

    it('applies eCCR values', () => {
        service.circuit = CircuitType.eccr;
        service.descentSetpoint = 0.6;
        service.bottomSetpoint = 1.2;
        service.decoSetpoint = 1.4;
        service.setpointSwitchDepth = 15;

        const rebreather = service.getOptions().rebreather;
        expect(rebreather.descentSetpoint).toBeCloseTo(0.6, 6);
        expect(rebreather.bottomSetpoint).toBeCloseTo(1.2, 6);
        expect(rebreather.decoSetpoint).toBeCloseTo(1.4, 6);
        expect(rebreather.setpointSwitchDepth).toBeCloseTo(15, 6);
    });

    it('identifies circuit types', () => {
        const expectCircuit = (circuit: CircuitType, isEccr: boolean, isClosedCircuit: boolean) => {
            service.circuit = circuit;
            expect(service.isEccr).toBe(isEccr);
            expect(service.isClosedCircuit).toBe(isClosedCircuit);
        };

        expectCircuit(CircuitType.oc, false, false);
        expectCircuit(CircuitType.pscr, false, false);
        expectCircuit(CircuitType.mccr, false, true);
        expectCircuit(CircuitType.eccr, true, true);
    });

    it('stores eCCR switch depth in meters for imperial units', () => {
        units.imperialUnits = true;
        service.setpointSwitchDepth = 66;
        expect(service.getOptions().rebreather.setpointSwitchDepth).toBeCloseTo(units.toMeters(66), 6);
        expect(service.setpointSwitchDepth).toBeCloseTo(66, 6);
    });

    it('eCCR setpoints aren\'t converted for imperial units', () => {
        units.imperialUnits = true;
        service.descentSetpoint = 0.6;
        service.bottomSetpoint = 1.2;
        service.decoSetpoint = 1.4;
        expect(service.descentSetpoint).toBeCloseTo(0.6, 6);
        expect(service.bottomSetpoint).toBeCloseTo(1.2, 6);
        expect(service.decoSetpoint).toBeCloseTo(1.4, 6);
    });

    it('setpoint isn\'t converted for imperial units', () => {
        units.imperialUnits = true;
        service.setpoint = 1.1;
        expect(service.getOptions().rebreather.setpoint).toBeCloseTo(1.1, 6);
        expect(service.setpoint).toBeCloseTo(1.1, 6);
    });

    it('reset to simple switches mCCR to open circuit', () => {
        service.circuit = CircuitType.mccr;
        service.resetToSimple();
        expect(service.isRebreather).toBe(false);
    });

    it('reset to simple switches to open circuit', () => {
        service.circuit = CircuitType.pscr;
        service.resetToSimple();
        expect(service.isRebreather).toBe(false);
    });
});
