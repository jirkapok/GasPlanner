import { BlendPricing, BlendCosts, BlendPrice } from './blendPricing';

describe('BlendPricing', () => {
    let costs: BlendCosts;

    beforeEach(() => {
        costs  = {
            addO2: 2,
            o2UnitPrice: 5,
            addHe: 3,
            heUnitPrice: 8,
            addTop: 4,
            topMixUnitPrice: 10
        };
    });

    it('should calculate prices according declared amount and price of gas', () => {
        const expected: BlendPrice = {
            o2Price: 10,
            hePrice: 24,
            topMixPrice: 40,
            totalPrice: 74
        };

        const result = BlendPricing.price(costs);

        expect(result).toEqual(expected);
    });

    describe('Negative value validation throws an error for', () => {
        it('addO2', () => {
            costs.addO2 = -1;

            expect(() => BlendPricing.price(costs)).toThrowError('addO2 must be positive number');
        });

        it('o2UnitPrice', () => {
            costs.o2UnitPrice = -5;

            expect(() => BlendPricing.price(costs)).toThrowError('o2UnitPrice must be positive number');
        });

        it('addHe', () => {
            costs.addHe = -3;

            expect(() => BlendPricing.price(costs)).toThrowError('addHe must be positive number');
        });

        it('heUnitPrice', () => {
            costs.heUnitPrice = -8;

            expect(() => BlendPricing.price(costs)).toThrowError('heUnitPrice must be positive number');
        });

        it('addTop', () => {
            costs.addTop = -4;

            expect(() => BlendPricing.price(costs)).toThrowError('addTop must be positive number');
        });

        it('topMixUnitPrice', () => {
            costs.topMixUnitPrice = -10;

            expect(() => BlendPricing.price(costs)).toThrowError('topMixUnitPrice must be positive number');
        });
    });
});

