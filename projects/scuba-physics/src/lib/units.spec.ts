import { ImperialUnits, MetricUnits } from './units';

// only "pro forma", we know the results
describe('Metric units', () => {
    const units = new MetricUnits();

    describe('Metric - Meters', () => {
        it('To/from meters is precise enough', () => {
            let result = units.toMeters(1);
            result = units.fromMeters(result);
            expect(result).toBe(1);
        });

        it('0 To meters is 0', () => {
            const result = units.toMeters(0);
            expect(result).toBe(0);
        });

        it('0 From meters is 0', () => {
            const result = units.fromMeters(0);
            expect(result).toBe(0);
        });

        it('1 To meters is 1', () => {
            const result = units.toMeters(1);
            expect(result).toBe(1);
        });

        it('1 From meters is 1', () => {
            const result = units.fromMeters(1);
            expect(result).toBe(1);
        });
    });

    describe('Metric - Bars', () => {
        it('To/from bars is precise enough', () => {
            let result = units.toBar(1);
            result = units.fromBar(result);
            expect(result).toBe(1);
        });

        it('0 To bars is 0', () => {
            const result = units.toBar(0);
            expect(result).toBe(0);
        });

        it('0 From bars is 0', () => {
            const result = units.fromBar(0);
            expect(result).toBe(0);
        });

        it('1 To bars is 1', () => {
            const result = units.toBar(1);
            expect(result).toBe(1);
        });

        it('1 From bars is 1', () => {
            const result = units.fromBar(1);
            expect(result).toBe(1);
        });
    });

    describe('Metric - Liters', () => {
        it('To/from liters is precise enough', () => {
            let result = units.toLiter(1);
            result = units.fromLiter(result);
            expect(result).toBe(1);
        });

        it('0 To liters is 0', () => {
            const result = units.toLiter(0);
            expect(result).toBe(0);
        });

        it('0 From liters is 0', () => {
            const result = units.fromLiter(0);
            expect(result).toBe(0);
        });

        it('1 To liters is 1', () => {
            const result = units.toLiter(1);
            expect(result).toBe(1);
        });

        it('1 From liters is 1', () => {
            const result = units.fromLiter(1);
            expect(result).toBe(1);
        });
    });
});

describe('Imperial units', () => {
    const units = new ImperialUnits();

    describe('Imperial - feet', () => {
        it('Feet to/from meters is precise enough', () => {
            let result = units.toMeters(1);
            result = units.fromMeters(result);
            expect(result).toBeCloseTo(1, 8);
        });

        it('0 feet is 0 meters', () => {
            const result = units.toMeters(0);
            expect(result).toBe(0);
        });

        it('0 meters is 0 feet', () => {
            const result = units.fromMeters(0);
            expect(result).toBe(0);
        });

        it('1 feet is 0.3048 meters', () => {
            const result = units.toMeters(1);
            expect(result).toBeCloseTo(0.3048, 8);
        });

        it('1 meters is 3.28 feet', () => {
            const result = units.fromMeters(1);
            expect(result).toBeCloseTo(3.280839895013123, 8);
        });
    });

    describe('Imperial - pound per inch2', () => {
        it('Psi to/from bars is precise enough', () => {
            let result = units.toBar(1);
            result = units.fromBar(result);
            expect(result).toBeCloseTo(1, 8);
        });

        it('0 psi is 0 bar', () => {
            const result = units.toBar(0);
            expect(result).toBe(0);
        });

        it('0 bar is 0 psi', () => {
            const result = units.fromBar(0);
            expect(result).toBe(0);
        });

        it('1 psi is 0,068 bar', () => {
            const result = units.toBar(1);
            expect(result).toBeCloseTo(0.06894757293167852, 8);
        });

        it('1 bar is 14.5 psi', () => {
            const result = units.fromBar(1);
            expect(result).toBeCloseTo(14.503773773022, 8);
        });
    });

    describe('Imperial - Cubic feet', () => {
        it('cft to/from liters is precise enough', () => {
            let result = units.toLiter(1);
            result = units.fromLiter(result);
            expect(result).toBeCloseTo(1, 8);
        });

        it('0 cft is 0 liter', () => {
            const result = units.toLiter(0);
            expect(result).toBe(0);
        });

        it('0 liter is 0 cft', () => {
            const result = units.fromLiter(0);
            expect(result).toBe(0);
        });

        it('1 cft is 28.3 liter', () => {
            const result = units.toLiter(1);
            expect(result).toBeCloseTo(28.316846592, 8);
        });

        it('1 liter is 0.035 cft', () => {
            const result = units.fromLiter(1);
            expect(result).toBeCloseTo(0.0353146667214886, 8);
        });
    });
});
