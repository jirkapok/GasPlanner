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

    it('missing rebreather options load as open circuit defaults', () => {
        const dto = DtoSerialization.fromOptions(new Options());
        delete dto.rebreather;

        const loaded = DtoSerialization.toOptions(dto);

        expect(loaded.rebreather.circuit).toBe(CircuitType.oc);
        expect(loaded.rebreather.injectionRatio).toBe(RebreatherDefaults.injectionRatio);
    });
});
