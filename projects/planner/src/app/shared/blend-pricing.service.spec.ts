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

    it('should calculate prices correctly with default values', () => {

        sut.calculate();

        expect(sut.o2Price).toBe(0);
        expect(sut.hePrice).toBe(0);
        expect(sut.topMixPrice).toBe(0);
        expect(sut.totalPrice).toBe(sut.o2Price + sut.hePrice + sut.topMixPrice);
    });
});
