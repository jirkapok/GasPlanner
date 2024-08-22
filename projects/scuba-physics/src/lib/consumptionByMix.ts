import { Gas } from './Gases';
import { Tank } from './Tanks';
import _ from 'lodash';

export interface IConsumedMix {
    gas: Gas;
    /**
     * Sum of all tanks start amount of gas in liters
     */
    total: number;
    /**
     * Sum of all tanks consumed amount of gas in liters
     */
    consumed: number;
    /**
     * Sum of all tanks reserve amount of gas in liters
     */
    reserve: number;
}

export class ConsumptionByMix {
    /**
     * Aggregates tanks by their gas mixture
     * @param tanks with already calculated consumption and reserve
     */
    public static combine(tanks: Tank[]): IConsumedMix[] {
        return _(tanks).groupBy(t => t.gas.contentCode)
            .map((gasTanks: Tank[]) => {
                const gasResult: IConsumedMix = {
                    gas: gasTanks[0].gas,
                    total: 0,
                    consumed: 0,
                    reserve: 0
                };

                _(gasTanks).forEach(t => {
                    gasResult.total += t.volume;
                    gasResult.consumed += t.consumedVolume;
                    gasResult.reserve += t.reserveVolume;
                });

                return gasResult;
            }).value();
    }
}
