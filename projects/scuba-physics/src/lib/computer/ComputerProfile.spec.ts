import { Ceiling, Event, EventsFactory } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { ComputerData, ComputerEvent, ComputerEventType, StopEvent } from './ComputerData';
import { ComputerProfile } from './ComputerProfile';

describe('ComputerProfile', () => {
    /** Ceilings are sampled every second starting at 1 s */
    const ceilingsFrom = (depths: number[]): Ceiling[] => depths.map((depth, index) => new Ceiling(index + 1, depth));

    /** userSegments Infinity means unknown, no stops are created */
    const sample = (profile: Segment[], ceilings: Ceiling[] = [], events: Event[] = [],
        userSegments = Number.POSITIVE_INFINITY): ComputerData => ComputerProfile.sample({
        profile: profile,
        ceilings: ceilings,
        events: events,
        userSegments: userSegments
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

    describe('Algorithm events', () => {
        const eventsOf = (events: Event[]): ComputerEvent[] => sample(simpleDive, [], events).events;

        it('Copies high ppO2, low ppO2 and broken ceiling', () => {
            const events = eventsOf([
                EventsFactory.createLowPpO2(5, 1),
                EventsFactory.createHighPpO2(60, 10),
                EventsFactory.createBrokenCeiling(100, 10)
            ]);
            expect(events).toEqual([
                { type: ComputerEventType.lowPpO2, runTime: 5, depth: 1 },
                { type: ComputerEventType.highPpO2, runTime: 60, depth: 10 },
                { type: ComputerEventType.brokenCeiling, runTime: 100, depth: 10 }
            ]);
        });

        it('Copies gas switch with gas name', () => {
            const events = eventsOf([EventsFactory.createGasSwitch(70, 10, StandardGases.ean50)]);
            expect(events).toEqual([
                { type: ComputerEventType.gasSwitch, runTime: 70, depth: 10, gasName: 'EAN50' } as ComputerEvent
            ]);
        });

        it('Converts safety stop to stop with 3 minutes duration', () => {
            const events = eventsOf([EventsFactory.createSafetyStopStart(80, 3)]);
            expect(events).toEqual([
                { type: ComputerEventType.safetyStop, runTime: 80, depth: 3, duration: 180 } as ComputerEvent
            ]);
        });

        it('Ignores other events', () => {
            const events = eventsOf([
                EventsFactory.createNoDecoEnd(50, 10),
                EventsFactory.createHighAscentSpeed(60, 10)
            ]);
            expect(events).toEqual([]);
        });
    });

    // user defined: 0 -> 30 m, 600 s at 30 m; calculated ascent with stops at 6 m and 3 m
    const decoDive = [
        new Segment(0, 30, air, 60), // 0 - 60
        new Segment(30, 30, air, 600), // 60 - 660
        new Segment(30, 6, air, 240), // 660 - 900
        new Segment(6, 6, air, 60), // 900 - 960 stop
        new Segment(6, 3, air, 30), // 960 - 990
        new Segment(3, 3, air, 180), // 990 - 1170 stop
        new Segment(3, 0, air, 30) // 1170 - 1200
    ];
    const decoUserSegments = 2;
    // ceiling 2 m up to 999 s, cleared from 1000 s
    const decoCeilings = ceilingsFrom([...Array.from({ length: 999 }, () => 2), ...Array.from({ length: 201 }, () => 0)]);
    const noCeilings = ceilingsFrom(Array.from({ length: 1200 }, () => 0));
    const isStop = (e: ComputerEvent): boolean => e.type === ComputerEventType.stop;

    describe('Stops', () => {
        const stopsOf = (profile: Segment[], ceilings: Ceiling[], userSegments: number): ComputerEvent[] =>
            sample(profile, ceilings, [], userSegments).events.filter(isStop);

        /** The 6 m stop (900 - 960 s) breathing EAN50, i.e. gas switch */
        const withSwitchAtSixMeters = (): Segment[] => {
            const profile = decoDive.slice();
            profile[3] = new Segment(6, 6, StandardGases.ean50, 60);
            return profile;
        };

        it('Creates stop for every calculated flat ascent segment with ceiling', () => {
            expect(stopsOf(decoDive, decoCeilings, decoUserSegments)).toEqual([
                { type: ComputerEventType.stop, runTime: 900, depth: 6, duration: 60 } as StopEvent,
                { type: ComputerEventType.stop, runTime: 990, depth: 3, duration: 180 } as StopEvent
            ]);
        });

        it('User defined flat segment is not a stop', () => {
            const stops = stopsOf(decoDive, decoCeilings, 4);
            expect(stops.map(s => s.runTime)).toEqual([990]);
        });

        it('Flat segment with zero ceiling is not a stop', () => {
            expect(stopsOf(decoDive, noCeilings, decoUserSegments)).toEqual([]);
        });

        it('Flat segment before end of deepest point is not a stop', () => {
            // bottom segment has ceiling, but ends at the deepest point
            const stops = stopsOf(decoDive, decoCeilings, 0);
            expect(stops.map(s => s.runTime)).toEqual([900, 990]);
        });

        it('No stops when user defined segments are not known', () => {
            expect(stopsOf(decoDive, decoCeilings, Number.POSITIVE_INFINITY)).toEqual([]);
        });

        it('Gas switch with ceiling is a stop', () => {
            const stops = stopsOf(withSwitchAtSixMeters(), decoCeilings, decoUserSegments);
            expect(stops[0]).toEqual({ type: ComputerEventType.stop, runTime: 900, depth: 6, duration: 60 } as StopEvent);
        });

        it('Gas switch without ceiling is not a stop', () => {
            expect(stopsOf(withSwitchAtSixMeters(), noCeilings, decoUserSegments)).toEqual([]);
        });

        it('Events are sorted by run time', () => {
            const events = [EventsFactory.createHighPpO2(1000, 3), EventsFactory.createSafetyStopStart(990, 3)];
            const runTimes = sample(decoDive, decoCeilings, events, decoUserSegments).events.map(e => e.runTime);
            expect(runTimes).toEqual([900, 990, 990, 1000]);
        });
    });

    describe('Next stop', () => {
        // safety stop at 3 m overlaps the last deco stop 990 - 1170
        const safetyStop = EventsFactory.createSafetyStopStart(990, 3);

        const sampleDeco = (ceilings: Ceiling[]): ComputerData => sample(decoDive, ceilings, [safetyStop], decoUserSegments);

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

        it('Points to stop, not to overlapping safety stop', () => {
            const profile = sampleDeco(decoCeilings).profile;
            expect(profile[980].nextStop?.type).toEqual(ComputerEventType.stop);
            expect(profile[1000].nextStop?.type).toEqual(ComputerEventType.stop);
        });

        it('Points to safety stop when there is no deco stop', () => {
            const point = sampleDeco(noCeilings).profile[500];
            expect(point.nextStop?.type).toEqual(ComputerEventType.safetyStop);
            expect(point.nextStop?.duration).toEqual(180);
        });

        it('No next stop after last stop finished', () => {
            const profile = sampleDeco(decoCeilings).profile;
            expect(profile[1170].nextStop).toBeUndefined();
            expect(profile[1200].nextStop).toBeUndefined();
        });
    });
});
