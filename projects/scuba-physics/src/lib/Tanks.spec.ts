import { Diver } from './Diver';
import { DepthConverter } from './depth-converter';
import { StandardGases } from './Gases';
import { Consumption, ConsumptionSegment, Tank } from './Tanks';
import { Time } from './Time';

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

describe('Consumption', () => {
    describe('Rock bottom', () => {
        const calculateRockBottom = (duration: number): number => {
            const tank = new Tank(24, 200, 21);
            const diver = new Diver(20, 1.6);
            const consumption = new Consumption(DepthConverter.forFreshWater());
            const ascent = [new ConsumptionSegment(duration, 0, 20)];
            const rockBottom = consumption.calculateRockBottom(ascent, tank, diver);
            return rockBottom;
        };

        it('Minimum rock bottom is 30 bar', () => {
            const duration = 1 * Time.oneMinute;
            const rockBottom = calculateRockBottom(duration);
            expect(rockBottom).toEqual(30);
        });

        it('Adds two minutes for solution', () => {
            const duration = 10 * Time.oneMinute;
            const rockBottom = calculateRockBottom(duration);
            expect(rockBottom).toEqual(65);
        });
    });
});
