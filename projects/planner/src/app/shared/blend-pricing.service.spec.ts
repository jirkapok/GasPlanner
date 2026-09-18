import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';
import { BlendPricingService } from './blend-pricing.service';

describe('BlendPricingService', () => {
    const units = new UnitConversion();
    const gasBlender = new GasBlenderService(units);
    const sut = new BlendPricingService(gasBlender);

    beforeEach(() => {
        units.imperialUnits = false;
        gasBlender.targetTank.o2 = 25;
        gasBlender.targetTank.he = 25;
        gasBlender.calculate();

        sut.o2UnitPrice = 2;
        sut.heUnitPrice = 3;
        sut.topMixUnitPrice = 4;
    });

    // Prices are derived from GasBlender.mix(), which uses real-gas (compressibility) math, so the
    // expected amounts below reflect that instead of ideal-gas-law arithmetic.
    it('Calculates gas prices', () => {
        sut.calculate();

        expect(sut.o2Price).toBeCloseTo(5.612974819672118, 5);
        expect(sut.hePrice).toBeCloseTo(147.38736772700753, 5);
        expect(sut.topMixPrice).toBeCloseTo(592.257560057979, 5);
        expect(sut.totalPrice).toBeCloseTo(745.2579026046587, 5);
    });

    it('Calculates gas prices in Imperial units', () => {
        units.imperialUnits = true;
        sut.calculate();

        expect(sut.o2Price).toBeCloseTo(81.40931697819336, 5);
        expect(sut.hePrice).toBeCloseTo(2137.6730385137207, 5);
        expect(sut.topMixPrice).toBeCloseTo(8589.96966644292, 5);
        expect(sut.totalPrice).toBeCloseTo(10809.052021934833, 5);
    });
});

