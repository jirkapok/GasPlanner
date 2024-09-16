import { BlendPricing, BlendCosts, BlendPrice } from './blendPricing';

describe('BlendPricing', () => {
    /** we will not test negative numbers */
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
            totalPrice: 79
        };

        const result = BlendPricing.price(costs);

        expect(result).toEqual(expected);
    });
});
