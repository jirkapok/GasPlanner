import { TestBed } from '@angular/core/testing';
import { BlendPricingService } from './blend-pricing.service';
import { GasBlenderService } from './gas-blender.service';
import { UnitConversion } from './UnitConversion';

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

// eslint-disable-next-line jasmine/no-focused-tests
fdescribe('BlendPricingService', () => {
    let sut: BlendPricingService;
    let gasBlender: TestGasBlenderService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BlendPricingService, { provide: GasBlenderService, useClass: TestGasBlenderService }, UnitConversion]
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

        expect(sut.o2Price).toBe(0);
        expect(sut.hePrice).toBe(0);
        expect(sut.topMixPrice).toBe(0);
        expect(sut.totalPrice).toBe(0);
    });


    it('should calculate prices when all unit prices and gas amounts are positive', () => {
        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = 4;
        gasBlender.addHe = 5;
        gasBlender.addTop = 6;

        sut.calculate();

        expect(sut.o2Price).toBe(4);
        expect(sut.hePrice).toBe(10);
        expect(sut.topMixPrice).toBe(18);
        expect(sut.totalPrice).toBe(32);
    });

    it('should calculate prices when all unit prices and gas amounts are negative numbers', () => {
        sut.o2UnitPrice = -1;
        sut.heUnitPrice = -2;
        sut.topMixUnitPrice = -3;

        gasBlender.addO2 = -4;
        gasBlender.addHe = -5;
        gasBlender.addTop = -6;

        sut.calculate();

        expect(sut.o2Price).toBe(4);
        expect(sut.hePrice).toBe(10);
        expect(sut.topMixPrice).toBe(18);
        expect(sut.totalPrice).toBe(32);
    });

    it('should calculate prices when one of unit price is 3 and all amounts of gases are 0', () => {
        sut.o2UnitPrice = 0;
        sut.heUnitPrice = 0;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = 0;
        gasBlender.addHe = 0;
        gasBlender.addTop = 0;

        sut.calculate();

        expect(sut.o2Price).toBe(0);
        expect(sut.hePrice).toBe(0);
        expect(sut.topMixPrice).toBe(0);
        expect(sut.totalPrice).toBe(0);
    });

    it('should calculate prices when all units prices are 0 and one of amounts of gasses is 4', () => {
        sut.o2UnitPrice = 0;
        sut.heUnitPrice = 0;
        sut.topMixUnitPrice = 0;

        gasBlender.addO2 = 0;
        gasBlender.addHe = 0;
        gasBlender.addTop = 4;

        sut.calculate();

        expect(sut.o2Price).toBe(0);
        expect(sut.hePrice).toBe(0);
        expect(sut.topMixPrice).toBe(0);
        expect(sut.totalPrice).toBe(0);
    });

    it('should calculate prices when units prices are positive numbers and amounts of gases are negative numbers', () => {
        sut.o2UnitPrice = 1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = 3;

        gasBlender.addO2 = -5;
        gasBlender.addHe = -6;
        gasBlender.addTop = -7;

        sut.calculate();

        expect(sut.o2Price).toBe(-5);
        expect(sut.hePrice).toBe(-12);
        expect(sut.topMixPrice).toBe(-21);
        expect(sut.totalPrice).toBe(-38);
    });

    it('should calculate totalPrice when one unit price is positive, other are negative and amounts of gases are negative numbers', () => {
        sut.o2UnitPrice = -1;
        sut.heUnitPrice = 2;
        sut.topMixUnitPrice = -3;

        gasBlender.addO2 = -4;
        gasBlender.addHe = -5;
        gasBlender.addTop = -6;

        sut.calculate();

        expect(sut.o2Price).toBe(4);
        expect(sut.hePrice).toBe(-10);
        expect(sut.topMixPrice).toBe(18);
        expect(sut.totalPrice).toBe(12);
    });

    it('should calculate prices when unit prices and gas amounts are very small values', () => {
        sut.o2UnitPrice = 0.000001;
        sut.heUnitPrice = 0.000002;
        sut.topMixUnitPrice = 0.000003;

        gasBlender.addO2 = 0.000004;
        gasBlender.addHe = 0.000005;
        gasBlender.addTop = 0.000006;

        sut.calculate();

        expect(sut.o2Price).toBeCloseTo(0.000000000004, 12);
        expect(sut.hePrice).toBeCloseTo(0.00000000001, 12);
        expect(sut.topMixPrice).toBeCloseTo(0.000000000018, 12);
        expect(sut.totalPrice).toBeCloseTo(0.000000000032, 12);
    });

    it('should calculate prices when unit prices and gas amounts are very large values', () => {
        sut.o2UnitPrice = 1000000;
        sut.heUnitPrice = 2000000;
        sut.topMixUnitPrice = 3000000;

        gasBlender.addO2 = 4000000;
        gasBlender.addHe = 5000000;
        gasBlender.addTop = 6000000;

        sut.calculate();

        expect(sut.o2Price).toBe(4000000000000);
        expect(sut.hePrice).toBe(10000000000000);
        expect(sut.topMixPrice).toBe(18000000000000);
        expect(sut.totalPrice).toBe(32000000000000);
    });

    it('should calculate prices when unit prices are very small and gas amounts are very large values', () => {
        sut.o2UnitPrice = 0.000001;
        sut.heUnitPrice = 0.000002;
        sut.topMixUnitPrice = 0.000003;

        gasBlender.addO2 = 4000000;
        gasBlender.addHe = 5000000;
        gasBlender.addTop = 6000000;

        sut.calculate();

        expect(sut.o2Price).toBe(4);
        expect(sut.hePrice).toBe(10);
        expect(sut.topMixPrice).toBe(18);
        expect(sut.totalPrice).toBe(32);
    });
});
