import { LinearFunction } from './linearFunction';

describe('Linear Functions', () => {
    describe('Speed', () => {
        it('Positive', () => {
            const result = LinearFunction.speed({ start: 20, end: 70 }, { start: 50, end: 150 });
            expect(result).toBe(2);
        });

        it('Negative', () => {
            const result = LinearFunction.speed({ start: 20, end: 70 }, { start: 150, end: 50 });
            expect(result).toBe(-2);
        });

        it('Zero', () => {
            const result = LinearFunction.speed({ start: 20, end: 70 }, { start: 150, end: 150 });
            expect(result).toBe(0);
        });

        it('Infinite', () => {
            const result = LinearFunction.speed({ start: 0, end: 0 }, { start: 50, end: 150 });
            expect(result).toBe(Infinity);
        });
    });

    describe('Speed By X Change', () => {
        it('Positive', () => {
            const result = LinearFunction.speedByXChange(20, 70, 100);
            expect(result).toBe(0.5);
        });

        it('Negative', () => {
            const result = LinearFunction.speedByXChange(70, 20, 100);
            expect(result).toBe(-0.5);
        });

        it('Zero change', () => {
            const result = LinearFunction.speedByXChange(0, 0, 100);
            expect(result).toBe(0);
        });

        it('Infinite change', () => {
            const result = LinearFunction.speedByXChange(0, 50, 0);
            expect(result).toBe(Infinity);
        });
    });

    describe('Y value at', () => {
        it('Positive', () => {
            const result = LinearFunction.yValueAt(20, 4, 6);
            expect(result).toBe(44);
        });

        it('Positive from Zero', () => {
            const result = LinearFunction.yValueAt(0, 4, 6);
            expect(result).toBe(24);
        });

        it('Negative', () => {
            const result = LinearFunction.yValueAt(0, -4, 6);
            expect(result).toBe(-24);
        });

        it('X Zero Change', () => {
            const result = LinearFunction.yValueAt(5, 4, 0);
            expect(result).toBe(5);
        });
    });

    describe('X value at Relative', () => {
        it('Positive Y', () => {
            const result = LinearFunction.xValueAt(20, 4, 40);
            expect(result).toBe(5);
        });

        it('Zero speed', () => {
            const result = LinearFunction.xValueAt(20, 0, 40);
            expect(result).toBe(0);
        });

        it('Negative values', () => {
            const result = LinearFunction.xValueAt(20, 4, -40);
            expect(result).toBe(-15);
        });
    });

    describe('X value at Absolute', () => {
        it('Positive Y', () => {
            const result = LinearFunction.xValueAtAbsolute({start: 5, end: 10}, {start: 10, end: 20}, 40);
            expect(result).toBe(20);
        });

        it('Zero speed', () => {
            const result = LinearFunction.xValueAtAbsolute({start: 5, end: 10}, {start: 30, end: 30}, 30);
            expect(result).toBe(5);
        });

        it('Negative values', () => {
            const result = LinearFunction.xValueAtAbsolute({start: 5, end: 10}, {start: 15, end: 30}, -9);
            expect(result).toBe(-3);
        });
    });
});
