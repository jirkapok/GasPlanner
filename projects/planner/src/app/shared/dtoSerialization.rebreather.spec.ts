import { CircuitType, Options, RebreatherDefaults } from 'scuba-physics';
import { DtoSerialization } from './dtoSerialization';

describe('DtoSerialization - Rebreather', () => {
    it('round trips rebreather options', () => {
        const options = new Options();
        options.rebreather.circuit = CircuitType.pscr;
        options.rebreather.injectionRatio = 12;
        options.rebreather.metabolicO2 = 1.4;
        options.rebreather.loopVolume = 5;

        const loaded = DtoSerialization.toOptions(DtoSerialization.fromOptions(options));

        expect(loaded.rebreather).toEqual(options.rebreather);
    });

    it('round trips mCCR options', () => {
        const options = new Options();
        options.rebreather.circuit = CircuitType.mccr;
        options.rebreather.setpoint = 1.1;
        options.rebreather.o2Flow = 1.2;
        options.rebreather.loopVolume = 4;

        const loaded = DtoSerialization.toOptions(DtoSerialization.fromOptions(options));

        expect(loaded.rebreather).toEqual(options.rebreather);
    });

    it('legacy rebreather options without mCCR values load mCCR defaults', () => {
        const dto = DtoSerialization.fromOptions(new Options());
        dto.rebreather = { circuit: CircuitType.pscr, metabolicO2: 1, loopVolume: 6, injectionRatio: 8 };

        const loaded = DtoSerialization.toOptions(dto);

        expect(loaded.rebreather.circuit).toBe(CircuitType.pscr);
        expect(loaded.rebreather.setpoint).toBe(RebreatherDefaults.setpoint);
        expect(loaded.rebreather.o2Flow).toBe(RebreatherDefaults.o2Flow);
    });

    it('missing rebreather options load as open circuit defaults', () => {
        const dto = DtoSerialization.fromOptions(new Options());
        delete dto.rebreather;

        const loaded = DtoSerialization.toOptions(dto);

        expect(loaded.rebreather.circuit).toBe(CircuitType.oc);
        expect(loaded.rebreather.injectionRatio).toBe(RebreatherDefaults.injectionRatio);
    });
});
