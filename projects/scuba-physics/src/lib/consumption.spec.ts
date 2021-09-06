import { Diver } from './Diver';
import { DepthConverter } from './depth-converter';
import { Tank } from './Tanks';
import { Consumption } from './consumption';
import { Time } from './Time';
import { Segment } from './Segments';
import { Options } from './BuhlmannAlgorithm';

describe('Consumption', () => {
    const diver = new Diver(20, 1.6);
    const consumption = new Consumption(DepthConverter.forFreshWater());

    describe('Max bottom time', () => {
        const options = new Options(0.4, 0.85, 1.4, 1.6, 30, true, true);

        it('Is calculated for default simple plan', () => {
            const tank = new Tank(15, 200, 21);
            const tanks = [tank];
            const maxBottomTime = consumption.calculateMaxBottomTime(30, tanks, diver, options, 11);
            expect(maxBottomTime).toEqual(17);
        });

        it('Decompression dive is calculated using all tanks', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const tanks = [airTank, ean50Tank];
            const maxBottomTime = consumption.calculateMaxBottomTime(40, tanks, diver, options, 7);
            expect(maxBottomTime).toEqual(19);
        });

        it('NO Deco dive is calculated using all tanks', () => {
            const airTank = new Tank(20, 85, 21);
            const ean50Tank = new Tank(10, 95, 50);
            const tanks = [airTank, ean50Tank];
            const maxBottomTime = consumption.calculateMaxBottomTime(40, tanks, diver, options, 7);
            expect(maxBottomTime).toEqual(5);
        });
    });

    describe('Single tank', () => {
        describe('Rock bottom', () => {
            const tenMinutes = 10 * Time.oneMinute;

            const callConsumption = (duration: number): Tank => {
                const tank = new Tank(24, 200, 21);
                const tanks = [tank];
                const segments = [
                    new Segment(0, 20, tank.gas, Time.oneMinute),
                    new Segment(20, 20, tank.gas, Time.oneMinute),
                    new Segment(20, 0, tank.gas, duration)
                ];

                consumption.consumeFromTanks(segments, 2, tanks, diver);
                return tank;
            };

            it('Minimum rock bottom is 30 bar', () => {
                const tank = callConsumption(Time.oneMinute);
                expect(tank.reserve).toEqual(30);
            });

            it('Adds two minutes for solution', () => {
                const tank = callConsumption(tenMinutes);
                expect(tank.reserve).toEqual(65);
            });
        });

        describe('Consumed gas', () => {
            it('Is subtracted from start pressure', () => {
                const tank = new Tank(10, 200, 21);
                const tanks = [tank];
                const profile = [
                    new Segment(0, 20, tank.gas, Time.oneMinute),
                    new Segment(20, 20, tank.gas, 10 * Time.oneMinute),
                    new Segment(20, 0, tank.gas, 2 * Time.oneMinute)
                ];

                // (2b avg depth * 2 bar/min * 1 minutes) + (3b * 2 bar/min * 10 minutes) + (2b * 2 bar/min * 2 minutes)
                consumption.consumeFromTanks(profile, 2, tanks, diver);
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

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Both tanks are consumed', () => {
                expect(airTank.consumed).toEqual(52);
                expect(ean50Tank.consumed).toEqual(10);
            });

            it('Reserve is updated for both tanks', () => {
                expect(airTank.reserve).toEqual(45);   // (7b  + 2 * 4b * 1 b/min) * 3
                expect(ean50Tank.reserve).toEqual(30); // 10b * 3
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

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Consumption is updated from second tank only', () => {
                expect(airTank.consumed).toEqual(0);
                expect(ean50Tank.consumed).toEqual(10);
                expect(airTank2.consumed).toEqual(103); // rounding
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

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Consumption is updated from both air tanks', () => {
                expect(airTank.consumed).toEqual(7);
                expect(ean50Tank.consumed).toEqual(10);
                expect(airTank2.consumed).toEqual(130);
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

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Consumption is updated only from air', () => {
                expect(airTank.consumed).toEqual(72);
                expect(ean50Tank.consumed).toEqual(0);
            });

            it('Reserve is reset only', () => {
                expect(airTank.reserve).toEqual(60); // (3 b * 2 b/min. * 2 min + 2b * 2 b/min. * 2 min) * 3
                expect(ean50Tank.reserve).toEqual(0);
            });
        });

        describe('Used tank wasn\'t provided to update consumption', () => {
            const airTank = new Tank(10, 200, 21);
            airTank.reserve = 300;
            const ean50Tank = new Tank(10, 100, 50);
            ean50Tank.reserve = 290;
            const tanks = [ean50Tank];

            const profile = [
                new Segment(0, 20, airTank.gas, Time.oneMinute),
                new Segment(20, 20, airTank.gas, 10 * Time.oneMinute),
                new Segment(20, 0, airTank.gas, 2 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('No tank is updated', () => {
                expect(airTank.consumed).toEqual(0);
                expect(ean50Tank.consumed).toEqual(0);
            });

            it('Reserve is not touched', () => {
                expect(airTank.reserve).toEqual(300); // not touched
                expect(ean50Tank.reserve).toEqual(30);
            });
        });

        describe('1. tank air, 2. ean50, 3. ean50 - reserve from both tanks', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 100, 50);
            const ean50Tank2 = new Tank(10, 130, 50);
            const tanks = [airTank, ean50Tank, ean50Tank2];

            const profile = [
                new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),
                new Segment(30, 30, airTank.gas, 15 * Time.oneMinute),  // air relevant only during ascent
                new Segment(30, 20, airTank.gas, 2 * Time.oneMinute),   // 3.5b * 1 bar/min * 2 minute = 7b
                new Segment(20, 20, ean50Tank.gas, 1 * Time.oneMinute), // 3b * 2 bar/min * 1 minutes = 6b
                new Segment(20, 0, ean50Tank.gas, 10 * Time.oneMinute)  // 2b * 2 bar/min * 10 minutes = 40b
            ];

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Reserve is updated from both air tanks', () => {
                expect(airTank.reserve).toEqual(45);     // (7b + 4b * 1 b/min. * 2 min) * 3
                // total: (6b  + 40 b) * 3 = 138 b
                expect(ean50Tank.reserve).toEqual(100);   // full tank as first in order
                expect(ean50Tank2.reserve).toEqual(38);
            });
        });

    });

    describe('Tank assigned to user segment', () => {
        describe('Multiple user defined tanks', () => {
            const airTank = new Tank(20, 100, 21);
            const airTank2 = new Tank(20, 100, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const ean50Tank2 = new Tank(10, 200, 50);
            const tanks = [airTank, airTank2, ean50Tank, ean50Tank2];

            const descent = new Segment(0, 20, ean50Tank.gas, 2 * Time.oneMinute); // ean50 2b * 2 bar/min * 2 minute = 8b
            descent.tank = ean50Tank;
            const swim = new Segment(20, 20, airTank.gas, 20 * Time.oneMinute);  // 3 b * 1 b/min * 20 min = 60b
            swim.tank = airTank;

            const profile = [
                descent,
                swim,
                new Segment(20, 0, ean50Tank2.gas, 4 * Time.oneMinute),   // 2 b * 2 bar/min * 4 minute = 16b
            ];

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Gas is Consumed from required tank', () => {
                expect(airTank.consumed).toEqual(60); // user defined by swim segment
                expect(airTank2.consumed).toEqual(0); // not touched
                expect(ean50Tank.consumed).toEqual(8); // user defined by descent segment
                expect(ean50Tank2.consumed).toEqual(16); // ascent has chosen consume from last in the list
            });

            it('Reserve is not relevant to assigned tanks', () => {
                expect(airTank.reserve).toEqual(30); // minimum reserve always present for first tank
                expect(airTank2.reserve).toEqual(0); // not used
                // 3 b * 2 bar/min * 2 minute * 3 = 36 b, 2 b * 2 bar/min * 4 minute * 3 = 48b => 84 b
                expect(ean50Tank.reserve).toEqual(84); // used during ascent as rock bottom
                expect(ean50Tank2.reserve).toEqual(0); // not used
            });
        });

        describe('Single user defined tanks', () => {
            const airTank = new Tank(20, 100, 21);
            const tanks = [airTank];

            const descent = new Segment(0, 20, airTank.gas, 2 * Time.oneMinute); // 2 b * 1 bar/min * 2 minute = 4b
            descent.tank = airTank;
            const swim = new Segment(20, 20, airTank.gas, 40 * Time.oneMinute);  // 3 b * 1 b/min * 40 min = 120b
            swim.tank = airTank;

            const profile = [
                descent,
                swim,
                new Segment(20, 0, airTank.gas, 4 * Time.oneMinute),   // 2 b * 1 bar/min * 4 minute = 8b
            ];

            consumption.consumeFromTanks(profile, 2, tanks, diver);

            it('Reserve is more than consumed by one segment', () => {
                expect(airTank.reserve).toEqual(42); // user defined by swim segment
                expect(airTank.consumed).toEqual(100); // up to the limit
            });
        });

        describe('Only user defined segments', () => {
            const airTank = new Tank(20, 100, 21);
            const tanks = [airTank];

            const descent = new Segment(0, 20, airTank.gas, 2 * Time.oneMinute); // 2 b * 1 bar/min * 2 minute = 4b
            descent.tank = airTank;
            const swim = new Segment(20, 20, airTank.gas, 40 * Time.oneMinute);  // 3 b * 1 b/min * 40 min = 120b
            swim.tank = airTank;
            const ascent = new Segment(20, 0, airTank.gas, 4 * Time.oneMinute);   // 2 b * 1 bar/min * 4 minute = 8b
            ascent.tank = airTank;

            const profile = [descent, swim, ascent];
            consumption.consumeFromTanks(profile, 3, tanks, diver);

            it('Tank is updated as with calculated segments', () => {
                expect(airTank.reserve).toEqual(30); // the minimum since there is no ascent identified
                expect(airTank.consumed).toEqual(100); // up to the limit
            });
        });

    });
});
