import { BlendPricing, BlendCosts, BlendPrice } from './blendPricing';

describe('BlendPricing', () => {

    it('should calculate prices according declared amount and price of gas', () => {

        const costs: BlendCosts = {
            addO2: 2,
            o2UnitPrice: 5,
            addHe: 3,
            heUnitPrice: 8,
            addTop: 4,
            topMixUnitPrice: 10
        };

        const expected: BlendPrice = {
            o2Price: 10,
            hePrice: 24,
            topMixPrice: 40,
            totalPrice: 74
        };

        const result = BlendPricing.price(costs);

        expect(result).toEqual(expected);
    });

    describe('Negative costs validation', () => {
        it('should throw an error for negative addO2', () => {
            const negativeCosts: BlendCosts = {
                addO2: -1,
                o2UnitPrice: 5,
                addHe: 3,
                heUnitPrice: 8,
                addTop: 4,
                topMixUnitPrice: 10
            };

            expect(() => BlendPricing.price(negativeCosts)).toThrowError('addO2 must be positive number');
        });

        it('should throw an error for negative o2UnitPrice', () => {
            const negativeCosts: BlendCosts = {
                addO2: 2,
                o2UnitPrice: -5,
                addHe: 3,
                heUnitPrice: 8,
                addTop: 4,
                topMixUnitPrice: 10
            };

            expect(() => BlendPricing.price(negativeCosts)).toThrowError('o2UnitPrice must be positive number');
        });

        it('should throw an error for negative addHe', () => {
            const negativeCosts: BlendCosts = {
                addO2: 2,
                o2UnitPrice: 5,
                addHe: -3,
                heUnitPrice: 8,
                addTop: 4,
                topMixUnitPrice: 10
            };

            expect(() => BlendPricing.price(negativeCosts)).toThrowError('addHe must be positive number');
        });

        it('should throw an error for negative heUnitPrice', () => {
            const negativeCosts: BlendCosts = {
                addO2: 2,
                o2UnitPrice: 5,
                addHe: 3,
                heUnitPrice: -8,
                addTop: 4,
                topMixUnitPrice: 10
            };

            expect(() => BlendPricing.price(negativeCosts)).toThrowError('heUnitPrice must be positive number');
        });

        it('should throw an error for negative addTop', () => {
            const negativeCosts: BlendCosts = {
                addO2: 2,
                o2UnitPrice: 5,
                addHe: 3,
                heUnitPrice: 8,
                addTop: -4,
                topMixUnitPrice: 10
            };

            expect(() => BlendPricing.price(negativeCosts)).toThrowError('addTop must be positive number');
        });

        it('should throw an error for negative topMixUnitPrice', () => {
            const negativeCosts: BlendCosts = {
                addO2: 2,
                o2UnitPrice: 5,
                addHe: 3,
                heUnitPrice: 8,
                addTop: 4,
                topMixUnitPrice: -10
            };

            expect(() => BlendPricing.price(negativeCosts)).toThrowError('topMixUnitPrice must be positive number');
        });
    });
});

