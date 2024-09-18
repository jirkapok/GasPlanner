import { TestBed } from '@angular/core/testing';
import { BlendPricingService } from './blend-pricing.service';
import { GasBlenderService } from './gas-blender.service';
import { UnitConversion } from './UnitConversion';

interface BlendPrice {
    o2Price: number;
    hePrice: number;
    topMixPrice: number;
    totalPrice: number;
}

describe('BlendPricingService', () => {
    let sut: BlendPricingService;
    let gasBlender: GasBlenderService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BlendPricingService,
                GasBlenderService,
                UnitConversion
            ]
        });

        sut = TestBed.inject(BlendPricingService);
        gasBlender = TestBed.inject(GasBlenderService);
    });

    it('calculate all unit prices and gas amounts', () => {
        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = 4;
        gasBlender.addHe = 5;
        gasBlender.addTop = 6;

        sut.calculate();

        expect(<BlendPrice>sut).toEqual({
            o2Price: 4,
            hePrice: 10,
            topMixPrice: 18,
            totalPrice: 32
        });
    });
});
