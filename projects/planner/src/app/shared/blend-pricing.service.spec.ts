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

interface Request {
    target: {
        o2: number;
        he: number;
        topMix: number;
    };
}

function createEmptyRequest(): Request {
    return {
        target: {
            o2: 0,
            he: 0,
            topMix: 0
        }
    };
}

describe('BlendPricingService', () => {
    let sut: BlendPricingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BlendPricingService,
                GasBlenderService,
                UnitConversion
            ]
        });

        sut = TestBed.inject(BlendPricingService);
    });

    it('calculate all unit prices and gas amounts', () => {
        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        const request: Request = createEmptyRequest();

        request.target.o2 = 4;
        request.target.he = 5;
        request.target.topMix = 6;

        sut.calculate();

        const expectedPrice: BlendPrice = {
            o2Price: 4,
            hePrice: 10,
            topMixPrice: 18,
            totalPrice: 32
        };

        expect(sut.o2Price).toEqual(expectedPrice.o2Price);
        expect(sut.hePrice).toEqual(expectedPrice.hePrice);
        expect(sut.topMixPrice).toEqual(expectedPrice.topMixPrice);
        expect(sut.totalPrice).toEqual(expectedPrice.totalPrice);
    });

    it('calculate all unit prices and gas amounts in imperial units', () => {
        const unitConversion = new UnitConversion();
        unitConversion.imperialUnits = true;

        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        const request: Request = createEmptyRequest();

        request.target.o2 = 4;
        request.target.he = 5;
        request.target.topMix = 6;

        sut.calculate();

        const expectedPrice: BlendPrice = {
            o2Price: 4,
            hePrice: 10,
            topMixPrice: 18,
            totalPrice: 32
        };

        expect(sut.o2Price).toEqual(expectedPrice.o2Price);
        expect(sut.hePrice).toEqual(expectedPrice.hePrice);
        expect(sut.topMixPrice).toEqual(expectedPrice.topMixPrice);
        expect(sut.totalPrice).toEqual(expectedPrice.totalPrice);
    });
});
