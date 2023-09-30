import { TestBed } from '@angular/core/testing';
import { AltitudeCalculator } from './altitudeCalculator';

describe('Altitude calclulator service', () => {
    let calc: AltitudeCalculator;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                AltitudeCalculator
            ]
        })
            .compileComponents();

        calc = TestBed.inject(AltitudeCalculator);
    });

    it('Uses simple depth converter', () => {
        calc.altitude = 0;
        expect(calc.pressure).toBeCloseTo(1.01325, 7);
    });

    it('Changing pressure updates altitude', () => {
        calc.pressure = 0.966111;
        expect(calc.altitude).toBeCloseTo(400);
    });

    it('Changing altitude updates pressure', () => {
        calc.altitude = 500;
        expect(calc.pressure).toBeCloseTo(0.9546084, 7);
    });

    it('Changing actual depth to 0 m.a.s.l results in 31.09 m theoretical depth', () => {
        calc.altitudeDepth = 30;
        expect(calc.theoreticalDepth).toBeCloseTo(31.090006, 6);
    });

    it('Changing altitude updates theoretical depth', () => {
        calc.altitude = 500;
        expect(calc.theoreticalDepth).toBeCloseTo(21.228600, 6);
    });

    it('Changing pressure updates theoretical depth', () => {
        calc.pressure = 0.966111;
        expect(calc.theoreticalDepth).toBeCloseTo(20.975851, 6);
    });
});
