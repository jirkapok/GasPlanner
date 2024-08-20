import { Tank } from './Tanks';
import { Segment } from './Segments';
import { Time } from './Time';
import { StandardGases } from './StandardGases';
import { Consumption, ConsumptionOptions } from './consumption';
import { Diver } from './Diver';
import { DepthConverter } from './depth-converter';
import { OptionExtensions } from './Options.spec';
import { Salinity } from './pressure-converter';
import { SafetyStop } from './Options';

describe('Consumption - Preserve reserved gas', ()=> {
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: 40,
        stageTankReserve: 25
    };

    const consumption = new Consumption(DepthConverter.forFreshWater());
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options.safetyStop = SafetyStop.never;
    options.problemSolvingDuration = 2;

    // For larger reserve we need deep dives, which cause long emergency ascent

    xdescribe('Enough gas', () => {
        describe('Custom minimum tank reserve is applied', () => {
            let tank1: Tank, tank2: Tank, tank3: Tank;

            beforeEach(() => {
                tank1 = new Tank(20, 200, 21);
                tank2 = new Tank(10, 200, 21);
                tank3 = new Tank(10, 200, 21);
                const tanks = [tank1, tank2, tank3];

                // short dive, practically without reserve
                const s1 = new Segment(0, 5, tank1, Time.oneMinute);
                const s2 = new Segment(5, 5, tank1, Time.oneMinute * 10);
                const s3 = new Segment(5, 0, tank2, Time.oneMinute);
                const segments = [s1, s2, s3];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('First tank', () => {
                expect(tank1.reserve).toEqual(consumptionOptions.primaryTankReserve);
            });

            it('All other stage tanks', () => {
                expect(tank2.reserve).toEqual(consumptionOptions.stageTankReserve);
                expect(tank3.reserve).toEqual(consumptionOptions.stageTankReserve);
            });
        });

        describe('Consumed less than all tanks reserve applies minimal reserve', () => {
            let tank1: Tank, tank2: Tank, tank3: Tank, tank4: Tank;

            beforeEach(() => {
                tank1 = new Tank(20, 200, 21);
                tank2 = new Tank(10, 200, 50);
                tank3 = new Tank(10, 200, 50);
                tank4 = new Tank(10, 200, 50);
                const tanks = [tank1, tank2, tank3, tank4];

                const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
                const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
                const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
                const s4 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute);
                const segments = [s1, s2, s3, s4];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('Short dive, minimum consumed', () => {
                expect(tank2.consumed).toEqual(0); // start pressure, whole tank reserve
                expect(tank3.consumed).toEqual(0); // calculated reserve
                expect(tank4.consumed).toEqual(4); // minimal reserve
            });

            it('Stage tanks consumed from last', () => {
                expect(tank2.reserve).toEqual(200); // start pressure, whole tank reserve
                expect(tank3.reserve).toEqual(105); // calculated reserve
                expect(tank4.reserve).toEqual(25); // minimal reserve
            });
        });

        describe('Consumed more than one tank respects reserve', () => {
            let tank1: Tank, tank2: Tank, tank3: Tank, tank4: Tank;

            beforeEach(() => {
                tank1 = new Tank(20, 200, 21);
                tank2 = new Tank(10, 200, 50);
                tank3 = new Tank(10, 200, 50);
                tank4 = new Tank(10, 200, 50);
                const tanks = [tank1, tank2, tank3, tank4];

                const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
                const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
                const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
                const s4 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 40); // 240 b
                const s5 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
                const segments = [s1, s2, s3, s4, s5];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('Stage tanks consumed', () => {
                // in total 242 bar consumed
                expect(tank2.consumed).toEqual(0);
                expect(tank3.consumed).toEqual(67);  // 242 - 175
                expect(tank4.consumed).toEqual(175); // 200 - minimal reserve 25 b
                // the same emergency reserve as above (200, 105, 25)
            });
        });
    });

    xdescribe('Respects user defined consumption', () => {
        let tank1: Tank, tank2: Tank, tank3: Tank, tank4: Tank;

        beforeEach(() => {
            tank1 = new Tank(20, 200, 21);
            tank2 = new Tank(10, 200, 50);
            tank3 = new Tank(10, 200, 50);
            tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
            const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
            const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, tank2, Time.oneMinute * 10); // 60 b
            const s5 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 30); // 180 b
            const s6 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5, s6];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
        });

        it('Consumes up to reserve respecting what user already consumed', () => {
            expect(tank2.consumed).toEqual(60);
            expect(tank3.consumed).toEqual(67);
            expect(tank4.consumed).toEqual(175);
            // the same emergency reserve as above (200, 105, 25)
        });
    });

    xdescribe('Not enough gas', () => {
        describe('Consumed more than one tank reserve', () => {
            let tank1: Tank, tank2: Tank, tank3: Tank, tank4: Tank;

            beforeEach(() => {
                tank1 = new Tank(20, 200, 21);
                tank2 = new Tank(10, 200, 50);
                tank3 = new Tank(10, 200, 50);
                tank4 = new Tank(10, 200, 50);
                const tanks = [tank1, tank2, tank3, tank4];

                const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
                const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
                const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
                const s4 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 47); // 282 b
                const s5 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
                const segments = [s1, s2, s3, s4, s5];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('Consumed also from last tank reserve', () => {
                // in total 600 b, 330 b rserve, consumed cca 284 b
                expect(tank2.consumed).toEqual(0); // 200 - 0
                expect(tank3.consumed).toEqual(95); // 200 - 105
                // crossed reserve, subtracted even from reserve
                expect(tank4.consumed).toEqual(187); // 330 -295
                // the same emergency reserve as above (200, 105, 25)
            });
        });

        describe('Reserve respects user defined consumption', () => {
            let tank1: Tank, tank2: Tank, tank3: Tank, tank4: Tank;

            beforeEach(() => {
                tank1 = new Tank(20, 200, 21);
                tank2 = new Tank(10, 200, 50);
                tank3 = new Tank(10, 200, 50);
                tank4 = new Tank(10, 200, 50);
                const tanks = [tank1, tank2, tank3, tank4];

                const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
                const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
                const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
                const s4 = new Segment(20, 20, tank2, Time.oneMinute * 10); // 60 b
                const s5 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 47); // 222 b
                const s6 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
                const segments = [s1, s2, s3, s4, s5, s6];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('Consumes reserve respecting what user already consumed', () => {
                expect(tank2.consumed).toEqual(60);
                expect(tank3.consumed).toEqual(95);
                expect(tank4.consumed).toEqual(187);
                // the same emergency reserve as above (200, 105, 25)
            });
        });

        describe('All tanks reserve consumed', () => {
            let tank1: Tank, tank2: Tank, tank3: Tank, tank4: Tank;

            beforeEach(() => {
                tank1 = new Tank(20, 200, 21);
                tank2 = new Tank(10, 200, 50);
                tank3 = new Tank(10, 200, 50);
                tank4 = new Tank(10, 200, 50);
                const tanks = [tank1, tank2, tank3, tank4];

                const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
                const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
                const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
                const s4 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 110); // 660 b
                const s5 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
                const segments = [s1, s2, s3, s4, s5];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('Everything consumed, even reserve', () => {
                expect(tank2.consumed).toEqual(200);
                expect(tank3.consumed).toEqual(200);
                expect(tank4.consumed).toEqual(200);
                // the same emergency reserve as above (200, 105, 25)
            });
        });
    });
});


// Implementation idea:
// 1. First calculate reserve for all tanks
// 2. Subtract gas up to reserve from all tanks
// 3. Still remaining gas - subtract from reserve
