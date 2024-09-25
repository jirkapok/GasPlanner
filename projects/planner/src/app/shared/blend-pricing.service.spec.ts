import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';
import { BlendPricingService } from './blend-pricing.service';

describe('BlendPricingService', () => {
    let sut: BlendPricingService;
    let gasBlender: GasBlenderService;

    const createGasBlenderService = (imperialUnits: boolean = false): GasBlenderService => {
        const units = new UnitConversion();
        units.imperialUnits = imperialUnits;
        return new GasBlenderService(units);
    };

    beforeEach(() => {
        gasBlender = createGasBlenderService();
        sut = new BlendPricingService(gasBlender);

        gasBlender.targetTank.o2 = 25;
        gasBlender.targetTank.he = 25;
        gasBlender.calculate();

        sut.o2UnitPrice = 2;
        sut.heUnitPrice = 3;
        sut.topMixUnitPrice = 4;
    });

    it('Calculates gas prices', () => {
        sut.calculate();

        expect(sut.o2Price).toBeCloseTo(5.88235294, 8);
        expect(sut.hePrice).toBeCloseTo(150);
        expect(sut.topMixPrice).toBeCloseTo(588.2352941176471, 8);
        expect(sut.totalPrice).toBeCloseTo(744.1176470576471, 8);
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            gasBlender = createGasBlenderService(true);
            sut = new BlendPricingService(gasBlender);

            gasBlender.targetTank.o2 = 25;
            gasBlender.targetTank.he = 25;
            gasBlender.calculate();

            sut.o2UnitPrice = 2;
            sut.heUnitPrice = 3;
            sut.topMixUnitPrice = 4;
        });

        it('Calculates gas prices in imperial units', () => {
            sut.calculate();

            expect(sut.o2Price).toBeCloseTo(85.31631629483086, 8);
            expect(sut.hePrice).toBeCloseTo(2175.5660659533, 8);
            expect(sut.topMixPrice).toBeCloseTo(8531.631631189413, 8);
            expect(sut.totalPrice).toBeCloseTo(10792.514013437543, 8);
        });
    });
});

