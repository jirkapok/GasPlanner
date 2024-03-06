import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';

describe('Gas blender service', () => {
    let sut: GasBlenderService;

    beforeEach(() => {
        sut = new GasBlenderService(new UnitConversion());
    });

    // TODO test cases:
    // - all result fields
    // - add exception handling in case we are unable to create target mix.
    // - imperial values: source pressure, target pressure, results, AddO2, AddHe, AddTop
    // - imperial values: shows removeFrom source
    it('Creates', () => {
        expect(sut).toBeTruthy();
    });
});
