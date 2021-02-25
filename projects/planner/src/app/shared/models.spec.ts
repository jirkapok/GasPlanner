import { TestBed, inject } from '@angular/core/testing';
import { NitroxCalculatorService } from './nitrox-calculator.service';
import { Tank } from './models';

describe('Tank', () => {
    let gas: Tank;

    beforeEach(() => {
        TestBed.configureTestingModule({
            // any service to satisfy angular compiler
            providers: [NitroxCalculatorService]
        });

        gas = new Tank(10, 21, 200);
    });

    describe('Full', () => {
        it('has nothing consumed', () => {
            expect(gas.endPressure).toBe(200);
        });

        it('has reserve', () => {
            expect(gas.hasReserve).toBeTruthy();
        });

        it('percent remaining is 100', () => {
            expect(gas.percentsRemaining).toBe(100);
        });

        it('percent rock bottom is 0', () => {
            expect(gas.percentsReserve).toBe(0);
        });
    });

    describe('Empty', () => {
        beforeEach(() => {
            gas.consumed = 200;
            gas.reserve = 50;
        });

        it('end pressure 100', () => {
            expect(gas.endPressure).toBe(0);
        });

        it('has not reserve', () => {
            expect(gas.hasReserve).toBeFalsy();
        });

        it('percent remaining is 0', () => {
            expect(gas.percentsRemaining).toBe(0);
        });

        it('percent rock bottom is 25', () => {
            expect(gas.percentsReserve).toBe(25);
        });
    });

    describe('Consumed, but still reserve', () => {
        beforeEach(() => {
            gas.consumed = 100;
            gas.reserve = 50;
        });

        it('end pressure 100', () => {
            expect(gas.endPressure).toBe(100);
        });

        it('has reserve', () => {
            expect(gas.hasReserve).toBeTruthy();
        });

        it('percent remaining is 50', () => {
            expect(gas.percentsRemaining).toBe(50);
        });

        it('percent rock bottom is 25', () => {
            expect(gas.percentsReserve).toBe(25);
        });
    });

    describe('Consumed more than reserve', () => {
        beforeEach(() => {
            gas.consumed = 150;
            gas.reserve = 100;
        });

        it('end pressure 50', () => {
            expect(gas.endPressure).toBe(50);
        });

        it('has no reserve', () => {
            expect(gas.hasReserve).toBeFalsy();
        });

        it('percent remaining is 25', () => {
            expect(gas.percentsRemaining).toBe(25);
        });

        it('percent rock bottom is 50', () => {
            expect(gas.percentsReserve).toBe(50);
        });
    });
});
