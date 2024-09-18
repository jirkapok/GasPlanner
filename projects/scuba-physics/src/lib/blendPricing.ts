/**
 * Configuration for prises of gases.
 * All values should be positive numbers.
 * Amount of gas to add unit does not matter, because the price is per its unit.
 * If addO2 is in bars, then o2Price is amount of money per bar.
 * E.g. addO2 = 3 bar, and o2Price is in Euro per bar, then result will be in Euro.
 */
export interface BlendCosts {
    addO2: number;
    o2UnitPrice: number;
    addHe: number;
    heUnitPrice: number;
    addTop: number;
    topMixUnitPrice: number;
}

/**
 * Calculated prices for blended gas mix.
 * total price is sum of all prices.
 */
export interface BlendPrice {
    o2Price: number;
    hePrice: number;
    topMixPrice: number;
    totalPrice: number;
}

export class BlendPricing {
    /**
     * Calculates price for blended gas mix.
     * @param costs not null settings for gas prices and amounts to add.
     */
    public static price(costs: BlendCosts): BlendPrice {
        BlendPricing.validateCosts(costs);
        const o2Price = costs.addO2 * costs.o2UnitPrice;
        const hePrice = costs.addHe * costs.heUnitPrice;
        const topMixPrice = costs.addTop * costs.topMixUnitPrice;

        return {
            o2Price: o2Price,
            hePrice: hePrice,
            topMixPrice: topMixPrice,
            totalPrice: o2Price + hePrice + topMixPrice
        };
    }

    private static validateCosts(costs: BlendCosts) {
        if (costs.addO2 < 0) {
            throw new Error('addO2 must be positive number');
        }
        if (costs.o2UnitPrice < 0) {
            throw new Error('o2UnitPrice must be positive number');
        }
        if (costs.addHe < 0) {
            throw new Error('addHe must be positive number');
        }
        if (costs.heUnitPrice < 0) {
            throw new Error('heUnitPrice must be positive number');
        }
        if (costs.addTop < 0) {
            throw new Error('addTop must be positive number');
        }
        if (costs.topMixUnitPrice < 0) {
            throw new Error('topMixUnitPrice must be positive number');
        }
    }
}
