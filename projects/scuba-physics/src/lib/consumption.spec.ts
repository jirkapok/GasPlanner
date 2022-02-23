import { Diver } from './Diver';
import { DepthConverter } from './depth-converter';
import { Tank } from './Tanks';
import { Consumption } from './consumption';
import { Time } from './Time';
import { Segment, Segments } from './Segments';
import { OptionExtensions } from './Options.spec';
import { SafetyStop } from './Options';
import { Salinity } from './pressure-converter';

describe('Consumption', () => {
    const diver = new Diver(20, 1.6);
    const consumption = new Consumption(DepthConverter.forFreshWater());

    describe('Max bottom time', () => {
        const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
        options.safetyStop = SafetyStop.always;
        options.problemSolvingDuration = 2;

        it('Is calculated for default simple plan', () => {
            const tank = new Tank(15, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(0, 30, tank.gas, Time.oneMinute * 0.5);
            segments.addFlat(30, tank.gas, Time.oneMinute * 10.5);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            expect(maxBottomTime).toEqual(17);
        });

        it('Decompression dive is calculated using all tanks', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const tanks = [airTank, ean50Tank];

            const segments = new Segments();
            segments.add(0, 40, airTank.gas, Time.oneMinute * 2);
            segments.addFlat(40, airTank.gas, Time.oneMinute);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            expect(maxBottomTime).toEqual(20);
        });

        it('NO Deco dive is calculated using all tanks', () => {
            const airTank = new Tank(20, 85, 21);
            const ean50Tank = new Tank(10, 95, 50);
            const tanks = [airTank, ean50Tank];

            const segments = new Segments();
            segments.add(0, 40, airTank.gas, Time.oneMinute * 2);
            segments.addFlat(40, airTank.gas, Time.oneMinute);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            expect(maxBottomTime).toEqual(5);
        });

        it('0 max time is calculated for plan where defined longer dive than possible', () => {
            const tank = new Tank(15, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(0, 30, tank.gas, Time.oneMinute * 0.5);
            segments.addFlat(30, tank.gas, Time.oneMinute * 23);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            expect(maxBottomTime).toEqual(0);
        });

        it('Long dives dont calculate till infinity', () => {
            const tank = new Tank(24, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(0, 5, tank.gas, Time.oneMinute);
            segments.addFlat(5, tank.gas, Time.oneMinute * 10);

            const startTime = performance.now();
            consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            const endTime = performance.now();
            const methodDuration = Math.round(endTime - startTime);

            expect(methodDuration).toBeLessThan(200);
        });

        it('Multilevel dived accept multiple continuing levels', () => {
            const tank = new Tank(24, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(0, 20, tank.gas, Time.oneMinute);
            segments.addFlat(20, tank.gas, Time.oneMinute * 10);
            segments.addFlat(20, tank.gas, Time.oneMinute * 10);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            expect(maxBottomTime).toEqual(49);
        });

        it('Profile ending on surface can consume gas also on surface', () => {
            const tank = new Tank(24, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(0, 10, tank.gas, Time.oneMinute * 10);
            segments.addFlat(10, tank.gas, Time.oneMinute * 10);
            segments.add(10, 0, tank.gas, Time.oneMinute * 10);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, diver, options);
            expect(maxBottomTime).toEqual(181);
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

                consumption.consumeFromTanks(segments, 2, tanks, diver, 2);
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
                consumption.consumeFromTanks(profile, 2, tanks, diver, 2);
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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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

            consumption.consumeFromTanks(profile, 2, tanks, diver, 2);

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
            consumption.consumeFromTanks(profile, 3, tanks, diver, 2);

            it('Tank is updated as with calculated segments', () => {
                expect(airTank.reserve).toEqual(30); // the minimum since there is no ascent identified
                expect(airTank.consumed).toEqual(100); // up to the limit
            });
        });
    });

    describe('User defined segments', () => {
        it('Plan ends at surface', () => {
            const tank = new Tank(10, 200, 21);
            const tanks = [tank];

            const first = new Segment(0, 10, tank.gas, Time.oneMinute * 10);
            const second = new Segment(10, 0, tank.gas, Time.oneMinute * 10);
            const segments = [first, second];
            // 1.5 * 20 * 2 = 60

            consumption.consumeFromTanks(segments, 2, tanks, diver, 2);
            expect(tank.consumed).toEqual(61); //  because of pressure conversion
            // should be (1.5 * 10 * 2 * 3) + (2 * 2 * 3) = 102
            expect(tank.reserve).toEqual(102);
        });

        it('As part of ascent counts to rock bottom', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2];

            const first = new Segment(0, 40, tank1.gas, Time.oneMinute * 4); // 3 * 4 * 1 = 12
            first.tank = tank1;
            const second = new Segment(40, 40, tank1.gas, Time.oneMinute * 13); // 5 * 13 * 1 = 65
            second.tank = tank1;
            const third = new Segment(40, 6, tank1.gas, Time.oneMinute * 10); // 3,3 * 10 * 1 = 33
            third.tank = tank1;
            const safety = new Segment(6, 6, tank2.gas, Time.oneMinute * 8); // 1,6 * 8 * 2 = 25,6
            const ascent = new Segment(6, 0, tank2.gas, Time.oneMinute * 2); // 1,3 * 2 * 2 = 5,2
            const segments = [first, second, third, safety, ascent];

            // currently tank1 30/90,  tank2 112/169 (reserve/remaining)
            // should be tank1 129/90, tank2 94/169
            consumption.consumeFromTanks(segments, 3, tanks, diver, 2);
            expect(tank1.reserve).toEqual(129);
            expect(tank2.reserve).toEqual(94);
        });

        // TODO add multilevel dives reserve calculations: all use maximum depth as point where ascent starts
        // 1. deeper, shallower, deeper than at beginning
        // 2. both depths identical, shallower between them
        // 3. deeper, shallower, shallower at beginning
        // 4. Multiple tanks of the same gas, reserve is counted form first bellow reserve and second tank is not utilized
        // TODO Add to documentation: this is correct scenario, user is informed, that he needs to switch
        //  and therefore needs to use new segment and enforce usage of different gas
        // TODO Add test to events, that we need show also user defined gas switch to other tank even with the same gas
        // 40 m/20 minutes on first tank only. Tanks: 24/200/.21, 11/200/.21
        // 5. Previous dive, but First two user defined segments use second tank - ensure consumption is calculated correctly
    });
});
