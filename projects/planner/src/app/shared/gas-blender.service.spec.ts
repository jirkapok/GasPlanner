import { UnitConversion } from './UnitConversion';
import { BasBlenderService } from './gas-blender.service';

describe('Gas blender service', () => {
    let sut: BasBlenderService;

    beforeEach(() => {
        sut = new BasBlenderService(new UnitConversion());
    });

    it('Creates', () => {
        expect(sut).toBeTruthy();
    });
});
