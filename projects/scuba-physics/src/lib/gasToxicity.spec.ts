import { OptionExtensions } from './Options.spec';
import { GasToxicity } from './gasToxicity';
import { StandardGases } from './StandardGases';

describe('GasToxicity service', () => {
    it('MND for 12/35 returns 52 m', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6);
        const toxicity = new GasToxicity(options);
        const gas = StandardGases.trimix2135.copy();
        const result = toxicity.mndForGas(gas);
        expect(result).toBe(51.54);
    });
});
