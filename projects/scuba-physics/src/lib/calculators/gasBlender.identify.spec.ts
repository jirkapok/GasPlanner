import { GasBlender } from './gasBlender';

describe('Gas Blender Identify mix', () => {
    it('Empty source tank results in top mix', () => {
        const result = GasBlender.identify({
            source: { o2: .31, he: .25, pressure: 0 },
            topMix: { o2: .21, he: .20 },
            finalPressure: 200
        });

        expect(result.o2).toBeCloseTo(0.21, 6);
        expect(result.he).toBeCloseTo(0.20, 6);
        expect(result.n2).toBeCloseTo(0.59, 6);
        expect(result.pressure).toBeCloseTo(200, 6);
        expect(result.addTop).toBeCloseTo(200, 6);
    });

    it('No topping results in source content', () => {
        const result = GasBlender.identify({
            source: { o2: .31, he: .25, pressure: 110 },
            topMix: { o2: .21, he: .20 },
            finalPressure: 110
        });

        expect(result.o2).toBeCloseTo(0.31, 6);
        expect(result.he).toBeCloseTo(0.25, 6);
        expect(result.pressure).toBeCloseTo(110, 6);
        expect(result.addTop).toBeCloseTo(0, 6);
    });

    it('Both empty results in empty tank', () => {
        const result = GasBlender.identify({
            source: { o2: .21, he: 0, pressure: 0 },
            topMix: { o2: .32, he: 0 },
            finalPressure: 0
        });

        expect(result).toEqual({ o2: 0, he: 0, n2: 0, pressure: 0, addTop: 0 });
    });

    it('Air topped by EAN32 is close to ideal gas formula', () => {
        const sourcePressure = 50;
        const finalPressure = 200;
        const result = GasBlender.identify({
            source: { o2: .21, he: 0, pressure: sourcePressure },
            topMix: { o2: .32, he: 0 },
            finalPressure: finalPressure
        });

        const idealO2 = (sourcePressure * .21 + (finalPressure - sourcePressure) * .32) / finalPressure;
        expect(result.o2).toBeCloseTo(idealO2, 2);
        expect(result.he).toBeCloseTo(0, 6);
        expect(result.pressure).toBeCloseTo(finalPressure, 6);
        expect(result.addTop).toBeCloseTo(150, 6);
    });

    it('Trimix result is consistent with topping the same amount', () => {
        const source = { o2: .20, he: .30, pressure: 100 };
        const topMix = { o2: .40, he: .10 };
        const topped = GasBlender.top({
            source,
            topMix: { ...topMix, pressure: 60 }
        });

        const result = GasBlender.identify({
            source,
            topMix,
            finalPressure: topped.pressure
        });

        expect(result.o2).toBeCloseTo(topped.o2, 6);
        expect(result.he).toBeCloseTo(topped.he, 6);
        expect(result.n2).toBeCloseTo(1 - topped.o2 - topped.he, 6);
        expect(result.pressure).toBeCloseTo(topped.pressure, 6);
    });

    it('Final pressure lower than source pressure throws error', () => {
        expect(() => GasBlender.identify({
            source: { o2: .21, he: 0, pressure: 100 },
            topMix: { o2: .32, he: 0 },
            finalPressure: 50
        })).toThrowError(/Final pressure/);
    });

    it('Invalid top mix throws error', () => {
        expect(() => GasBlender.identify({
            source: { o2: .21, he: 0, pressure: 100 },
            topMix: { o2: .82, he: .3 },
            finalPressure: 150
        })).toThrowError(/Top mix/);
    });
});
