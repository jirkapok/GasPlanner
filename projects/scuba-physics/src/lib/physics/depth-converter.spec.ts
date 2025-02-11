import { DepthConverter } from './depth-converter';

describe('Depth Converter', () => {
    describe('Altitude 1000 meters', () => {
        const freshWaterConverter = DepthConverter.forFreshWater(1000);

        it('surface pressure is 0.89874 bar', () => {
            const result = freshWaterConverter.surfacePressure;
            expect(result).toBeCloseTo(0.89875, 5);
        });

        it('0 m depth converts to 0.89875 bar', () => {
            const result = freshWaterConverter.toBar(0);
            expect(result).toBeCloseTo(0.89875, 5);
        });

        it('20 m depth converts to 0.99811 bar', () => {
            const result = freshWaterConverter.toBar(1.01325);
            expect(result).toBeCloseTo(0.99811, 5);
        });
    });

    describe('Fresh water', () => {
        const freshWaterConverter = DepthConverter.forFreshWater();

        it('0 m converts to 1.01325 bar', () => {
            const result = freshWaterConverter.toBar(0);
            expect(result).toBe(1.01325);
        });

        it('1.01325 bar converts to 0 m', () => {
            const result = freshWaterConverter.fromBar(1.01325);
            expect(result).toBe(0);
        });

        it('22 m converts to 3.171 bar', () => {
            const result = freshWaterConverter.toBar(22);
            expect(result).toBeCloseTo(3.171, 3);
        });

        it('3.171 bar converts to 22.3 m', () => {
            const result = freshWaterConverter.fromBar(3.171);
            expect(result).toBeCloseTo(22);
        });
    });

    describe('Salt water', () => {
        const saltWaterConverter = DepthConverter.forSaltWater();

        it('0 bars throws exception', () => {
            expect(() => saltWaterConverter.fromBar(0)).toThrow();
        });

        it('0 m converts to 1.01325 bar in salt', () => {
            const result = saltWaterConverter.toBar(0);
            expect(result).toBe(1.01325);
        });

        it('1.01325 bar converts to 0 m in salt', () => {
            const result = saltWaterConverter.fromBar(1.01325);
            expect(result).toBe(0);
        });

        it('22 m converts to 3.235 bar', () => {
            const result = saltWaterConverter.toBar(22);
            expect(result).toBeCloseTo(3.235, 3);
        });

        it('3.235 converts to 22m', () => {
            const result = saltWaterConverter.fromBar(3.235);
            expect(result).toBeCloseTo(22);
        });
    });

    describe('Simple', () => {
        const simpleConverter = DepthConverter.simple();

        it('0 bars throws simple exception', () => {
            expect(() => simpleConverter.fromBar(0)).toThrow();
        });

        it('0 m converts to 1.0 bar', () => {
            const result = simpleConverter.toBar(0);
            expect(result).toBe(1.00000);
        });

        it('1.0 bar converts to 0 m', () => {
            const result = simpleConverter.fromBar(1.00000);
            expect(result).toBe(0);
        });

        it('22 m converts to 3.200 bar', () => {
            const result = simpleConverter.toBar(22);
            expect(result).toBeCloseTo(3.200, 3);
        });

        it('3.200 converts to 22m', () => {
            const result = simpleConverter.fromBar(3.200);
            expect(result).toBeCloseTo(22);
        });
    });
});
