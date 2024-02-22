import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';

describe('Gas blender service', () => {
    let sut: GasBlenderService;

    beforeEach(() => {
        sut = new GasBlenderService(new UnitConversion());
    });

    it('Creates', () => {
        expect(sut).toBeTruthy();
    });
});
