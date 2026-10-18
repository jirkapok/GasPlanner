import { Ceiling, Event, EventsFactory } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { ComputerData, ComputerEvent, ComputerEventType, StopEvent } from './ComputerData';
import { ComputerProfile } from './ComputerProfile';
import { ComputerStop } from './ComputerStop';

describe('ComputerProfile', () => {
    /** Ceilings are sampled every second starting at 1 s */
    const ceilingsFrom = (depths: number[]): Ceiling[] => depths.map((depth, index) => new Ceiling(index + 1, depth));

    /** Ceilings sampled every second starting at 1 s, given by the run time */
    const ceilingsAt = (duration: number, ceilingAt: (runTime: number) => number): Ceiling[] =>
        Array.from({ length: duration }, (_, index) => new Ceiling(index + 1, ceilingAt(index + 1)));

    /** stopDistance in meters, the same as default options */
    const sample = (profile: Segment[], ceilings: Ceiling[] = [], events: Event[] = [], stopDistance = 3): ComputerData =>
        ComputerProfile.sample({
            profile: profile,
            ceilings: ceilings,
            events: events,
            stopDistance: stopDistance
        });

    const air = StandardGases.air;
    // descent to 10 m in 60 s, then 60 s at 10 m
    const simpleDive = [
        new Segment(0, 10, air, 60),
        new Segment(10, 10, air, 60)
    ];

    it('Empty profile results in no points', () => {
        const data = sample([]);
        expect(data.profile).toEqual([]);
        expect(data.events).toEqual([]);
    });

    it('Empty data has no points', () => {
        expect(ComputerProfile.empty()).toEqual({ profile: [], events: [] });
    });

    it('Creates point for every second including start and end', () => {
        const data = sample(simpleDive);
        expect(data.profile.length).toEqual(121);
        expect(data.profile.map(p => p.runTime)).toEqual(Array.from({ length: 121 }, (_, i) => i));
    });

    it('Interpolates depth within segment', () => {
        const profile = sample(simpleDive).profile;
        expect(profile[0].depth).toBeCloseTo(0, 6);
        expect(profile[30].depth).toBeCloseTo(5, 6);
        expect(profile[60].depth).toBeCloseTo(10, 6);
        expect(profile[90].depth).toBeCloseTo(10, 6);
    });

    it('Zero duration segment keeps the depth', () => {
        // only segment at the start of the profile is sampled, others are skipped by the next segments
        const profile = sample([
            new Segment(0, 0, air, 0),
            new Segment(0, 10, air, 60)
        ]).profile;
        expect(profile[0].depth).toEqual(0);
        expect(profile.every(p => !Number.isNaN(p.depth))).toBeTrue();
    });

    it('Fractional duration ends at last whole second', () => {
        const profile = sample([new Segment(0, 10, air, 90.5)]).profile;
        expect(profile.length).toEqual(91);
        expect(profile[90].runTime).toEqual(90);
        expect(profile[90].depth).toBeCloseTo(9.945, 3);
    });

    it('Ceiling taken from latest ceiling sample at the same or earlier time', () => {
        const profile = sample(simpleDive, ceilingsFrom([0, 0, 3, 3.5])).profile;
        expect(profile[0].ceiling).toEqual(0);
        expect(profile[2].ceiling).toEqual(0);
        expect(profile[3].ceiling).toEqual(3);
        expect(profile[4].ceiling).toEqual(3.5);
        // no more samples, last known ceiling is kept
        expect(profile[100].ceiling).toEqual(3.5);
    });

    it('No decompression limit is not sampled', () => {
        expect(sample(simpleDive).profile[10].ndl).toEqual(0);
    });

    it('Time to surface is remaining time till end of the dive', () => {
        const profile = sample(simpleDive).profile;
        expect(profile[0].tts).toEqual(120);
        expect(profile[30].tts).toEqual(90);
        expect(profile[120].tts).toEqual(0);
    });

    it('Time to surface of fractional duration ends with the remaining fraction', () => {
        const profile = sample([new Segment(0, 10, air, 90.5)]).profile;
        expect(profile[90].tts).toBeCloseTo(0.5, 6);
    });

    describe('Depth statistics', () => {
        // 0 -> 30 m in 60 s, 60 s at 30 m, ascent 30 -> 10 m in 60 s
        const diveWithAscent = [
            new Segment(0, 30, air, 60),
            new Segment(30, 30, air, 60),
            new Segment(30, 10, air, 60)
        ];

        it('Maximum depth is current maximum depth at the moment', () => {
            const profile = sample(diveWithAscent).profile;
            expect(profile[0].maxDepth).toBeCloseTo(0, 6);
            expect(profile[30].maxDepth).toBeCloseTo(15, 6);
            expect(profile[150].depth).toBeCloseTo(20, 6);
            expect(profile[150].maxDepth).toBeCloseTo(30, 6);
        });

        it('Average depth is zero at start', () => {
            expect(sample(simpleDive).profile[0].averageDepth).toEqual(0);
        });

        it('Average depth is current time weighted average depth at the moment', () => {
            const profile = sample(simpleDive).profile;
            // descent 0 -> 10 m in 60 s: area 300 m*s / 60 s
            expect(profile[60].averageDepth).toBeCloseTo(5, 6);
            // + 60 s at 10 m: (300 + 600) / 120 s
            expect(profile[120].averageDepth).toBeCloseTo(7.5, 6);
        });
    });

    // 0 -> 30 m, 600 s at 30 m, ascent with stops at 6 m and 3 m
    const decoDive = [
        new Segment(0, 30, air, 60), // 0 - 60
        new Segment(30, 30, air, 600), // 60 - 660
        new Segment(30, 6, air, 240), // 660 - 900
        new Segment(6, 6, air, 60), // 900 - 960 stop
        new Segment(6, 3, air, 30), // 960 - 990
        new Segment(3, 3, air, 300), // 990 - 1290 stop, its last 180 s is the safety stop
        new Segment(3, 0, air, 30) // 1290 - 1320
    ];
    // ceiling far from the bottom and ascent, close to both stops, cleared during the last stop
    const decoCeilings = ceilingsAt(1320, (runTime) => {
        if (runTime < 600) {
            return 0;
        }

        if (runTime < 900) {
            return 5;
        }

        if (runTime < 960) {
            return 4;
        }

        if (runTime < 990) {
            return 2.5;
        }

        return runTime < 1100 ? 1 : 0;
    });
    const noCeilings = ceilingsAt(1320, () => 0);
    const isStop = (e: ComputerEvent): boolean => e.type === ComputerEventType.stop;

    describe('Stops', () => {
        const stopsOf = (profile: Segment[], ceilings: Ceiling[], stopDistance = 3): ComputerEvent[] =>
            sample(profile, ceilings, [], stopDistance).events.filter(isStop);

        /** The 6 m stop (900 - 960 s) breathing EAN50, i.e. gas switch */
        const withSwitchAtSixMeters = (): Segment[] => {
            const profile = decoDive.slice();
            profile[3] = new Segment(6, 6, StandardGases.ean50, 60);
            return profile;
        };

        /** Ceiling only during the 6 m stop (900 - 960 s) */
        const ceilingAtSixMeters = (ceilingAt: (runTime: number) => number): Ceiling[] =>
            ceilingsAt(1320, (runTime) => runTime >= 900 && runTime < 960 ? ceilingAt(runTime) : 0);

        it('Creates stop for every flat segment with ceiling closer than stop distance', () => {
            expect(stopsOf(decoDive, decoCeilings)).toEqual([
                new ComputerStop(ComputerEventType.stop, 900, 6, 60),
                new ComputerStop(ComputerEventType.stop, 990, 3, 300)
            ]);
        });

        it('Flat segment with ceiling far from its depth is not a stop', () => {
            // bottom at 30 m with ceiling at 5 m
            expect(stopsOf(decoDive, decoCeilings).map(s => s.runTime)).not.toContain(60);
        });

        it('Flat segment with zero ceiling is not a stop', () => {
            expect(stopsOf(decoDive, noCeilings)).toEqual([]);
        });

        it('Flat segment with ceiling at stop distance is not a stop', () => {
            // diver at 6 m is allowed to ascend to the 3 m ceiling
            expect(stopsOf(decoDive, ceilingAtSixMeters(() => 3))).toEqual([]);
        });

        it('Flat segment is a stop when the ceiling comes closer during it', () => {
            const comingCloser = ceilingAtSixMeters((runTime) => runTime < 930 ? 2 : 4);
            expect(stopsOf(decoDive, comingCloser).map(s => s.runTime)).toEqual([900]);
        });

        it('Uses stop distance from options', () => {
            // ceiling 4 m from the 6 m segment
            const ceilings = ceilingAtSixMeters(() => 2);
            expect(stopsOf(decoDive, ceilings)).toEqual([]);
            expect(stopsOf(decoDive, ceilings, 5).map(s => s.runTime)).toEqual([900]);
        });

        it('Gas switch with close ceiling is a stop', () => {
            const stops = stopsOf(withSwitchAtSixMeters(), decoCeilings);
            expect(stops[0]).toEqual(new ComputerStop(ComputerEventType.stop, 900, 6, 60));
        });

        it('Gas switch without ceiling is not a stop', () => {
            expect(stopsOf(withSwitchAtSixMeters(), noCeilings)).toEqual([]);
        });

        it('Events are sorted by run time', () => {
            const events = [EventsFactory.createSafetyStopStart(1110, 3), EventsFactory.createHighPpO2(1000, 3)];
            const runTimes = sample(decoDive, decoCeilings, events).events.map(e => e.runTime);
            expect(runTimes).toEqual([900, 990, 1000, 1110]);
        });

        it('Stop ends at the beginning of the following safety stop', () => {
            const events = sample(decoDive, decoCeilings, [EventsFactory.createSafetyStopStart(1110, 3)]).events;
            expect(events.filter(isStop)).toEqual([
                new ComputerStop(ComputerEventType.stop, 900, 6, 60),
                new ComputerStop(ComputerEventType.stop, 990, 3, 120)
            ]);
        });

        it('Stop covered by the safety stop is removed', () => {
            // the safety stop starts together with the 3 m stop
            const events = sample(decoDive, decoCeilings, [EventsFactory.createSafetyStopStart(990, 3)]).events;
            expect(events.filter(isStop).map(s => s.runTime)).toEqual([900]);
        });
    });

    describe('Next stop', () => {
        // safety stop is the last 180 s of the 3 m stop 990 - 1290
        const safetyStop = EventsFactory.createSafetyStopStart(1110, 3);

        const sampleDeco = (ceilings: Ceiling[]): ComputerData => sample(decoDive, ceilings, [safetyStop]);

        it('Points to first stop before it starts', () => {
            const data = sampleDeco(decoCeilings);
            const stops = data.events.filter(isStop);
            expect(data.profile[0].nextStop).toBe(stops[0] as StopEvent);
        });

        it('Points to current stop while at the stop', () => {
            const data = sampleDeco(decoCeilings);
            const stops = data.events.filter(isStop);
            expect(data.profile[930].nextStop).toBe(stops[0] as StopEvent);
        });

        it('Points to following stop after stop finished', () => {
            const data = sampleDeco(decoCeilings);
            const stops = data.events.filter(isStop);
            expect(data.profile[960].nextStop).toBe(stops[1] as StopEvent);
        });

        it('Points to stop until the safety stop starts', () => {
            const profile = sampleDeco(decoCeilings).profile;
            expect(profile[1000].nextStop?.type).toEqual(ComputerEventType.stop);
            expect(profile[1000].nextStop?.duration).toEqual(120);
            expect(profile[1109].nextStop?.type).toEqual(ComputerEventType.stop);
        });

        it('Points to safety stop after the stop finished', () => {
            const profile = sampleDeco(decoCeilings).profile;
            expect(profile[1110].nextStop?.type).toEqual(ComputerEventType.safetyStop);
            expect(profile[1289].nextStop?.type).toEqual(ComputerEventType.safetyStop);
        });

        it('Points to safety stop when there is no deco stop', () => {
            const point = sampleDeco(noCeilings).profile[500];
            expect(point.nextStop?.type).toEqual(ComputerEventType.safetyStop);
            expect(point.nextStop?.duration).toEqual(180);
        });

        it('No next stop after last stop finished', () => {
            const profile = sampleDeco(decoCeilings).profile;
            expect(profile[1290].nextStop).toBeUndefined();
            expect(profile[1320].nextStop).toBeUndefined();
        });
    });
});
