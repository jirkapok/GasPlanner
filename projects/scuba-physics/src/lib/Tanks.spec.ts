import { StandardGases } from './Gases';
import { Tank } from './Tanks';

describe('Tank', () => {
    let tank: Tank;

    beforeEach(() => {
        tank = new Tank(10, 200, 21);
    });

    describe('Full', () => {
        it('has nothing consumed', () => {
            expect(tank.endPressure).toBe(200);
        });

        it('has reserve', () => {
            expect(tank.hasReserve).toBeTruthy();
        });

        it('percent remaining is 100', () => {
            expect(tank.percentsRemaining).toBe(100);
        });

        it('percent rock bottom is 0', () => {
            expect(tank.percentsReserve).toBe(0);
        });
    });

    describe('Empty', () => {
        beforeEach(() => {
            tank.consumed = 200;
            tank.reserve = 50;
        });

        it('end pressure 100', () => {
            expect(tank.endPressure).toBe(0);
        });

        it('has not reserve', () => {
            expect(tank.hasReserve).toBeFalsy();
        });

        it('percent remaining is 0', () => {
            expect(tank.percentsRemaining).toBe(0);
        });

        it('percent rock bottom is 25', () => {
            expect(tank.percentsReserve).toBe(25);
        });
    });

    describe('Consumed, but still reserve', () => {
        beforeEach(() => {
            tank.consumed = 100;
            tank.reserve = 50;
        });

        it('end pressure 100', () => {
            expect(tank.endPressure).toBe(100);
        });

        it('has reserve', () => {
            expect(tank.hasReserve).toBeTruthy();
        });

        it('percent remaining is 50', () => {
            expect(tank.percentsRemaining).toBe(50);
        });

        it('percent rock bottom is 25', () => {
            expect(tank.percentsReserve).toBe(25);
        });
    });

    describe('Consumed more than reserve', () => {
        beforeEach(() => {
            tank.consumed = 150;
            tank.reserve = 100;
        });

        it('end pressure 50', () => {
            expect(tank.endPressure).toBe(50);
        });

        it('has no reserve', () => {
            expect(tank.hasReserve).toBeFalsy();
        });

        it('percent remaining is 25', () => {
            expect(tank.percentsRemaining).toBe(25);
        });

        it('percent rock bottom is 50', () => {
            expect(tank.percentsReserve).toBe(50);
        });
    });

    describe('Assign standard gas', () => {
        it('Assigns both O2 and He fractions', () => {
            const modified = new Tank(10, 200, 21);
            modified.assignStandardGas('10/70');
            expect(modified.gas).toEqual(StandardGases.trimix1070);
        });

        it('Nothing changed if, gas wasnt found', () => {
            const modified = new Tank(10, 200, 21);
            modified.assignStandardGas('unknown');
            expect(modified.gas).toEqual(StandardGases.air);
        });
    });
});
