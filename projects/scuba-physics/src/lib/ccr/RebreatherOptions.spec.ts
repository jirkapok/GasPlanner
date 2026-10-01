import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { Options } from '../algorithm/Options';

describe('Rebreather options', () => {
    it('defaults to open circuit', () => {
        const sut = new RebreatherOptions();
        expect(sut.circuit).toBe(CircuitType.OC);
        expect(sut.metabolicO2).toBeCloseTo(1.0, 6);
        expect(sut.loopVolume).toBeCloseTo(6, 6);
    });

    it('loads all values', () => {
        const sut = new RebreatherOptions();
        const source = new RebreatherOptions(CircuitType.ECCR, 1.5, 4);
        sut.loadFrom(source);
        expect(sut).toEqual(source);
    });

    it('options load rebreather values', () => {
        const sut = new Options();
        const source = new Options();
        source.rebreather.circuit = CircuitType.PSCR;
        source.rebreather.metabolicO2 = 1.2;
        sut.loadFrom(source);
        expect(sut.rebreather.circuit).toBe(CircuitType.PSCR);
        expect(sut.rebreather.metabolicO2).toBeCloseTo(1.2, 6);
    });
});
