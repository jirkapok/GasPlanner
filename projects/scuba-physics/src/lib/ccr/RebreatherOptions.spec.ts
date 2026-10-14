import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { Options } from '../algorithm/Options';

describe('Rebreather options', () => {
    it('defaults to open circuit', () => {
        const sut = new RebreatherOptions();
        expect(sut.circuit).toBe(CircuitType.oc);
        expect(sut.metabolicO2).toBeCloseTo(1.0, 6);
        expect(sut.loopVolume).toBeCloseTo(6, 6);
    });

    it('defaults mCCR setpoint and oxygen flow', () => {
        const sut = new RebreatherOptions();
        expect(sut.setpoint).toBeCloseTo(1.3, 6);
        expect(sut.o2Flow).toBeCloseTo(0.8, 6);
    });

    it('loads mCCR values', () => {
        const sut = new RebreatherOptions();
        const source = new RebreatherOptions(CircuitType.mccr);
        source.setpoint = 1.1;
        source.o2Flow = 1.5;
        sut.loadFrom(source);
        expect(sut.setpoint).toBeCloseTo(1.1, 6);
        expect(sut.o2Flow).toBeCloseTo(1.5, 6);
    });

    it('keeps mCCR defaults when loading legacy values', () => {
        const sut = new RebreatherOptions();
        const legacy = { circuit: CircuitType.pscr, metabolicO2: 1, loopVolume: 6, injectionRatio: 8 } as RebreatherOptions;
        sut.loadFrom(legacy);
        expect(sut.setpoint).toBeCloseTo(1.3, 6);
        expect(sut.o2Flow).toBeCloseTo(0.8, 6);
    });

    it('loads all values', () => {
        const sut = new RebreatherOptions();
        const source = new RebreatherOptions(CircuitType.eccr, 1.5, 4);
        source.injectionRatio = 10;
        sut.loadFrom(source);
        expect(sut).toEqual(source);
    });

    it('options load rebreather values', () => {
        const sut = new Options();
        const source = new Options();
        source.rebreather.circuit = CircuitType.pscr;
        source.rebreather.metabolicO2 = 1.2;
        sut.loadFrom(source);
        expect(sut.rebreather.circuit).toBe(CircuitType.pscr);
        expect(sut.rebreather.metabolicO2).toBeCloseTo(1.2, 6);
    });
});
