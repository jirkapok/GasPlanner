import { MixResult } from './gasBlender';

/**
 * Configuration for prises of gases.
 * All values should be positive numbers.
 */
export interface BlendCosts {
    o2Price: number;
    hePrice: number;
    topMixPrice: number;
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
     * @param used not null blended gas mix
     * @param costs not null settings for gas prices
     */
    public static price(used: MixResult, costs: BlendCosts): BlendPrice {
        const o2Price = used.addO2 * costs.o2Price;
        const hePrice = used.addHe * costs.hePrice;
        const topMixPrice = used.addTop * costs.topMixPrice;

        return {
            o2Price: o2Price,
            hePrice: hePrice,
            topMixPrice: topMixPrice,
            totalPrice: o2Price + hePrice + topMixPrice
        };
    }
}
