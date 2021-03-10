import { Diver } from './Diver';
import { DepthConverter } from './depth-converter';
import { StandardGases } from './Gases';
import { Consumption, Tank } from './Tanks';
import { Time } from './Time';
import { Segment } from './Segments';

describe('Tank', () => {
    let tank: Tank;

    beforeEach(() => {
        tank = Tank.createDefault();
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

        it('empty end pressure 100', () => {
            expect(tank.endPressure).toBe(0);
        });

        it('has not reserve', () => {
            expect(tank.hasReserve).toBeFalsy();
        });

        it('percent remaining is 0', () => {
            expect(tank.percentsRemaining).toBe(0);
        });

        it('empty percent rock bottom is 25', () => {
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

        it('consumed has reserve', () => {
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

        it('Nothing changed if, gas wasn\'t found', () => {
            const modified = new Tank(10, 200, 21);
            modified.assignStandardGas('unknown');
            expect(modified.gas).toEqual(StandardGases.air);
        });
    });
});

describe('Consumption', () => {
    const diver = new Diver(20, 1.6);
    const consumption = new Consumption(DepthConverter.forFreshWater());

    describe('Single tank', () => {
        describe('Rock bottom', () => {
            const tenMinutes = 10 * Time.oneMinute;

            const calculateRockBottom = (duration: number): number => {
                const tank = new Tank(24, 200, 21);

                const segments = [new Segment(20, 0, tank.gas, duration)];
                const rockBottom = consumption.calculateRockBottom(segments, tank, diver);
                return rockBottom;
            };

            it('Minimum rock bottom is 30 bar', () => {
                const rockBottom = calculateRockBottom(Time.oneMinute);
                expect(rockBottom).toEqual(30);
            });

            it('Adds two minutes for solution', () => {
                const rockBottom = calculateRockBottom(tenMinutes);
                expect(rockBottom).toEqual(65);
            });

            it('All levels are counted', () => {
                // TODO add complex profile
                const rockBottom = calculateRockBottom(tenMinutes);
                expect(rockBottom).toEqual(65);
            });
        });

        describe('Consumed gas', () => {
            it('Is subtracted from start pressure', () => {
                const tank = new Tank(10, 200, 21);
                const tanks = [ tank ];
                const duration = 10 * Time.oneMinute;
                const profile = [
                    new Segment(0, 20, tank.gas, Time.oneMinute),
                    new Segment(20, 20, tank.gas, duration),
                    new Segment(20, 0, tank.gas, 2 * Time.oneMinute)
                ];

                // (2b avg depth * 2 bar/min * 1 minutes) + (3b * 2 bar/min * 10 minutes) + (2b * 2 bar/min * 2 minutes)
                consumption.consumeFromTanks(profile, tanks, diver.sac);
                expect(tank.consumed).toEqual(72);
            });
        });
    });

    describe('Multiple tanks', () => {
        xit('Both tanks are consumed', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);

            const profile = [
                new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),     // 2.5b * 1 bar/min * 2 minutes = 5b
                new Segment(30, 30, airTank.gas, 10 * Time.oneMinute),   // 4b * 1 bar/min * 10 minutes = 40b
                new Segment(30, 20, airTank.gas, 2 * Time.oneMinute),    // 3.5b * 1 bar/min * 2 minute = 7b
                new Segment(20, 20, ean50Tank.gas, 1 * Time.oneMinute),  // 3b * 2 bar/min * 1 minutes = 6b
                new Segment(20, 0, ean50Tank.gas, 1 * Time.oneMinute)    // 2b * 2 bar/min * 1 minutes = 4b
            ];

            const consumed = consumption.consumedOnWay(profile, airTank, diver.sac);
            expect(consumed).toEqual(72);
        });

        // TODO add tests for complex profile with deco on EAN50:
        // 1. tank air, 2. tank ean50
        //   -> reserve is updated for both
        //   -> consumed gas is extracted from both tanks

        // 1. tank air, 2. tank air, 3. tank ean50 - consumed less than available in 2. tank
        //   -> reserve is updated for all tanks, air first subtracted from second tank
        //   -> consumed gas is extracted from all tanks, for air first from second tank

        // 1. tank air, 2. tank air, 3. tank ean50 - consumed more than 2. tank
        //   -> reserve is updated for all tanks, air first subtracted from second tank
        //   -> consumed gas is extracted from all tanks, for air first from second tank

        // 1. tank air, 2. tank ean50, 3. tank ean50 - consumed less than available in 3. tank
        //   -> reserve is updated for all tanks, air first subtracted from second tank
        //   -> consumed gas is extracted from all tanks, for air first from second tank

        // 1. tank air, 2. tank ean50, 3. tank ean50 - consumed more than 3. tank
        //   -> reserve is updated for all tanks, air first subtracted from second tank
        //   -> consumed gas is extracted from all tanks, for air first from second tank
    });
});
