import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';
import { BlendPricingService } from './blend-pricing.service';

describe('BlendPricingService', () => {
    let sut: BlendPricingService;
    let gasBlender: GasBlenderService;

    const createGasBlenderService = (): GasBlenderService => {
        const units = new UnitConversion();
        return new GasBlenderService(units);
    };

    beforeEach(() => {
        gasBlender = createGasBlenderService();
        sut = new BlendPricingService(gasBlender);

        gasBlender.topMix.o2 = 25;
        gasBlender.topMix.he = 25;
        gasBlender.calculate();

        sut.o2UnitPrice = 2;
        sut.heUnitPrice = 3;
        sut.topMixUnitPrice = 4;
    });

    it('Calculates prices for for the amount of gas', () => {
        sut.calculate();

        expect(sut.o2Price).toBeCloseTo(50);
        expect(sut.hePrice).toBeCloseTo(75);
        expect(sut.topMixPrice).toBeCloseTo(200);
        expect(sut.totalPrice).toBeCloseTo(325);
    });
});
