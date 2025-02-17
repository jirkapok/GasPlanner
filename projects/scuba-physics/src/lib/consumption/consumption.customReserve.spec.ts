import { Tank } from './Tanks';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { StandardGases } from '../gases/StandardGases';
import { Consumption, ConsumptionOptions } from './consumption';
import { Diver } from './Diver';
import { DepthConverter } from '../physics/depth-converter';
import { OptionExtensions } from '../algorithm/Options.spec';
import { Salinity } from '../physics/pressure-converter';
import { SafetyStop } from '../algorithm/Options';

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

    describe('Enough gas', () => {
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
                const s2 = new Segment(60, 60, tank1, Time.oneMinute * 30);
                const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
                const s4 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute);
                const segments = [s1, s2, s3, s4];

                consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);
            });

            it('Short dive, minimum consumed', () => {
                expect(tank2.consumed).toEqual(0); // not used
                expect(tank3.consumed).toEqual(0); // not used
                expect(tank4.consumed).toEqual(4); // ascent to surface
            });

            it('Stage tanks reserve from last', () => {
                expect(tank2.reserve).toEqual(200); // start pressure, whole tank reserve
                expect(tank3.reserve).toEqual(69); // calculated reserve
                expect(tank4.reserve).toEqual(25); // minimal reserve
            });
        });

        it('Consumed more than one tank respects reserve', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tank3 = new Tank(10, 200, 50);
            const tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
            const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
            const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 40); // 240 b
            const s5 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

            // in total 242 bar consumed
            expect(tank2.consumed).toEqual(0);
            expect(tank3.consumed).toEqual(67);  // 242 - 175
            expect(tank4.consumed).toEqual(175); // 200 - minimal reserve 25 b
            // emergency reserve: 200, 105, 25
        });

        it('Respects user defined segments', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tank3 = new Tank(10, 200, 50);
            const tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            // needs to be lower depth then previous tests, because emergency ascent is calculated from here
            const s1 = new Segment(0, 50, tank1, Time.oneMinute * 2);
            const s2 = new Segment(50, 50, tank1, Time.oneMinute * 20);
            const s3 = new Segment(50, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, tank2, Time.oneMinute * 10); // 60 b

            const s5 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 30); // 180 b
            const s6 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5, s6];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

            expect(tank2.consumed).toEqual(60);
            expect(tank3.consumed).toEqual(8);
            expect(tank4.consumed).toEqual(175);
            // emergency reserve: 200, 113, 25
        });
    });

    describe('Not enough gas', () => {
        it('Consumed more than one tank reserve, also from last tank reserve', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tank3 = new Tank(10, 200, 50);
            const tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
            const s2 = new Segment(60, 60, tank1, Time.oneMinute * 32);
            const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 47); // 282 b
            const s5 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

            expect(tank2.consumed).toEqual(0); // 200 - 0
            expect(tank3.consumed).toEqual(104); // 200 - 96
            // crossed reserve, subtracted -5 b even from reserve
            expect(tank4.consumed).toEqual(180); // 284 -104
            // emergency reserve: 200, 96, 25
        });

        it('Reserve respects what user already consumed', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tank3 = new Tank(10, 200, 50);
            const tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
            const s2 = new Segment(60, 60, tank1, Time.oneMinute * 40);
            const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, tank2, Time.oneMinute * 10); // 60 b
            const s5 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 40); // 240 b
            const s6 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5, s6];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

            expect(tank2.consumed).toEqual(60);  // only user defined consumption
            expect(tank3.consumed).toEqual(42);  // remaining 242-200
            expect(tank4.consumed).toEqual(200); // whole tank, since reserve crossed for all tanks
            // emergency reserve: 200, 200, 25
        });

        it('All tanks reserve consumed', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tank3 = new Tank(10, 200, 50);
            const tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            const s1 = new Segment(0, 60, tank1, Time.oneMinute * 2);
            const s2 = new Segment(60, 60, tank1, Time.oneMinute * 20);
            const s3 = new Segment(60, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 110); // 660 b
            const s5 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

            // but needs to consume more than available from all tanks
            expect(tank2.consumed).toEqual(200);
            expect(tank3.consumed).toEqual(200);
            expect(tank4.consumed).toEqual(200);
            // emergency reserve: 200, 105, 25
        });

        it('User segment consumed more than reserve', () => {
            const tank1 = new Tank(20, 200, 21);
            const tank2 = new Tank(10, 200, 50);
            const tank3 = new Tank(10, 200, 50);
            const tank4 = new Tank(10, 200, 50);
            const tanks = [tank1, tank2, tank3, tank4];

            const s1 = new Segment(0, 42, tank1, Time.oneMinute * 2);
            const s2 = new Segment(42, 42, tank1, Time.oneMinute * 50);
            const s3 = new Segment(42, 20, tank1, Time.oneMinute * 4);
            const s4 = new Segment(20, 20, tank3, Time.oneMinute * 15); // 90 b
            const s5 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 40); // 240 b
            const s6 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
            const segments = [s1, s2, s3, s4, s5, s6];

            consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

            expect(tank2.consumed).toEqual(0);   // cant touch because whole tank reserved
            expect(tank3.consumed).toEqual(132); // Remaining to consume 332-200
            expect(tank4.consumed).toEqual(200); // whole tank since reserve crossed
            // emergency reserve: 200, 128, 25
        });
    });

    it('User error, more used than available from one tank', () => {
        const tank1 = new Tank(20, 200, 21);
        const tank2 = new Tank(10, 200, 50);
        const tank3 = new Tank(10, 200, 50);
        const tank4 = new Tank(10, 200, 50);
        const tanks = [tank1, tank2, tank3, tank4];

        const s1 = new Segment(0, 20, tank1, Time.oneMinute * 2);
        const s2 = new Segment(20, 20, tank1, Time.oneMinute * 20);
        const s3 = new Segment(20, 20, tank3, Time.oneMinute * 20); // 120 b
        const s4 = new Segment(20, 20, tank3, Time.oneMinute * 20); // 120 b
        const s5 = new Segment(20, 20, StandardGases.ean50, Time.oneMinute * 40); // 240 b
        const s6 = new Segment(20, 0, StandardGases.ean50, Time.oneMinute); // 2 bar
        const segments = [s1, s2, s3, s4, s5, s6];

        consumption.consumeFromTanks(segments, options, tanks, consumptionOptions);

        expect(tank2.consumed).toEqual(105); // consumed the remaining (480-175-200)
        expect(tank3.consumed).toEqual(200); // user enforced to use whole tank
        expect(tank4.consumed).toEqual(175); // consumed up to reserve
        // emergency reserve: 36, 25, 25
    });
});
