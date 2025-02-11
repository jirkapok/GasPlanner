import { PressureConverter, AltitudePressure } from './pressure-converter';

describe('Pressure Converter', () => {
    it('315700 pascals converts to 3.157 bar', () => {
        const result = PressureConverter.pascalToBar(315700);
        expect(result).toBeCloseTo(3.157, 3);
    });

    it('3.157 converts to 315700 pascals', () => {
        const result = PressureConverter.barToPascal(3.157);
        expect(result).toBeCloseTo(315700);
    });
});

describe('AltitudePressure', () => {
    describe('pressure from altitude', () => {
        it('At sea level is 10325 Pa', () => {
            const pressure = AltitudePressure.pressure(0);
            expect(pressure).toBeCloseTo(101325);
        });

        it('400 level is 96611 Pa', () => {
            const pressure = AltitudePressure.pressure(400);
            expect(pressure).toBeCloseTo(96611, 0);
        });

        it('1000 level is 89875 Pa', () => {
            const pressure = AltitudePressure.pressure(1000);
            expect(pressure).toBeCloseTo(89875, 0);
        });

        it('2000 level is 79495 Pa', () => {
            const pressure = AltitudePressure.pressure(2000);
            expect(pressure).toBeCloseTo(79495, 0);
        });

        it('3000 level is 70109 Pa', () => {
            const pressure = AltitudePressure.pressure(3000);
            expect(pressure).toBeCloseTo(70109, 0);
        });
    });

    describe('altitude from pressure', () => {
        it('higher than standard pressure', () => {
            const altitude = AltitudePressure.altitude(999999);
            expect(altitude).toBeCloseTo(0);
        });

        it('0 Pa is 44331 m', () => {
            const altitude = AltitudePressure.altitude(0);
            expect(altitude).toBeCloseTo(44331, 0);
        });

        it('10325 Pa is sea level', () => {
            const altitude = AltitudePressure.altitude(101325);
            expect(altitude).toBeCloseTo(0);
        });

        it('96611 Pa is 400 m.a.s.l', () => {
            const altitude = AltitudePressure.altitude(96611);
            expect(altitude).toBeCloseTo(400, 0);
        });

        it('89875 Pa is 1000 m.a.s.l', () => {
            const altitude = AltitudePressure.altitude(89875);
            expect(altitude).toBeCloseTo(1000, 0);
        });

        it('79495 Pa is 2000 m.a.s.l', () => {
            const altitude = AltitudePressure.altitude(79495);
            expect(altitude).toBeCloseTo(2000, 0);
        });

        it('70109 Pa is 3000 m.a.s.l', () => {
            const altitude = AltitudePressure.altitude(70109);
            expect(altitude).toBeCloseTo(3000, 0);
        });
    });
});
