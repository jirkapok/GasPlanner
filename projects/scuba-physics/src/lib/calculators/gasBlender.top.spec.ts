import { GasBlender } from './gasBlender';

describe('Gas Blender Topping', () => {
    it('Empty tanks topping adds nothing', () => {
        const result = GasBlender.top({
            source: { o2: 0.31, he: 0.25, pressure: 0 },
            topMix: { o2: 0.21, he: 0.2, pressure: 0 }
        });

        expect(result).toEqual({
            o2: 0,
            he: 0,
            pressure: 0
        });
    });

    it('Source empty tank topping adds topping content only', () => {
        const result = GasBlender.top({
            source: { o2: 0.31, he: 0.25, pressure: 0 },
            topMix: { o2: 0.21, he: 0.2, pressure: 120 }
        });

        expect(result.o2).toBeCloseTo(0.21, 6);
        expect(result.he).toBeCloseTo(0.2, 6);
        expect(result.pressure).toBeCloseTo(120, 6);
    });

    it('No topping tank topping adds source content only', () => {
        const result = GasBlender.top({
            source: { o2: 0.31, he: 0.25, pressure: 110 },
            topMix: { o2: 0.21, he: 0.2, pressure: 0 }
        });

        expect(result.o2).toBeCloseTo(0.31, 6);
        expect(result.he).toBeCloseTo(0.25, 6);
        expect(result.pressure).toBeCloseTo(110, 6);
    });

    it('Both tanks adds mix of both', () => {
        const result = GasBlender.top({
            source: { o2: 0.2, he: 0.3, pressure: 100 },
            topMix: { o2: 0.4, he: 0.1, pressure: 60 }
        });

        expect(result.o2).toBeCloseTo(0.275927, 6);
        expect(result.he).toBeCloseTo(0.224073, 6);
        expect(result.pressure).toBeCloseTo(163.214842, 6);
    });
});
