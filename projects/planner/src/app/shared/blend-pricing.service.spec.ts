import { TestBed } from '@angular/core/testing';
import { BlendPricingService } from './blend-pricing.service';
import { GasBlenderService } from './gas-blender.service';
import { UnitConversion } from './UnitConversion';

describe('BlendPricingService', () => {
    let sut: BlendPricingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BlendPricingService, GasBlenderService, UnitConversion]
        });

        sut = TestBed.inject(BlendPricingService);
    });

    it('should calculate prices based on unit price and amount of gases', () => {

        sut.calculate();

        expect(sut.o2Price).toBe(0);
        expect(sut.hePrice).toBe(0);
        expect(sut.topMixPrice).toBe(0);
        expect(sut.totalPrice).toBe(0);
    });
});
