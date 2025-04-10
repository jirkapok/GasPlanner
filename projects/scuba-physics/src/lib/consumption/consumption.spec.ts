import { Diver } from './Diver';
import { DepthConverter } from '../physics/depth-converter';
import { Tank } from './Tanks';
import { Consumption, ConsumptionOptions } from './consumption';
import { Time } from '../physics/Time';
import { Segment, Segments } from '../depths/Segments';
import { OptionExtensions } from '../algorithm/Options.spec';
import { SafetyStop } from '../algorithm/Options';
import { Salinity } from '../physics/pressure-converter';
import { ProfileTissues } from "../algorithm/ProfileTissues";
import { RestingParameters } from "../algorithm/BuhlmannAlgorithmParameters";

describe('Consumption', () => {
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: 0
    };
    const consumption = new Consumption(DepthConverter.forFreshWater());
    const options2 = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options2.safetyStop = SafetyStop.never;
    options2.problemSolvingDuration = 2;

    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    options.safetyStop = SafetyStop.always;
    options.problemSolvingDuration = 2;

    describe('Max bottom time', () => {
        it('Is calculated for default simple plan', () => {
            const tank = new Tank(15, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(30, tank.gas, Time.oneMinute * 0.5);
            segments.addFlat(tank.gas, Time.oneMinute * 10.5);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            expect(maxBottomTime).toEqual(17);
        });

        it('Decompression dive is calculated using all tanks', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const tanks = [airTank, ean50Tank];

            const segments = new Segments();
            segments.add(40, airTank.gas, Time.oneMinute * 2);
            segments.addFlat(airTank.gas, Time.oneMinute);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            expect(maxBottomTime).toEqual(27);
        });

        it('NO Deco dive is calculated using all tanks', () => {
            const airTank = new Tank(20, 85, 21);
            const ean50Tank = new Tank(10, 95, 50);
            const tanks = [airTank, ean50Tank];

            const segments = new Segments();
            segments.add(40, airTank.gas, Time.oneMinute * 2);
            segments.addFlat(airTank.gas, Time.oneMinute);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            expect(maxBottomTime).toEqual(5);
        });

        it('0 max time is calculated for plan where defined longer dive than possible', () => {
            const tank = new Tank(15, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(30, tank.gas, Time.oneMinute * 0.5);
            segments.addFlat(tank.gas, Time.oneMinute * 23);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            expect(maxBottomTime).toEqual(0);
        });

        it('Multilevel dive accept multiple continuing levels', () => {
            const tank = new Tank(24, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(20, tank.gas, Time.oneMinute);
            segments.addFlat(tank.gas, Time.oneMinute * 10);
            segments.addFlat(tank.gas, Time.oneMinute * 10);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            expect(maxBottomTime).toEqual(51);
        });

        it('Profile ending on surface can consume gas also on surface', () => {
            const tank = new Tank(24, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(10, tank.gas, Time.oneMinute * 10);
            segments.addFlat(tank.gas, Time.oneMinute * 10);
            segments.add(0, tank.gas, Time.oneMinute * 10);

            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            expect(maxBottomTime).toEqual(177);
        });

        it('Repetitive dive counts with previous tissues loading', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(10, 200, 50);
            const tanks = [airTank, ean50Tank];

            const segments = new Segments();
            segments.add(40, airTank.gas, Time.oneMinute * 2);
            segments.addFlat(airTank.gas, Time.oneMinute);

            const previousTissues = ProfileTissues.createAtSurface(0);
            const altitudeOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
            altitudeOptions.altitude = 2000; // simulate loaded tissues using altitude
            const surfaceInterval = new RestingParameters(previousTissues, Time.oneMinute * 10);
            const maxBottomTime = consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, altitudeOptions, surfaceInterval);
            expect(maxBottomTime).toEqual(21); // otherwise should be 23
        });
    });

    describe('Single tank', () => {
        describe('Rock bottom', () => {
            const callConsumption = (tankSize: number, duration: number): Tank => {
                const tank = new Tank(tankSize, 200, 21);
                const tanks = [tank];
                const segments = [
                    new Segment(0, 20, tank.gas, Time.oneMinute),
                    new Segment(20, 20, tank.gas, duration),
                    new Segment(20, 0, tank.gas, 4 * Time.oneMinute)
                ];

                const options3 = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
                options3.safetyStop = SafetyStop.always;
                options3.problemSolvingDuration = 2;
                consumption.consumeFromTanks(segments, options3, tanks, consumptionOptions);
                return tank;
            };

            it('Minimum rock bottom is 30 bar', () => {
                const tank = callConsumption(36, Time.oneMinute);
                expect(tank.reserve).toEqual(30); // should be 24 bar
            });

            it('Adds two minutes for solution', () => {
                const tenMinutes = 10 * Time.oneMinute;
                const tank = callConsumption(20, tenMinutes);
                // (3 * 2 * 1) + (2.2 * 1.5 * 1) + (1.3 * 3 * 1) + (1.15 * 0.3 * 1) =
                // (6 + 3.3 + 3.9 + 0.3) * 3 = 42
                expect(tank.reserve).toEqual(42);
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
                consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);
                expect(tank.consumed).toEqual(71);
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

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            it('Both tanks are consumed', () => {
                expect(airTank.consumed).toEqual(51);
                expect(ean50Tank.consumed).toEqual(10);
            });

            it('Reserve is updated for both tanks', () => {
                expect(airTank.reserve).toEqual(33); // ((4 b * 1 barm/min * 2 min) + (2.5 b * 1 b/min * 1 min)) * 3
                expect(ean50Tank.reserve).toEqual(22); // ((3 b * 2 barm/min * 1 min) + (2 b * 2 b/min * 2 min)) * 1.5
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

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

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

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

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

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            it('Consumes only user defined tank', () => {
                expect(airTank.consumed).toEqual(71);
                expect(ean50Tank.consumed).toEqual(0);
            });

            it('Emergency ascent uses all tanks', () => {
                // (2 * 2 * 3) * 3 = 36 // 2 min. problem solving
                expect(airTank.reserve).toEqual(36);
                // 1 min. switch
                // ((1 * 2 * 3) + (2 * 2 * 2)) * 1.5
                expect(ean50Tank.reserve).toEqual(21);
            });
        });

        describe('Used tank wasn\'t provided to update consumption', () => {
            const airTank = new Tank(10, 200, 21);
            airTank.reserve = 200;
            const ean50Tank = new Tank(10, 100, 50);
            ean50Tank.reserve = 100;
            const tanks = [ean50Tank];

            const profile = [
                new Segment(0, 20, airTank.gas, Time.oneMinute),
                new Segment(20, 20, airTank.gas, 10 * Time.oneMinute),
                new Segment(20, 0, airTank.gas, 2 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            it('No tank is updated', () => {
                expect(airTank.consumed).toEqual(0);
                expect(ean50Tank.consumed).toEqual(0);
            });

            it('Reserve is not touched', () => {
                expect(airTank.reserve).toEqual(200); // not touched
                expect(ean50Tank.reserve).toEqual(30);
            });
        });

        describe('1. tank air, 2. ean50, 3. ean50 - reserve from both tanks', () => {
            const airTank = new Tank(20, 200, 21);
            const ean50Tank = new Tank(5, 30, 50);
            const ean50Tank2 = new Tank(5, 50, 50);
            const tanks = [airTank, ean50Tank, ean50Tank2];

            const profile = [
                new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),
                new Segment(30, 30, airTank.gas, 15 * Time.oneMinute),  // air relevant only during ascent
                new Segment(30, 20, airTank.gas, 2 * Time.oneMinute),   // ascent not relevant for emergency
                new Segment(20, 20, ean50Tank.gas, 1 * Time.oneMinute),
                new Segment(20, 0, ean50Tank.gas, 10 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            it('Reserve is updated from both EAN50 tanks', () => {
                // ((4b * 2 * 1) + (3.5b * 1 min * 1 b/min.)) * 3
                expect(airTank.reserve).toEqual(33);
                // total: ((3b * 4 bar/min * 1 min) + (2 b * 4 bar/min * 2 min)) * 1.5 = 45 b
                expect(ean50Tank.reserve).toEqual(30);   // full tank as first in order
                expect(ean50Tank2.reserve).toEqual(14);
            });
        });

        describe('User switch at ascent start to identical gas', () => {
            const airTank = new Tank(20, 100, 21);
            const airTank2 = new Tank(5, 200, 21);
            const ean50Tank = new Tank(5, 200, 50);
            const tanks = [airTank, airTank2, ean50Tank];

            const profile = [
                new Segment(0, 30, airTank, 2 * Time.oneMinute),
                new Segment(30, 30, airTank, 29 * Time.oneMinute),
                new Segment(30, 30, airTank2, 1 * Time.oneMinute),      // user switch to the same gas
                new Segment(30, 20, airTank2, 10 * Time.oneMinute),
                new Segment(20, 0, ean50Tank.gas, 11 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            // Emergency ascent: 30-20 600, 20-20 60, 20-3 102, 3-3 549, 3-0 18
            it('Reserve is updated from both EAN50 tanks', () => {
                expect(airTank.reserve).toEqual(101);
                expect(airTank2.reserve).toEqual(109); // the same gas, still team reserve used
                expect(ean50Tank.reserve).toEqual(112);
            });
        });

        describe('User switch at ascent start to different gas', () => {
            const ean32Tank = new Tank(20, 100, 32);
            const airTank = new Tank(5, 200, 21);
            const ean50Tank = new Tank(5, 200, 50);
            const tanks = [ean32Tank, airTank, ean50Tank];

            const profile = [
                new Segment(0, 30, ean32Tank, 2 * Time.oneMinute),
                new Segment(30, 30, ean32Tank, 29 * Time.oneMinute),
                new Segment(30, 30, airTank, 1 * Time.oneMinute),      // user switch to the same gas
                new Segment(30, 20, airTank.gas, 10 * Time.oneMinute),
                new Segment(20, 0, ean50Tank.gas, 11 * Time.oneMinute)
            ];

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            // Emergency ascent: 30-30 120, 30-21 54, 21-21 60, 21-3 108, 3-3 4, 3-0 18
            it('Reserve is updated from both EAN50 tanks', () => {
                // ean32Tank handled as stage, since bottom tank is considered airTank
                expect(ean32Tank.reserve).toEqual(11); // minimum reserve 0 b from options
                expect(airTank.reserve).toEqual(95); // the same gas, still team reserve used
                expect(ean50Tank.reserve).toEqual(45);
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

            const descent = new Segment(0, 20, ean50Tank, 2 * Time.oneMinute); // ean50 2b * 2 bar/min * 2 minute = 8b
            const swim = new Segment(20, 20, airTank, 20 * Time.oneMinute);  // 3 b * 1 b/min * 20 min = 60b

            const profile = [
                descent,
                swim,
                new Segment(20, 0, ean50Tank2.gas, 4 * Time.oneMinute),   // 2 b * 2 bar/min * 4 minute = 16b
            ];

            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

            it('Gas is Consumed from required tank', () => {
                expect(airTank.consumed).toEqual(59); // user defined by swim segment
                expect(airTank2.consumed).toEqual(0); // not touched
                expect(ean50Tank.consumed).toEqual(8); // user defined by descent segment
                expect(ean50Tank2.consumed).toEqual(16); // ascent has chosen consume from last in the list
            });

            it('Reserve is not relevant to assigned tanks', () => {
                // minimum reserve always present for first tank includes problem solving
                expect(airTank.reserve).toEqual(30);
                expect(airTank2.reserve).toEqual(0); // not used
                // 1 minute gas switch to the Ean50 + 2 min. ascent
                // ((1 * 2 * 3) + (2 * 2 * 2)) * 1.5 => 21
                expect(ean50Tank.reserve).toEqual(21); // used during ascent as rock bottom
                expect(ean50Tank2.reserve).toEqual(0); // not used
            });
        });

        describe('Single user defined tank', () => {
            it('Not all segments assigned, consumed more than available', () => {
                const airTank = new Tank(20, 100, 21);
                const tanks = [airTank];

                const descent = new Segment(0, 20, airTank, 2 * Time.oneMinute); // 2 b * 1 bar/min * 2 minute = 4b
                const swim = new Segment(20, 20, airTank, 40 * Time.oneMinute);  // 3 b * 1 b/min * 40 min = 120b

                const profile = [
                    descent,
                    swim,
                    new Segment(20, 0, airTank.gas, 4 * Time.oneMinute),   // 2 b * 1 bar/min * 4 minute = 8b
                ];

                consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

                expect(airTank.reserve).toEqual(30); // ((3 * 2 * 1) + (2.5 * 2 * 1)) * 3
                expect(airTank.consumed).toEqual(101); // up to the limit
            });

            it('All segments assigned tank, consumed more than available', () => {
                const options3 = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
                options3.problemSolvingDuration = 2;

                const airTank = new Tank(20, 100, 21);
                const tanks = [airTank];

                const descent = new Segment(0, 20, airTank, 2 * Time.oneMinute); // 2 b * 1 bar/min * 2 minute = 4b
                const swim = new Segment(20, 20, airTank, 40 * Time.oneMinute);  // 3 b * 1 b/min * 40 min = 120b
                const ascent = new Segment(20, 0, airTank, 4 * Time.oneMinute);   // 2 b * 1 bar/min * 4 minute = 8b

                const profile = [descent, swim, ascent];
                consumption.consumeFromTanks(profile, options3, tanks, consumptionOptions);

                expect(airTank.reserve).toEqual(42); // 3 min at 3 m + 2 min. solving
                expect(airTank.consumed).toEqual(101); // up to the limit
            });

            it('All segments assigned tank, partially consumed', () => {
                const airTank = new Tank(20, 100, 21);
                const tanks = [airTank];

                const descent = new Segment(0, 20, airTank, 2 * Time.oneMinute); // 2 b * 1 bar/min * 2 minute = 4b
                const swim = new Segment(20, 20, airTank, 20 * Time.oneMinute);  // 3 b * 1 b/min * 20 min = 60b
                const ascent = new Segment(20, 0, airTank, 4 * Time.oneMinute);   // 2 b * 1 bar/min * 4 minute = 8b

                const profile = [descent, swim, ascent];
                consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);

                expect(airTank.reserve).toEqual(42); // 3 min at 3 m + 2 min. solving
                expect(airTank.consumed).toEqual(71); // up to the limit
            });
        });
    });

    describe('User defined ascent', () => {
        it('Plan ends at surface', () => {
            const tank = new Tank(10, 200, 21);
            const tanks = [tank];

            const first = new Segment(0, 10, tank, Time.oneMinute * 10);
            const second = new Segment(10, 0, tank, Time.oneMinute * 10);
            const segments = [first, second];
            // 1.5 * 20 * 2 = 60

            consumption.consumeFromTanks(segments, options2, tanks, consumptionOptions);
            expect(tank.consumed).toEqual(60);
            // emergency ascent: ((2 * 2 * 2) + (1.5 * 10 * 2)) * 3 = 33
            expect(tank.reserve).toEqual(114);
        });

        it('As part of ascent counts to rock bottom', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2];

            const first = new Segment(0, 40, tank1, Time.oneMinute * 4); // 3 * 4 * 1 = 12
            const second = new Segment(40, 40, tank1, Time.oneMinute * 13); // 5 * 13 * 1 = 65
            const third = new Segment(40, 6, tank1, Time.oneMinute * 10); // 3,3 * 10 * 1 = 33
            const safety = new Segment(6, 6, tank2, Time.oneMinute * 8); // 1,6 * 8 * 2 = 25,6
            const ascent = new Segment(6, 0, tank2, Time.oneMinute * 2); // 1,3 * 2 * 2 = 5,2
            const segments = [first, second, third, safety, ascent];

            // currently tank1 30/90,  tank2 112/169 (reserve/remaining)
            // should be tank1 129/90, tank2 94/169
            consumption.consumeFromTanks(segments, options2, tanks, consumptionOptions);
            // ((5 * 2 * 1) + (3,3 * 10 * 1)) * 3
            expect(tank1.reserve).toEqual(129);
            // ((1,6 * 8 * 2 = 25,6) + (1,3 * 2 * 2 = 5,20)) * 1.5
            expect(tank2.reserve).toEqual(46);
        });

        it('Shallower, than deeper - last deepest point used for emergency ascent', () => {
            const tank1 = new Tank(20, 200, 21);
            const tanks = [tank1];

            const profile = [
                new Segment(0, 20, tank1.gas, Time.oneMinute * 2),
                new Segment(20, 20, tank1.gas, Time.oneMinute * 10),
                new Segment(20, 10, tank1.gas, Time.oneMinute * 1),
                new Segment(10, 10, tank1.gas, Time.oneMinute * 10),
                new Segment(10, 30, tank1.gas, Time.oneMinute * 2),
                new Segment(30, 30, tank1.gas, Time.oneMinute * 2),
                new Segment(30, 10, tank1.gas, Time.oneMinute * 2),  // 3 * 1 * 2 = 6
                new Segment(10, 10, tank1.gas, Time.oneMinute * 10), // 2 * 1 * 10 = 20
                new Segment(10, 0, tank1.gas, Time.oneMinute * 1)    // 1.5 * 1 * 1 = 1.5
            ];

            // reserve - ascent from 6. segment = ((4 bar * 1 bar/min * 2 min) + (2.5 b * 1 bar/min * 3 min)) * 3
            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);
            expect(tank1.reserve).toEqual(46);
        });

        it('The same deep depths - last deepest point used for emergency ascent', () => {
            const tank1 = new Tank(20, 200, 21);
            const tanks = [tank1];

            const profile = [
                new Segment(0, 20, tank1.gas, Time.oneMinute * 2),
                new Segment(20, 20, tank1.gas, Time.oneMinute * 10),
                new Segment(20, 10, tank1.gas, Time.oneMinute * 1),
                new Segment(10, 10, tank1.gas, Time.oneMinute * 10),
                new Segment(10, 20, tank1.gas, Time.oneMinute * 1),
                new Segment(20, 20, tank1.gas, Time.oneMinute * 10),
                new Segment(20, 10, tank1.gas, Time.oneMinute * 1),  // 2.5 * 1 * 1 =2.5
                new Segment(10, 10, tank1.gas, Time.oneMinute * 10), // 2 * 1 * 10 = 20
                new Segment(10, 0, tank1.gas, Time.oneMinute * 1)   // 1.5 * 1 * 1 = 1.5
            ];

            // reserve - ascent from 6. segment = ((3 b * 1 bar/min * 2 min) + (2 b * 1 bar/min * 2 min)) * 3
            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);
            expect(tank1.reserve).toEqual(30);
        });

        it('Deeper, than shallower - last segment in depth is used for reserve', () => {
            const tank1 = new Tank(20, 200, 21);
            const tanks = [tank1];

            const profile = [
                new Segment(0, 30, tank1.gas, Time.oneMinute * 3),
                new Segment(30, 30, tank1.gas, Time.oneMinute * 10), // reserve count from emergency ascent here
                new Segment(30, 10, tank1.gas, Time.oneMinute * 1),
                new Segment(10, 10, tank1.gas, Time.oneMinute * 10),
                new Segment(10, 20, tank1.gas, Time.oneMinute * 1),
                new Segment(20, 20, tank1.gas, Time.oneMinute * 10),
                new Segment(20, 0, tank1.gas, Time.oneMinute * 3)
            ];

            // reserve - ascent from 2. segment
            // ((4 b * 2 min * 1 bar/min) + (2.5 b * 3 min * 1 bar/min)) * 3
            consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);
            expect(tank1.reserve).toEqual(46);
        });

        // TODO hidden to user: From which point to calculate rock bottom and subtract it before strategy is calculated?
        //    - 1/2 usable strategy
        //    - 1/3 usable strategy

        describe('Multiple tanks with the same gas', () => {
            // Multiple tanks of the same gas, reserve is counted form first bellow reserve and second tank is not utilized
            it('reserve counts always from first tank', () => {
                // The same as 'As part of ascent counts to rock bottom', but different 02 content in second tank
                const tank1 = new Tank(20, 200, 21);
                const tank2 = new Tank(10, 200, 21);
                const tanks = [tank1, tank2];

                const s1 = new Segment(0, 40, tank1, Time.oneMinute * 4);
                const s2 = new Segment(40, 40, tank1, Time.oneMinute * 13);
                const s3 = new Segment(40, 6, tank1, Time.oneMinute * 10);
                // next segments don't have tank assigned, so the first one still will be used
                // ascent counts with stop at 3m even user defined in 6 m
                const s4 = new Segment(6, 6, tank1.gas, Time.oneMinute * 8);
                const s5 = new Segment(6, 0, tank1.gas, Time.oneMinute * 2);
                const profile = [s1, s2, s3, s4, s5];

                consumption.consumeFromTanks(profile, options2, tanks, consumptionOptions);
                // custom ascent is calculated, since no used defined tank was used during ascent
                // 40n 120s, 40-6 600s, 6-3 18s, 3-3 285, 3-0 18
                expect(tank1.reserve).toEqual(151);
                expect(tank2.reserve).toEqual(0);
            });

            describe('user defined tanks', () => {
                const tank1 = new Tank(20, 200, 21);
                const tank2 = new Tank(10, 200, 21);
                const tanks = [tank1, tank2];

                const s1 = new Segment(0, 40, tank1, Time.oneMinute * 4); // 3 * 4 * 1 = 12
                const s2 = new Segment(40, 40, tank1, Time.oneMinute * 13); // 5 * 13 * 1 = 65
                const s3 = new Segment(40, 6, tank1, Time.oneMinute * 10); // 3,3 * 10 * 1 = 33
                const s4 = new Segment(6, 6, tank2, Time.oneMinute * 8); // 1.6 * 8 * 2 = 25.6
                const s5 = new Segment(6, 0, tank2, Time.oneMinute * 2); // 1.3 * 2 * 2 = 5.2
                const segments = [s1, s2, s3, s4, s5];

                consumption.consumeFromTanks(segments, options2, tanks, consumptionOptions);

                it('counts the consumption', () => {
                    expect(tank1.consumed).toEqual(109);
                    expect(tank2.consumed).toEqual(31);
                });

                it('counts the reserve', () => {
                    // Because of user defined tanks during ascent
                    expect(tank1.reserve).toEqual(179);
                    expect(tank2.reserve).toEqual(0);
                });
            });
        });
    });
});
