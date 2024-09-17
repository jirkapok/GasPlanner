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

class TestGasBlenderService {
    addO2: number;
    addHe: number;
    addTop: number;

    constructor(o2: number = 0, he: number = 0, top: number = 0) {
        this.addO2 = o2;
        this.addHe = he;
        this.addTop = top;
    }
}

describe('BlendPricingService', () => {
    let sut: BlendPricingService;
    let gasBlender: TestGasBlenderService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BlendPricingService,
                { provide: GasBlenderService, useClass: TestGasBlenderService },
                UnitConversion
            ]
        });

        sut = TestBed.inject(BlendPricingService);
        gasBlender = TestBed.inject(GasBlenderService) as TestGasBlenderService;
    });

    it('should calculate prices when all unit prices and gas amounts are 0', () => {
        sut.o2UnitPrice = 0;
        sut.heUnitPrice = 0;
        sut.topMixUnitPrice = 0;

        gasBlender.addO2 = 0;
        gasBlender.addHe = 0;
        gasBlender.addTop = 0;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 0,
            hePrice: 0,
            topMixPrice: 0,
            totalPrice: 0
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when unit prices and amounts of gases are positive numbers', () => {
        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = 4;
        gasBlender.addHe = 5;
        gasBlender.addTop = 6;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 4,
            hePrice: 10,
            topMixPrice: 18,
            totalPrice: 32
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when one of unit price is 3 and all amounts of gases are 0', () => {
        sut.o2UnitPrice = 0;
        sut.heUnitPrice = 0;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = 0;
        gasBlender.addHe = 0;
        gasBlender.addTop = 0;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 0,
            hePrice: 0,
            topMixPrice: 0,
            totalPrice: 0
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when all units prices are 0 and one of amounts of gases is 4', () => {
        sut.o2UnitPrice = 0;
        sut.heUnitPrice = 0;
        sut.topMixUnitPrice = 0;

        gasBlender.addO2 = 0;
        gasBlender.addHe = 0;
        gasBlender.addTop = 4;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 0,
            hePrice: 0,
            topMixPrice: 0,
            totalPrice: 0
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when units prices are positive numbers and amounts of gases are negative numbers', () => {
        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = -5;
        gasBlender.addHe = -6;
        gasBlender.addTop = -7;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: -5,
            hePrice: -12,
            topMixPrice: -21,
            totalPrice: -38
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate totalPrice when one unit price is positive, other are negative and amounts of gases are negative numbers', () => {
        sut.o2UnitPrice = -1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = -3;

        gasBlender.addO2 = -4;
        gasBlender.addHe = -5;
        gasBlender.addTop = -6;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 4,
            hePrice: -10,
            topMixPrice: 18,
            totalPrice: 12
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when all unit prices and gas amounts are negative', () => {
        sut.o2UnitPrice = -1;
        sut.heUnitPrice = -2;
        sut.topMixUnitPrice = -3;

        gasBlender.addO2 = -4;
        gasBlender.addHe = -5;
        gasBlender.addTop = -6;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 4,
            hePrice: 10,
            topMixPrice: 18,
            totalPrice: 32
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when unit prices and gas amounts are very small values', () => {
        sut.o2UnitPrice = 0.000001;
        sut.heUnitPrice = 0.000002;
        sut.topMixUnitPrice = 0.000003;

        gasBlender.addO2 = 0.000004;
        gasBlender.addHe = 0.000005;
        gasBlender.addTop = 0.000006;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 0.000000000004,
            hePrice: 0.00000000001,
            topMixPrice: 0.000000000018,
            totalPrice: 0.000000000032
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result.o2Price).toBeCloseTo(expected.o2Price, 12);
        expect(result.hePrice).toBeCloseTo(expected.hePrice, 12);
        expect(result.topMixPrice).toBeCloseTo(expected.topMixPrice, 12);
        expect(result.totalPrice).toBeCloseTo(expected.totalPrice, 12);
    });

    it('should calculate prices when unit prices and gas amounts are very large values', () => {
        sut.o2UnitPrice = 1000000;
        sut.heUnitPrice = 2000000;
        sut.topMixUnitPrice = 3000000;

        gasBlender.addO2 = 4000000;
        gasBlender.addHe = 5000000;
        gasBlender.addTop = 6000000;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 4000000000000,
            hePrice: 10000000000000,
            topMixPrice: 18000000000000,
            totalPrice: 32000000000000
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });

    it('should calculate prices when unit prices are very small and gas amounts are very large values', () => {
        sut.o2UnitPrice = 0.000001;
        sut.heUnitPrice = 0.000002;
        sut.topMixUnitPrice = 0.000003;

        gasBlender.addO2 = 4000000;
        gasBlender.addHe = 5000000;
        gasBlender.addTop = 6000000;

        sut.calculate();

        const expected: BlendPrice = {
            o2Price: 4,
            hePrice: 10,
            topMixPrice: 18,
            totalPrice: 32
        };

        const result: BlendPrice = {
            o2Price: sut.o2Price,
            hePrice: sut.hePrice,
            topMixPrice: sut.topMixPrice,
            totalPrice: sut.totalPrice
        };

        expect(result).toEqual(expected);
    });
});
