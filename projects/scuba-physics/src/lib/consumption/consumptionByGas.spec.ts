import { Diver } from './Diver';
import { DepthConverter } from '../physics/depth-converter';
import { Tank } from './Tanks';
import { Consumption } from './consumption';
import { ConsumptionOptions } from './consumptionCommon';
import { ConsumedGas, ConsumptionByGas } from './consumptionByGas';
import { Time } from '../physics/Time';
import { Segment } from '../depths/Segments';
import { PlanFactory } from '../depths/PlanFactory';
import { OptionExtensions } from '../algorithm/Options.spec';
import { SafetyStop } from '../algorithm/Options';
import { Salinity } from '../physics/pressure-converter';
import { Precision } from '../common/precision';
import { StandardGases } from '../gases/StandardGases';

interface Calculated {
    gases: ConsumedGas[];
    emergencyAscent: Segment[];
}

describe('Consumption by gas', () => {
    const rmv = 20;
    const depthConverter = DepthConverter.forFreshWater();
    // no minimal tank reserves, so the tank based reserve is the emergency ascent only
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(rmv),
        primaryTankReserve: 0,
        stageTankReserve: 0
    };
    const sut = new ConsumptionByGas(depthConverter);
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options.safetyStop = SafetyStop.never;
    options.problemSolvingDuration = 2;

    /** Independent liters calculation using diver rmv */
    const litersOf = (segments: Segment[]): number => segments.reduce((sum, s) => {
        const minutes = Time.toMinutes(Precision.roundTwoDecimals(s.duration));
        return sum + minutes * depthConverter.toBar(s.averageDepth) * rmv;
    }, 0);

    // Emergency ascent is calculated only once per profile, because it isn't stable for repeated calls with the same profile.
    const calculate = (profile: Segment[], tanks: Tank[]): Calculated => {
        const emergencyAscent = PlanFactory.emergencyAscent(profile, options, tanks);
        const gases = sut.consume(profile, emergencyAscent, tanks, consumptionOptions);
        return { gases, emergencyAscent };
    };

    /** Reference values from the tank based consumption, valid only, if there is enough gas in all tanks */
    const tankReference = (profile: Segment[], calculated: Calculated, tanks: Tank[]): void => {
        new Consumption(depthConverter).consumeFromTanks2(profile, calculated.emergencyAscent, tanks, consumptionOptions);
    };

    const sumOf = (tanks: Tank[], volume: (t: Tank) => number): number => tanks.reduce((sum, t) => sum + volume(t), 0);

    const expectEnoughGas = (consumed: ConsumedGas): void => {
        expect(consumed.hasReserve).toBeTrue();
        expect(consumed.scale).toBeCloseTo(consumed.total, 6);
        expect(consumed.percentsAvailable).toBeCloseTo(100, 6);
        expect(consumed.percentsRequired).toBeLessThan(100);
    };

    describe('One tank for whole dive', () => {
        const createTanks = () => [new Tank(15, 200, 21)];
        const tanks = createTanks();
        const tank = tanks[0];
        const profile = [
            new Segment(0, 20, tank.gas, Time.oneMinute),
            new Segment(20, 20, tank.gas, 10 * Time.oneMinute),
            new Segment(20, 0, tank.gas, 2 * Time.oneMinute)
        ];
        const calculated = calculate(profile, tanks);
        const result = calculated.gases;

        it('Creates single gas', () => {
            expect(result.length).toEqual(1);
            expect(result[0].gas.compositionEquals(tank.gas)).toBeTrue();
        });

        it('Available is tank volume', () => {
            expect(result[0].total).toBeCloseTo(tank.volume, 6);
        });

        it('Consumed is all liters of the profile', () => {
            expect(result[0].consumed).toBeCloseTo(litersOf(profile), 6);
        });

        it('Consumed and reserve equal tank based consumption', () => {
            const referenceTanks = createTanks();
            tankReference(profile, calculated, referenceTanks);
            expect(result[0].consumed).toBeCloseTo(referenceTanks[0].consumedVolume, 6);
            expect(result[0].reserve).toBeGreaterThan(0);
            expect(result[0].reserve).toBeCloseTo(referenceTanks[0].reserveVolume, 6);
        });

        it('Has enough gas', () => {
            expectEnoughGas(result[0]);
            expect(ConsumptionByGas.haveReserve(result)).toBeTrue();
        });
    });

    describe('Multiple tanks with different gases', () => {
        const createTanks = () => [new Tank(20, 200, 21), new Tank(10, 200, 50)];
        const tanks = createTanks();
        const [airTank, ean50Tank] = tanks;
        const airSegments = [
            new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),
            new Segment(30, 30, airTank.gas, 10 * Time.oneMinute),
            new Segment(30, 20, airTank.gas, 2 * Time.oneMinute)
        ];
        const ean50Segments = [
            new Segment(20, 20, ean50Tank.gas, Time.oneMinute),
            new Segment(20, 0, ean50Tank.gas, Time.oneMinute)
        ];
        const profile = [...airSegments, ...ean50Segments];
        const calculated = calculate(profile, tanks);
        const result = calculated.gases;

        it('Creates one item per gas in order of tanks', () => {
            expect(result.length).toEqual(2);
            expect(result[0].gas.compositionEquals(airTank.gas)).toBeTrue();
            expect(result[1].gas.compositionEquals(ean50Tank.gas)).toBeTrue();
        });

        it('Available is volume of each tank', () => {
            expect(result[0].total).toBeCloseTo(airTank.volume, 6);
            expect(result[1].total).toBeCloseTo(ean50Tank.volume, 6);
        });

        it('Consumed is attributed to the breathed gas only', () => {
            expect(result[0].consumed).toBeCloseTo(litersOf(airSegments), 6);
            expect(result[1].consumed).toBeCloseTo(litersOf(ean50Segments), 6);
        });

        it('Reserve equals tank based emergency ascent reserve', () => {
            const referenceTanks = createTanks();
            tankReference(profile, calculated, referenceTanks);
            expect(result[0].reserve).toBeCloseTo(referenceTanks[0].reserveVolume, 6);
            expect(result[1].reserve).toBeGreaterThan(0);
            expect(result[1].reserve).toBeCloseTo(referenceTanks[1].reserveVolume, 6);
        });

        it('Has enough gas', () => {
            expectEnoughGas(result[0]);
            expectEnoughGas(result[1]);
            expect(ConsumptionByGas.haveReserve(result)).toBeTrue();
        });
    });

    describe('Multiple tanks with the same gas', () => {
        const createTanks = () => [new Tank(20, 200, 21), new Tank(10, 130, 21), new Tank(10, 100, 50)];
        const tanks = createTanks();
        const [airTank, airTank2, ean50Tank] = tanks;
        const airSegments = [
            new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),
            new Segment(30, 30, airTank.gas, 15 * Time.oneMinute),
            new Segment(30, 20, airTank.gas, 2 * Time.oneMinute)
        ];
        const ean50Segments = [
            new Segment(20, 20, ean50Tank.gas, Time.oneMinute),
            new Segment(20, 0, ean50Tank.gas, Time.oneMinute)
        ];
        const profile = [...airSegments, ...ean50Segments];
        const calculated = calculate(profile, tanks);
        const result = calculated.gases;

        it('Creates one item per gas', () => {
            expect(result.length).toEqual(2);
            expect(result[0].gas.compositionEquals(StandardGases.air)).toBeTrue();
            expect(result[1].gas.compositionEquals(ean50Tank.gas)).toBeTrue();
        });

        it('Available is sum of all tanks with the same gas', () => {
            expect(result[0].total).toBeCloseTo(airTank.volume + airTank2.volume, 6);
            expect(result[1].total).toBeCloseTo(ean50Tank.volume, 6);
        });

        it('Consumed is accumulated regardless of tanks', () => {
            expect(result[0].consumed).toBeCloseTo(litersOf(airSegments), 6);
            expect(result[1].consumed).toBeCloseTo(litersOf(ean50Segments), 6);
        });

        it('Consumed and reserve equal sum of tank based values of the same gas', () => {
            const referenceTanks = createTanks();
            tankReference(profile, calculated, referenceTanks);
            const airTanks = referenceTanks.slice(0, 2);
            expect(result[0].consumed).toBeCloseTo(sumOf(airTanks, t => t.consumedVolume), 6);
            expect(result[0].reserve).toBeCloseTo(sumOf(airTanks, t => t.reserveVolume), 6);
            expect(result[1].reserve).toBeCloseTo(referenceTanks[2].reserveVolume, 6);
        });

        it('Has enough gas', () => {
            expectEnoughGas(result[0]);
            expectEnoughGas(result[1]);
        });
    });

    describe('Multiple tanks available gas is less than reserve', () => {
        const createProfile = (bottomGas: Tank, decoGas: Tank) => [
            new Segment(0, 40, bottomGas.gas, 2 * Time.oneMinute),
            new Segment(40, 40, bottomGas.gas, 20 * Time.oneMinute),
            new Segment(40, 21, bottomGas.gas, 2 * Time.oneMinute),
            new Segment(21, 0, decoGas.gas, 3 * Time.oneMinute)
        ];

        const smallTanks = [new Tank(1, 20, 21), new Tank(1, 10, 50)];
        const smallProfile = createProfile(smallTanks[0], smallTanks[1]);
        const result = calculate(smallProfile, smallTanks).gases;

        it('Reserve is higher than available', () => {
            expect(result[0].reserve).toBeGreaterThan(result[0].total);
            expect(result[1].reserve).toBeGreaterThan(result[1].total);
        });

        it('Reserve is not limited by available gas', () => {
            const largeTanks = [new Tank(24, 200, 21), new Tank(11, 200, 50)];
            const largeProfile = createProfile(largeTanks[0], largeTanks[1]);
            const expected = calculate(largeProfile, largeTanks).gases;
            expect(result[0].reserve).toBeCloseTo(expected[0].reserve, 6);
            expect(result[1].reserve).toBeCloseTo(expected[1].reserve, 6);
        });

        it('Has not enough gas', () => {
            expect(result[0].hasReserve).toBeFalse();
            expect(result[1].hasReserve).toBeFalse();
            expect(ConsumptionByGas.haveReserve(result)).toBeFalse();
        });
    });

    describe('Multiple tanks available gas is less than required volume', () => {
        const airTank = new Tank(10, 50, 21);
        const ean50Tank = new Tank(11, 200, 50);
        const tanks = [airTank, ean50Tank];
        const airSegments = [
            new Segment(0, 30, airTank.gas, 2 * Time.oneMinute),
            new Segment(30, 30, airTank.gas, 30 * Time.oneMinute),
            new Segment(30, 21, airTank.gas, 2 * Time.oneMinute)
        ];
        const ean50Segments = [
            new Segment(21, 0, ean50Tank.gas, 3 * Time.oneMinute)
        ];
        const profile = [...airSegments, ...ean50Segments];
        const result = calculate(profile, tanks).gases;
        const air = result[0];

        it('Consumed is not limited by available gas', () => {
            expect(air.consumed).toBeCloseTo(litersOf(airSegments), 6);
            expect(air.consumed).toBeGreaterThan(air.total);
        });

        it('Chart is scaled by required volume', () => {
            expect(air.required).toBeGreaterThan(air.total);
            expect(air.scale).toBeCloseTo(air.required, 6);
            expect(air.percentsRequired).toBeCloseTo(100, 6);
            expect(air.percentsAvailable).toBeCloseTo(air.total / air.required * 100, 6);
            expect(air.percentsAvailable).toBeLessThan(100);
        });

        it('Only gas with not enough gas is marked', () => {
            expect(air.hasReserve).toBeFalse();
            expectEnoughGas(result[1]);
            expect(ConsumptionByGas.haveReserve(result)).toBeFalse();
        });
    });

    describe('Consumed gas', () => {
        it('Empty values have zero percents', () => {
            const empty = new ConsumedGas(StandardGases.air.copy(), 0, 0, 0);
            expect(empty.percentsAvailable).toEqual(0);
            expect(empty.percentsRequired).toEqual(0);
            expect(empty.percentsConsumed).toEqual(0);
            expect(empty.percentsReserve).toEqual(0);
            expect(empty.hasReserve).toBeTrue();
        });

        it('Required is sum of consumed and reserve', () => {
            const consumed = new ConsumedGas(StandardGases.air.copy(), 3000, 1500, 500);
            expect(consumed.required).toEqual(2000);
        });

        it('Consumed and reserve percents are relative to available', () => {
            const consumed = new ConsumedGas(StandardGases.air.copy(), 4000, 2000, 1000);
            expect(consumed.percentsConsumed).toBeCloseTo(50, 6);
            expect(consumed.percentsReserve).toBeCloseTo(25, 6);
        });

        it('Consumed and reserve percents are relative to required, if more than available', () => {
            const consumed = new ConsumedGas(StandardGases.air.copy(), 1000, 3000, 1000);
            expect(consumed.percentsConsumed).toBeCloseTo(75, 6);
            expect(consumed.percentsReserve).toBeCloseTo(25, 6);
            expect(consumed.percentsConsumed + consumed.percentsReserve).toBeCloseTo(100, 6);
        });
    });

    describe('Validation', () => {
        const tank = new Tank(15, 200, 21);
        const segment = new Segment(0, 20, tank.gas, Time.oneMinute);

        it('Throws for profile shorter than 2 segments', () => {
            expect(() => sut.consume([segment], [segment], [tank], consumptionOptions)).toThrowError();
        });

        it('Throws for empty emergency ascent', () => {
            expect(() => sut.consume([segment, segment], [], [tank], consumptionOptions)).toThrowError();
        });
    });
});
