import { ConsumptionByMix, IConsumedMix } from './consumptionByMix';
import { Tank } from './Tanks';
import _ from 'lodash';

describe('ConsumedByMix', () => {
    it('No tanks returns empty collection', () => {
        const result = ConsumptionByMix.combine([]);
        expect(result.length).toEqual(0);
    });

    describe('Aggregates by gas', () => {
        const firstAir = Tank.createDefault();
        firstAir.size = 10;
        firstAir.startPressure = 160;
        firstAir.reserve = 120;
        firstAir.consumed = 70;
        const secondAir = Tank.createDefault();
        secondAir.startPressure = 100;
        secondAir.reserve = 100;
        secondAir.consumed = 50;
        const firstEan = Tank.createDefault();
        firstEan.reserve = 50;
        firstEan.consumed = 90;

        firstEan.assignStandardGas('Ean32');
        const sourceTanks = [ firstAir, secondAir, firstEan ];
        const result = ConsumptionByMix.combine(sourceTanks);

        const assertResult = (mapFn: (s: IConsumedMix) => number, expected: number[]): void => {
            const mapped = _(result).map(mapFn).value();
            expect(mapped).toEqual(expected);
        };

        it('Groups by Gas', () => {
            const expected = [20900000, 32000000];
            assertResult(r => r.gas.contentCode, expected);
        });

        it('Sums total volume', () => {
            const expected = [3100, 3000];
            assertResult(r => r.total, expected);
        });

        it('Sums consumed volume', () => {
            const expected = [1450, 1350];
            assertResult(r => r.consumed, expected);
        });

        it('Sums reserve volume', () => {
            const expected = [2700, 750];
            assertResult(r => r.reserve, expected);
        });
    });
});
