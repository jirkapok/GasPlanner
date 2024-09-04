import { Injectable } from '@angular/core';
import {
    BlendPricing
} from 'scuba-physics';
import { GasBlenderService } from './gas-blender.service';

@Injectable()
export class BlendPricingService {
    public o2UnitPrice = 0;
    public heUnitPrice = 0;
    public topMixUnitPrice = 0;
    // calculated values/results
    public o2Price = 0;
    public hePrice = 0;
    public topMixPrice = 0;
    public totalPrice = 0;

    public constructor(private gasBlender: GasBlenderService) {
    }

    public calculate(): void {
        const costs = {
            addO2: this.gasBlender.addO2,
            addHe: this.gasBlender.addHe,
            addTop: this.gasBlender.addTop,
            o2UnitPrice: this.o2UnitPrice,
            heUnitPrice: this.heUnitPrice,
            topMixUnitPrice: this.topMixUnitPrice
        };

        const result = BlendPricing.price(costs);
        this.o2Price = result.o2Price;
        this.hePrice = result.hePrice;
        this.topMixPrice = result.topMixPrice;
        this.totalPrice = result.totalPrice;
    }
}
