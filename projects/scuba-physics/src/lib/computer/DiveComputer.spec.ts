import { AlgorithmParams, RestingParameters } from '../algorithm/BuhlmannAlgorithmParameters';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { OptionExtensions } from '../algorithm/Options.spec';
import { ProfileEvents } from '../algorithm/ProfileEvents';
import { Segments } from '../depths/Segments';
import { GasDensity } from '../gases/GasDensity';
import { Gas, Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { ComputerEventType, GasSwitchEvent } from './ComputerData';
import { CalculatedDive, DiveComputer } from './DiveComputer';

describe('DiveComputer', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    const air = StandardGases.air;
    const algorithm = new BuhlmannAlgorithm();

    const diveFor = (fill: (segments: Segments) => void, gases: Gas[] = [air], surface?: RestingParameters): AlgorithmParams => {
        const allGases = new Gases();
        gases.forEach(g => allGases.add(g));
        const segments = new Segments();
        fill(segments);
        return AlgorithmParams.forMultilevelDive(segments, allGases, options, OptionExtensions.openCircuit(options), surface);
    };

    /** Calculates the dive the same way as the planner does: profile, ceilings and all events */
    const calculateDive = (dive: AlgorithmParams, surface?: RestingParameters): CalculatedDive => {
        const profile = algorithm.decompression(dive).segments;
        const calculatedSegments = Segments.fromCollection(profile);
        const calculatedDive = AlgorithmParams.forMultilevelDive(calculatedSegments, dive.gases, dive.options, dive.breathing, surface);
        const ceilings = algorithm.decompressionStatistics(calculatedDive).ceilings;
        const events = ProfileEvents.fromProfile({
            maxDensity: GasDensity.recommendedMaximum,
            startAscentIndex: calculatedSegments.startAscentIndex,
            profile: profile,
            ceilings: ceilings,
            profileOptions: dive.options,
            breathing: dive.breathing
        }).items;

        return {
            dive: dive,
            profile: profile,
            ceilings: ceilings,
            events: events
        };
    };

    const fortyMetersFor30Minutes = (segments: Segments): void => {
        segments.add(40, air, Time.oneMinute * 2);
        segments.addFlat(air, Time.oneMinute * 28);
    };

    // user defined plan takes 30 min, calculated ascent with decompression stops follows
    const decoDive = diveFor(fortyMetersFor30Minutes);
    const calculatedDecoDive = calculateDive(decoDive);
    const userPlanEnd = Time.oneMinute * 30;

    it('Creates point for every second of the calculated profile', () => {
        const duration = calculatedDecoDive.profile.reduce((sum, s) => sum + s.duration, 0);
        const data = DiveComputer.calculate(calculatedDecoDive);
        expect(data.profile.length).toEqual(Math.floor(duration) + 1);
        expect(DiveComputer.start(calculatedDecoDive).total).toEqual(data.profile.length);
    });

    it('Points are sampled from the calculated dive', () => {
        const profile = DiveComputer.calculate(calculatedDecoDive).profile;
        expect(profile[0].depth).toBeCloseTo(0, 6);
        expect(profile[profile.length - 1].maxDepth).toBeCloseTo(40, 6);
        expect(profile.some(p => p.ceiling > 0)).toBeTrue();
    });

    it('Contains stops of the calculated ascent only', () => {
        const stops = DiveComputer.calculate(calculatedDecoDive).events.filter(e => e.type === ComputerEventType.stop);
        expect(stops.length).toBeGreaterThan(0);
        expect(stops.every(s => s.runTime >= userPlanEnd)).toBeTrue();
    });

    it('User planned stop with close ceiling is a stop', () => {
        // user defines own stop at 6 m right after the bottom, ascent 34 m in 204 s
        const withUserStop = diveFor(s => {
            fortyMetersFor30Minutes(s);
            s.add(6, air, 204);
            s.addFlat(air, Time.oneMinute * 10);
        });
        const userStopStart = userPlanEnd + 204;
        const stops = DiveComputer.calculate(calculateDive(withUserStop)).events.filter(e => e.type === ComputerEventType.stop);
        expect(stops.some(s => s.runTime === userStopStart && s.depth === 6)).toBeTrue();
    });

    it('Contains gas switch events', () => {
        const withDecoGas = calculateDive(diveFor(fortyMetersFor30Minutes, [air, StandardGases.ean50]));
        const switches = DiveComputer.calculate(withDecoGas).events
            .filter((e): e is GasSwitchEvent => e.type === ComputerEventType.gasSwitch);
        expect(switches.map(s => s.gasName)).toContain('EAN50');
    });

    it('Too fast ascent creates high ascent speed warning', () => {
        // 40 m/min from 30 m to 10 m
        const fastAscent = diveFor(s => {
            s.add(30, air, Time.oneMinute * 2);
            s.addFlat(air, Time.oneMinute * 10);
            s.add(10, air, Time.oneMinute / 2);
        });
        const events = DiveComputer.calculate(calculateDive(fastAscent)).events;
        expect(events.some(e => e.type === ComputerEventType.highAscentSpeed && e.runTime === Time.oneMinute * 12 && e.depth === 30))
            .toBeTrue();
    });

    it('Calculated ascent has no high ascent speed warning', () => {
        const events = DiveComputer.calculate(calculatedDecoDive).events;
        expect(events.some(e => e.type === ComputerEventType.highAscentSpeed)).toBeFalse();
    });

    it('Points contain calculated no decompression limit', () => {
        const limits = algorithm.noDecoLimits(decoDive);
        const profile = DiveComputer.calculate(calculatedDecoDive).profile;
        expect(profile[0].ndl).toEqual(limits[0]);
        expect(profile[200].ndl).toEqual(limits[200]);
        expect(profile[200].ndl).toBeGreaterThan(0);
    });

    it('Events and count of points are known before the points are calculated', () => {
        const computer = DiveComputer.start(calculatedDecoDive);
        expect(computer.events.length).toBeGreaterThan(0);
        expect(computer.total).toBeGreaterThan(0);
    });

    it('Points can be iterated repeatedly without changing already provided points', () => {
        const computer = DiveComputer.start(calculatedDecoDive);
        const first = Array.from(computer.points());
        const ndlBefore = first[200].ndl;
        const second = Array.from(computer.points());
        expect(ndlBefore).toBeGreaterThan(0);
        expect(second.length).toEqual(first.length);
        expect(second[200].ndl).toEqual(ndlBefore);
        expect(first[200].ndl).toEqual(ndlBefore);
    });

    it('Points are provided one by one', () => {
        const first = DiveComputer.start(calculatedDecoDive).points().next();
        const point = first.done ? undefined : first.value;
        expect(point?.runTime).toEqual(0);
    });

    it('Next stop points to the stop event', () => {
        const data = DiveComputer.calculate(calculatedDecoDive);
        const withStop = data.profile.find(p => p.nextStop !== undefined);
        expect(withStop).toBeDefined();
        expect(data.events.some(e => e === withStop?.nextStop)).toBeTrue();
    });

    it('Repetitive dive has shorter no decompression limit', () => {
        const firstDive = diveFor(s => {
            s.add(30, air, Time.oneMinute * 2);
            s.addFlat(air, Time.oneMinute * 20);
        });
        const surface = new RestingParameters(algorithm.decompression(firstDive).finalTissues, Time.oneHour);
        const shallowDive = (segments: Segments): void => {
            segments.add(20, air, Time.oneMinute);
            segments.addFlat(air, Time.oneMinute * 10);
        };
        const first = DiveComputer.calculate(calculateDive(diveFor(shallowDive)));
        const repetitive = DiveComputer.calculate(calculateDive(diveFor(shallowDive, [air], surface), surface));
        expect(repetitive.profile[120].ndl).toBeLessThan(first.profile[120].ndl);
    });

    it('Empty profile has no points and events', () => {
        const computer = DiveComputer.start({ dive: decoDive, profile: [], ceilings: [], events: [] });
        expect(computer.total).toEqual(0);
        expect(computer.events).toEqual([]);
        expect(Array.from(computer.points())).toEqual([]);
    });
});
