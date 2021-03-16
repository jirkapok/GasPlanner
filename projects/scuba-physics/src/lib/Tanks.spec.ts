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
                // TODO add test for rock bottom with complex profile
                const rockBottom = calculateRockBottom(tenMinutes);
                expect(rockBottom).toEqual(65);
            });
        });

        describe('Consumed gas', () => {
            it('Is subtracted from start pressure', () => {
                const tank = new Tank(10, 200, 21);
                const tanks = [ tank ];
                const profile = [
                    new Segment(0, 20, tank.gas, Time.oneMinute),
                    new Segment(20, 20, tank.gas, 10 * Time.oneMinute),
                    new Segment(20, 0, tank.gas, 2 * Time.oneMinute)
                ];

                // (2b avg depth * 2 bar/min * 1 minutes) + (3b * 2 bar/min * 10 minutes) + (2b * 2 bar/min * 2 minutes)
                consumption.consumeFromTanks(profile, tanks, diver.sac);
                expect(tank.consumed).toEqual(72);
            });
        });
    });

    describe('Multiple tanks', () => {
        describe('1. tank air, 2. tank ean50', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const tanks = [airTank, ean50Tank];

            const profile = [
                new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),     // 2.5b * 1 bar/min * 2 minutes = 5b
                new Segment(30, 30, airTank.gas, 10 * Time.oneMinute),   // 4b * 1 bar/min * 10 minutes = 40b
                new Segment(30, 20, airTank.gas, 2 * Time.oneMinute),    // 3.5b * 1 bar/min * 2 minute = 7b
                new Segment(20, 20, ean50Tank.gas, 1 * Time.oneMinute),  // 3b * 2 bar/min * 1 minutes = 6b
                new Segment(20, 0, ean50Tank.gas, 1 * Time.oneMinute)    // 2b * 2 bar/min * 1 minutes = 4b
            ];

            consumption.consumeFromTanks(profile, tanks, diver.sac);

            it('Both tanks are consumed', () => {
                expect(airTank.consumed).toEqual(52);
                expect(ean50Tank.consumed).toEqual(10);
            });

            xit('Reserve is updated for both', () => {
                expect(airTank.reserve).toEqual(52);
                expect(ean50Tank.reserve).toEqual(10);
            });
        });

        describe('1. tank air, 2. ean50, 3. air - consumed less than from one tank', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const airTank2 = new Tank(10, 200, 21);
            const tanks = [airTank, ean50Tank, airTank2];

            const profile = [
                new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),     // 2.5b * 2 bar/min * 2 minutes = 10b
                new Segment(30, 30, airTank.gas, 10 * Time.oneMinute),   // 4b * 2 bar/min * 10 minutes = 80b
                new Segment(30, 20, airTank.gas, 2 * Time.oneMinute),    // 3.5b * 2 bar/min * 2 minute = 14b
                new Segment(20, 20, ean50Tank.gas, 1 * Time.oneMinute),  // 3b * 2 bar/min * 1 minutes = 6b
                new Segment(20, 0, ean50Tank.gas, 1 * Time.oneMinute)    // 2b * 2 bar/min * 1 minutes = 4b
            ];

            consumption.consumeFromTanks(profile, tanks, diver.sac);

            it('Consumption is updated from second tank only', () => {
                expect(airTank.consumed).toEqual(0);
                expect(ean50Tank.consumed).toEqual(10);
                expect(airTank2.consumed).toEqual(103); // rounding
            });

            xit('Reserve is updated for beginning of tanks array', () => {
                expect(airTank.reserve).toEqual(52);
                expect(ean50Tank.reserve).toEqual(10);
            });
        });

        describe('1. tank air, 2. air, 3. ean50 - consumed from both tanks', () => {
            const airTank = new Tank(20, 200, 21);
            const airTank2 = new Tank(10, 130, 21);
            const ean50Tank = new Tank(10, 100, 50);
            const tanks = [airTank, airTank2, ean50Tank];

            const profile = [
                new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),     // 2.5b * 2 bar/min * 2 minutes = 10b : 2.air
                new Segment(30, 30, airTank.gas, 15 * Time.oneMinute),   // 4b * 2 bar/min * 15 minutes = 120b : 2.air
                new Segment(30, 20, airTank.gas, 2 * Time.oneMinute),    // 3.5b * 1 bar/min * 2 minute = 7b : 1. air
                new Segment(20, 20, ean50Tank.gas, 1 * Time.oneMinute),  // 3b * 2 bar/min * 1 minutes = 6b
                new Segment(20, 0, ean50Tank.gas, 1 * Time.oneMinute)    // 2b * 2 bar/min * 1 minutes = 4b
            ];

            consumption.consumeFromTanks(profile, tanks, diver.sac);

            it('Consumption is updated from both air tanks', () => {
                expect(airTank.consumed).toEqual(7);
                expect(ean50Tank.consumed).toEqual(10);
                expect(airTank2.consumed).toEqual(130);
            });

            xit('Reserve is updated for beginning of tanks array 2', () => {
                expect(airTank.reserve).toEqual(52);
                expect(ean50Tank.reserve).toEqual(10);
            });
        });

        describe('Tank not used during dive', () => {
            const airTank = new Tank(10, 200, 21);
            const ean50Tank = new Tank(10, 100, 50);
            const tanks = [airTank, ean50Tank];

            const profile = [
                new Segment(0, 20, airTank.gas, Time.oneMinute),
                new Segment(20, 20, airTank.gas, 10 * Time.oneMinute),
                new Segment(20, 0, airTank.gas, 2 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, tanks, diver.sac);

            it('Consumption is updated only from air', () => {
                expect(airTank.consumed).toEqual(72);
                expect(ean50Tank.consumed).toEqual(0);
            });

            xit('Reserve is updated for beginning of tanks array 2', () => {
                expect(airTank.reserve).toEqual(52);
                expect(ean50Tank.reserve).toEqual(10);
            });
        });

        describe('Used tank wasn\'t provided to update consumption', () => {
            const airTank = new Tank(10, 200, 21);
            const ean50Tank = new Tank(10, 100, 50);
            const tanks = [ean50Tank];

            const profile = [
                new Segment(0, 20, airTank.gas, Time.oneMinute),
                new Segment(20, 20, airTank.gas, 10 * Time.oneMinute),
                new Segment(20, 0, airTank.gas, 2 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, tanks, diver.sac);

            it('No tank is updated', () => {
                expect(airTank.consumed).toEqual(0);
                expect(ean50Tank.consumed).toEqual(0);
            });

            xit('Reserve is updated for beginning of tanks array 2', () => {
                expect(airTank.reserve).toEqual(52);
                expect(ean50Tank.reserve).toEqual(10);
            });
        });
    });
});
