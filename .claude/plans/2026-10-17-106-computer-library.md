# #106 Dive Computer Calculation in scuba-physics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Project override (CLAUDE.md):** implement ONE task per request, run its verification (tests + lint), tick its `- [ ] Status` checkbox, then STOP for review, unless the user explicitly says to continue.

**Goal:** Move the dive computer data calculation from the planner into the `scuba-physics` library, reusing the dive the planner has already calculated. The library calculates only what is new: the per-second samples, stops, next stops and NDL predictions.

**Architecture:** A new library folder `projects/scuba-physics/src/lib/computer/` contains:

- the model (`ComputerData.ts`, moved from the planner);
- a pure sampler, `ComputerProfile.sample(source)`. It works on library `Segment`s, `Ceiling`s and `Event`s, not on planner `WayPoint`s or `BoundEvent`s;
- an orchestrator, `DiveComputer`.

`DiveComputer.start(calculatedDive)` takes the whole calculated dive:

- **the definition** (`AlgorithmParams`): user plan, gases, options, breathing model and surface interval;
- **its calculated results:** the profile as `Segment`s, the ceilings and the algorithm events.

It samples the dive and yields the points one by one with their NDL. The NDL comes from `BuhlmannAlgorithm.noDecoLimitsOfProfile`, which goes through the already calculated profile once to load the tissues, and predicts from them. The decompression profile and the ceilings aren't calculated again.

In the planner:

- `DiveResults` keeps the calculated profile `Segment`s and all algorithm events, unfiltered. Today it keeps only `WayPoint`s and the events after the ignored-issues filter.
- The service sends these results with the computer request.
- The worker only converts DTOs and streams the library's points.

**Tech Stack:** TypeScript, `scuba-physics` (ng-packagr library), Angular planner app, Karma/Jasmine.

**Spec:** the user's requests of 2026-10-17:

> "Move as much as of the computer calculation to the scuba-physics library. Don't use UI dependent objects like waypoints or anything which needs UnitConversions. As input data don't use only the Dive result, use the whole dive. Fix all related tests and move relevant tests to the library too."

Decision: use **option 3**. Reuse the already calculated profile, ceilings and events. Go through the profile once more only to load the tissues for the NDL predictions. Don't store the per-second tissue history.

The behaviour stays as defined by the previous plan, `.claude/plans/2026-10-15-106-computer-data-service.md` (R1–R18).

## Requirements

- L1: All computer data computation lives in `scuba-physics`: per-second sampling, max and average depth, ceiling, NDL, mapping of events, stops and next stop.
- L2: The library code uses no planner or UI types: no `WayPoint`, `BoundEvent`, `UnitConversion`, `DiveResults` and nothing from `@angular/*`. Depths are in meters, times in seconds.
- L3: The library input is the whole dive: the definition (`AlgorithmParams`) and its calculated results (profile `Segment`s, ceilings, algorithm events). Nothing that is already calculated is calculated again, except one pass through the profile that loads the tissues for the NDL predictions (option 3).
- L4: The computer shows all algorithm events, regardless of the planner's ignored-issues list.
- L5: Behaviour visible to the planner service is unchanged: the same worker messages (`started` / `point` / `finished`), the same `ComputerData` content, and NDL streamed point by point.
- L6: The tests of the moved computation move to the library and are adapted to library types. The planner keeps only tests of the planner code: `DiveResults` / `PlannerService` storage, the worker DTO plumbing, the service and the restartable task.
- L7: The performance test (R17) measures the library computer calculation and lives in the library.

## Global Constraints

- Branch `feat/106-computer-simulator`. Conventional commits with the `#106` prefix.
- New library files go in `projects/scuba-physics/src/lib/computer/` and are exported from `projects/scuba-physics/src/public-api.ts`.
- Library code imports only library modules, using relative imports like the rest of `scuba-physics`.
- After every `scuba-physics` change, run `npm run build-lib` before running planner tests. The planner consumes the built library.
- ESLint: 4-space indent, single quotes, semicolons, 140-char lines. Use explicit `key: value` object literals like the surrounding code.
- Library focused tests: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include=<glob>`. Planner focused tests: the same with `--project planner`.
- Keep the worker DTOs in `serialization.model.ts` and both factories in sync (CLAUDE.md).
- `Ceiling`s sent through `postMessage` arrive as plain `{ time, depth }` objects without the class getters. Library code may read only `time` and `depth` from them.
- Commit only the files the task names. The working copy may contain unrelated user changes, such as the moved `computers/` screenshots. Leave those alone.

## Review Focus

1. **Ignored issues.** An event ignored in the planner, and so missing from `DiveResults.events`, must still reach the computer. Test: Task 4, "Keeps all algorithm events".
2. **Repetitive dive.** The NDL predictions must start from the previous dive's tissues (`dive.surfaceInterval`). Test: Task 3, "Repetitive dive has shorter no decompression limit".
3. **Not calculated or failed dive, empty profile.** The result must be no points and no events, with no exception. Tests: Task 3, "Empty profile has no points and events"; Task 5, "Empty profile posts no points". The service already doesn't send requests for failed dives.
4. **NDL alignment.** The NDL per point must be the same values as before the move. Tests: Task 2, "No decompression limits of profile equal no decompression limits of the plan"; Task 3, "Points contain calculated no decompression limit".
5. **Worker bundle.** After the move, the computer worker must not pull in Angular. Check: Task 5, Step 7. The production build lists `computer-worker` at roughly the size of the other workers (about 150 kB), not 427 kB.

---

### Task 1: Library model and sampler (L1, L2, L6)

- [x] Status

**Files:**

- Create: `projects/scuba-physics/src/lib/computer/ComputerData.ts` (the model, moved from `projects/planner/src/app/shared/computer/computer.model.ts`)
- Create: `projects/scuba-physics/src/lib/computer/ComputerProfile.ts`
- Test: `projects/scuba-physics/src/lib/computer/ComputerProfile.spec.ts`
- Modify: `projects/scuba-physics/src/public-api.ts`

**Interfaces:**

- Produces (all exported from `scuba-physics`):
  - `RunTimePoint`, `ComputerEventType`, `ComputerEvent`, `GasSwitchEvent`, `StopEvent`, `ComputerData`: the same members as the planner model today.
  - `interface ComputerProfileSource { profile: Segment[]; ceilings: Ceiling[]; events: Event[]; userSegments: number; }`
  - `class ComputerProfile`:
    - `static empty(): ComputerData`
    - `static sample(source: ComputerProfileSource): ComputerData`. It returns `ndl: 0` in every point; NDL is added by `DiveComputer` (Task 3). With `userSegments` set to `Infinity`, no stops are created.

- [ ] **Step 1: Create the model**

`projects/scuba-physics/src/lib/computer/ComputerData.ts`:

```ts
/** One sample of the dive computer readings */
export interface RunTimePoint {
    /** in seconds since start of the dive */
    runTime: number;
    /** current depth in meters */
    depth: number;
    /** current maximum depth at this moment in meters, the deepest depth reached so far */
    maxDepth: number;
    /** current average depth at this moment in meters, time weighted from start of the dive */
    averageDepth: number;
    /** current ceiling in meters */
    ceiling: number;
    /**
     * Current no decompression limit at this moment in seconds: remaining time till the ceiling isn't at surface,
     * when staying at current depth on current gas. 0 while in decompression, Infinity at surface or for more than 1000 minutes.
     */
    ndl: number;
    /**
     * Not the total runtime to end of the dive, but current time to surface at this point in the dive profile.
     * This will require calculate the profile for every second of the dive - performance hit maybe not feasible.
     * in seconds.
     **/
    tts: number;
    /**
     * Next stop (decompression or safety stop) not finished yet at this moment, including the stop in progress.
     * A decompression stop takes precedence over an overlapping safety stop.
     * Undefined after the last stop.
     */
    nextStop?: StopEvent;
}

/** Events shown by the dive computer, the stops exist only in the computer data */
export enum ComputerEventType {
    highPpO2 = 0,
    lowPpO2 = 1,
    brokenCeiling = 2,
    gasSwitch = 3,
    /** decompression stop */
    stop = 4,
    safetyStop = 5
}

export interface ComputerEvent {
    type: ComputerEventType;
    /** in seconds since start of the dive */
    runTime: number;
    /** in meters */
    depth: number;
}

export interface GasSwitchEvent extends ComputerEvent {
    type: ComputerEventType.gasSwitch;
    /** name of the gas switched to, e.g. EAN50 */
    gasName: string;
}

export interface StopEvent extends ComputerEvent {
    type: ComputerEventType.stop | ComputerEventType.safetyStop;
    /** in seconds */
    duration: number;
}

/**
 * Model to generate data for computer visualization.
 * Sampling for every second of the dive.
 */
export interface ComputerData {
    profile: RunTimePoint[];
    /** Computer events ignore the planner's ignored-issues list, as a real dive computer would. */
    events: ComputerEvent[];
}
```

(The `events` comment carries over the comment the user added to the planner model.)

- [ ] **Step 2: Write the failing sampler tests**

`projects/scuba-physics/src/lib/computer/ComputerProfile.spec.ts`. These are the planner `computerProfile.spec.ts` cases, adapted:

- planner `WayPoint`s become library `Segment`s;
- `BoundEvent`s become `Event`s;
- the two imperial-unit cases are dropped, because the library has no units;
- a gas switch is a flat segment with a different gas.

```ts
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
```

- [ ] **Step 3: Run them to check they fail**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Cannot find module './ComputerProfile'".

- [ ] **Step 4: Implement the sampler**

`projects/scuba-physics/src/lib/computer/ComputerProfile.ts`:

```ts
import { Ceiling, Event, EventType } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { GasNames } from '../gases/GasNames';
import { Time } from '../physics/Time';
import {
    ComputerData, ComputerEvent, ComputerEventType,
    GasSwitchEvent, RunTimePoint, StopEvent
} from './ComputerData';

/** Calculated dive data, from which the computer data are sampled */
export interface ComputerProfileSource {
    /** Complete profile: user defined segments followed by the calculated ascent */
    profile: Segment[];
    /** Ceilings of the profile, sampled every second */
    ceilings: Ceiling[];
    /** Events of the profile calculated by the algorithm */
    events: Event[];
    /** Count of user defined segments at the start of the profile, those are never stops. Infinity if not known: no stops are created. */
    userSegments: number;
}

/** Segment with its position in the profile, in seconds since start of the dive */
interface TimedSegment {
    segment: Segment;
    startTime: number;
    endTime: number;
}

/** Samples calculated dive for every second of the dive. */
export class ComputerProfile {
    public static empty(): ComputerData {
        return {
            profile: [],
            events: []
        };
    }

    /**
     * Samples the calculated dive for every second of the dive.
     * The no decompression limit isn't sampled (0 in every point), see DiveComputer.
     */
    public static sample(source: ComputerProfileSource): ComputerData {
        const segments = ComputerProfile.timed(source.profile);

        if (segments.length === 0) {
            return ComputerProfile.empty();
        }

        const ceilings = source.ceilings;
        const duration = Math.floor(segments[segments.length - 1].endTime);
        const profile: RunTimePoint[] = [];
        let segmentIndex = 0;
        let ceilingIndex = 0;
        let ceiling = 0;
        let maxDepth = 0;
        let depthArea = 0; // meters * seconds
        let previousDepth = 0;

        for (let runTime = 0; runTime <= duration; runTime++) {
            while (segmentIndex < segments.length - 1 && segments[segmentIndex].endTime < runTime) {
                segmentIndex++;
            }

            while (ceilingIndex < ceilings.length && ceilings[ceilingIndex].time <= runTime) {
                ceiling = ceilings[ceilingIndex].depth;
                ceilingIndex++;
            }

            const depth = ComputerProfile.depthAt(segments[segmentIndex], runTime);
            maxDepth = Math.max(maxDepth, depth);

            if (runTime > 0) {
                // trapezoid of the last second, exact for linear depth change
                depthArea += (previousDepth + depth) / 2;
            }

            previousDepth = depth;

            profile.push({
                runTime: runTime,
                depth: depth,
                maxDepth: maxDepth,
                averageDepth: runTime > 0 ? depthArea / runTime : 0,
                ceiling: ceiling,
                ndl: 0,
                tts: 0
            });
        }

        const stops = ComputerProfile.stopsFrom(segments, profile, source.userSegments);
        const events = [...ComputerProfile.eventsFrom(source.events), ...stops]
            .sort((a, b) => a.runTime - b.runTime);
        ComputerProfile.assignNextStop(profile, events);

        return {
            profile: profile,
            events: events
        };
    }

    private static timed(profile: Segment[]): TimedSegment[] {
        let startTime = 0;

        return profile.map((segment) => {
            const endTime = startTime + segment.duration;
            const timed: TimedSegment = { segment: segment, startTime: startTime, endTime: endTime };
            startTime = endTime;
            return timed;
        });
    }

    /**
     * Flat calculated segments during the ascent from the deepest point, where the ceiling is not zero.
     * Gas switch is the same as any other flat segment.
     */
    private static stopsFrom(segments: TimedSegment[], profile: RunTimePoint[], userSegments: number): StopEvent[] {
        const ascentStart = ComputerProfile.lastDeepestIndex(segments) + 1;
        const firstCandidate = Math.max(ascentStart, userSegments);
        const stops: StopEvent[] = [];

        for (let index = firstCandidate; index < segments.length; index++) {
            const timed = segments[index];
            const duration = timed.endTime - timed.startTime;
            const isFlat = timed.segment.startDepth === timed.segment.endDepth;
            const ceiling = profile[Math.floor(timed.startTime)].ceiling;

            if (isFlat && duration > 0 && ceiling > 0) {
                stops.push({
                    type: ComputerEventType.stop,
                    runTime: timed.startTime,
                    depth: timed.segment.endDepth,
                    duration: duration
                });
            }
        }

        return stops;
    }

    private static assignNextStop(profile: RunTimePoint[], events: ComputerEvent[]): void {
        const stops = ComputerProfile.stopsToFollow(events);
        let stopIndex = 0;

        profile.forEach((point) => {
            while (stopIndex < stops.length && ComputerProfile.stopEnd(stops[stopIndex]) <= point.runTime) {
                stopIndex++;
            }

            point.nextStop = stops[stopIndex];
        });
    }

    /** Stops and safety stops sorted by time, safety stop overlapping any stop is replaced by the stop */
    private static stopsToFollow(events: ComputerEvent[]): StopEvent[] {
        const allStops = events.filter((e): e is StopEvent =>
            e.type === ComputerEventType.stop || e.type === ComputerEventType.safetyStop);
        const decoStops = allStops.filter(s => s.type === ComputerEventType.stop);

        return allStops.filter(s => s.type === ComputerEventType.stop ||
            !decoStops.some(decoStop => ComputerProfile.overlaps(decoStop, s)));
    }

    private static overlaps(first: StopEvent, second: StopEvent): boolean {
        return first.runTime < ComputerProfile.stopEnd(second) && second.runTime < ComputerProfile.stopEnd(first);
    }

    private static stopEnd(stop: StopEvent): number {
        return stop.runTime + stop.duration;
    }

    /** Index of the last segment which reaches the maximum depth */
    private static lastDeepestIndex(segments: TimedSegment[]): number {
        const maxDepth = Math.max(...segments.map(s => s.segment.endDepth));
        let deepestIndex = 0;

        segments.forEach((timed, index) => {
            if (timed.segment.endDepth === maxDepth) {
                deepestIndex = index;
            }
        });

        return deepestIndex;
    }

    private static eventsFrom(source: Event[]): ComputerEvent[] {
        const events: ComputerEvent[] = [];

        source.forEach((event) => {
            const converted = ComputerProfile.toComputerEvent(event);

            if (converted) {
                events.push(converted);
            }
        });

        return events;
    }

    private static toComputerEvent(event: Event): ComputerEvent | undefined {
        const runTime = event.timeStamp;
        const depth = event.depth;

        switch (event.type) {
            case EventType.highPpO2:
                return { type: ComputerEventType.highPpO2, runTime: runTime, depth: depth };
            case EventType.lowPpO2:
                return { type: ComputerEventType.lowPpO2, runTime: runTime, depth: depth };
            case EventType.brokenCeiling:
                return { type: ComputerEventType.brokenCeiling, runTime: runTime, depth: depth };
            case EventType.gasSwitch: {
                const gas = event.gas;
                const gasSwitch: GasSwitchEvent = {
                    type: ComputerEventType.gasSwitch,
                    runTime: runTime,
                    depth: depth,
                    gasName: gas ? GasNames.nameFor(gas.fO2, gas.fHe) : ''
                };
                return gasSwitch;
            }
            case EventType.safetyStop: {
                const safetyStop: StopEvent = {
                    type: ComputerEventType.safetyStop, runTime: runTime, depth: depth, duration: Time.safetyStopDuration
                };
                return safetyStop;
            }
            default:
                return undefined;
        }
    }

    /** Linear interpolation of the depth in meters within the segment */
    private static depthAt(timed: TimedSegment, runTime: number): number {
        const duration = timed.endTime - timed.startTime;
        const segment = timed.segment;

        if (duration <= 0) {
            return segment.endDepth;
        }

        const elapsed = Math.min(Math.max(runTime - timed.startTime, 0), duration);
        return segment.startDepth + (segment.endDepth - segment.startDepth) * elapsed / duration;
    }
}
```

In `projects/scuba-physics/src/public-api.ts`, add after the `ProfileEvents` export:

```ts
export * from './lib/computer/ComputerData';
export * from './lib/computer/ComputerProfile';
```

- [ ] **Step 5: Run the tests to check they pass**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: 0 failures (28 specs).

- [ ] **Step 6: Library suite, lint, build**

Run: `npm run test-lib-ci`, `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/computer/ projects/scuba-physics/src/public-api.ts`, `npm run build-lib`.
Expected: all specs pass, no lint errors, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add projects/scuba-physics/src/lib/computer projects/scuba-physics/src/public-api.ts
git commit -m "feat: #106 sample computer data in scuba-physics"
```

---

### Task 2: NDL of an already calculated profile (L1, L3)

- [x] Status

**Files:**

- Modify: `projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.ts`
- Test: `projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.noDecoLimits.spec.ts`

**Interfaces:**

- Produces:
  - `BuhlmannAlgorithm.noDecoLimitsOfProfile(dive: AlgorithmParams, profile: Segment[]): Generator<number>`.
    - It yields the same values as `noDecoLimitsSequence(dive)`, but for an already calculated profile, so the decompression isn't calculated again.
    - It goes through the profile once to load the tissues, and predicts the NDL from them.
    - `dive` provides the gases, options, breathing model and surface interval. Its `segments` (the user plan) aren't used.
    - For an empty profile it yields nothing.
  - `noDecoLimitsSequence(dive)` becomes: calculate the decompression profile, then `yield* noDecoLimitsOfProfile(dive, profile.segments)`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe` in `BuhlmannAlgorithm.noDecoLimits.spec.ts`:

```ts
    describe('Of calculated profile', () => {
        // 40 m for 25 min, decompression dive
        const decoDive = paramsFor(s => {
            s.add(40, air, 160);
            s.addFlat(air, Time.oneMinute * 25);
        });

        it('No decompression limits of profile equal no decompression limits of the plan', () => {
            const profile = algorithm.decompression(decoDive).segments;
            expect(Array.from(algorithm.noDecoLimitsOfProfile(decoDive, profile))).toEqual(algorithm.noDecoLimits(decoDive));
        });

        it('Empty profile has no limits', () => {
            expect(Array.from(algorithm.noDecoLimitsOfProfile(decoDive, []))).toEqual([]);
        });
    });
```

- [ ] **Step 2: Run them to check they fail**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/BuhlmannAlgorithm.noDecoLimits.spec.ts'`
Expected: compilation FAIL, "Property 'noDecoLimitsOfProfile' does not exist on type 'BuhlmannAlgorithm'".

- [ ] **Step 3: Implement it**

In `BuhlmannAlgorithm.ts`, replace the body of `noDecoLimitsSequence` with:

```ts
        const profile = this.decompression(algorithmParams);

        if (profile.errors.length > 0) {
            return;
        }

        yield* this.noDecoLimitsOfProfile(algorithmParams, profile.segments);
```

Add below it a new method containing the rest of the former body. Replace `profile.segments` with `profile`, and add the empty-profile guard:

```ts
    /**
     * The same as noDecoLimitsSequence, but for already calculated profile of the dive, see the decompression method.
     * @param dive Not null dive definition: gases, options, breathing model and surface interval. The plan segments aren't used.
     * @param profile Already calculated profile of the dive: user defined segments followed by the calculated ascent.
     * Nothing is yielded for empty profile.
     */
    public *noDecoLimitsOfProfile(dive: AlgorithmParams, profile: Segment[]): Generator<number> {
        if (profile.length === 0) {
            return;
        }

        const { gases, options, surfaceInterval, breathing } = dive;
        const depthConverter = new DepthConverterFactory(options).create();
        const rested = this.applySurfaceInterval(surfaceInterval);
        const context = AlgorithmContext.createWithoutStatistics(gases, Segments.fromCollection(profile),
            options, depthConverter, breathing, rested.finalTissues);
        let previous: number | undefined;

        for (const segment of profile) {
            let depth = segment.startDepth;

            for (let elapsed = 0; elapsed < segment.duration; elapsed += Time.oneSecond) {
                const sameLevel = elapsed > 0 && segment.speed === 0;
                previous = this.noDecoLimitAt(context, depth, segment.gas, sameLevel ? previous : undefined);
                yield previous;
                const endDepth = Segment.depthAt(depth, segment.speed, Time.oneSecond);
                this.swimPart(context, new Segment(depth, endDepth, segment.gas, Time.oneSecond));
                depth = endDepth;
            }
        }

        // the final moment at end of the profile, usually at surface
        const last = profile[profile.length - 1];
        yield this.noDecoLimitAt(context, last.endDepth, last.gas, last.speed === 0 ? previous : undefined);
    }
```

- [ ] **Step 4: Run the tests to check they pass**

Run: the Step 2 command. Expected: 0 failures (13 specs; 2 of them come from the imported `Options.spec`).

- [ ] **Step 5: Library suite, lint, build**

Run: `npm run test-lib-ci`, `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.ts projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.noDecoLimits.spec.ts`, `npm run build-lib`.
Expected: all pass, no lint errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.ts projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.noDecoLimits.spec.ts
git commit -m "feat: #106 no decompression limits of calculated profile"
```

---

### Task 3: `DiveComputer`: computer data of the calculated dive (L1, L3)

- [x] Status

**Files:**

- Create: `projects/scuba-physics/src/lib/computer/DiveComputer.ts`
- Test: `projects/scuba-physics/src/lib/computer/DiveComputer.spec.ts`
- Modify: `projects/scuba-physics/src/public-api.ts`

**Interfaces:**

- Consumes: `ComputerProfile.sample`, `ComputerData`, `RunTimePoint`, `ComputerEvent` (Task 1); `BuhlmannAlgorithm.noDecoLimitsOfProfile` (Task 2).
- Produces (exported from `scuba-physics`):
  - `interface CalculatedDive { dive: AlgorithmParams; profile: Segment[]; ceilings: Ceiling[]; events: Event[]; }`
  - `class DiveComputer`:
    - `static start(calculated: CalculatedDive): DiveComputer`. It samples the dive: points, events, stops and next stops. Nothing is calculated again.
    - `get events(): ComputerEvent[]`, sorted by runtime.
    - `get total(): number`: the count of points, one per second.
    - `points(): Generator<RunTimePoint>`. It yields each point as soon as its NDL is predicted, and can be iterated only once.
    - `static calculate(calculated: CalculatedDive): ComputerData`: the complete data, including NDL.
  - The user defined segments for the stop detection are `calculated.dive.segments.length`.
  - An empty profile gives `total` 0, no events and no points.

- [ ] **Step 1: Write the failing tests**

`projects/scuba-physics/src/lib/computer/DiveComputer.spec.ts`:

```ts
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

    it('Contains gas switch events', () => {
        const withDecoGas = calculateDive(diveFor(fortyMetersFor30Minutes, [air, StandardGases.ean50]));
        const switches = DiveComputer.calculate(withDecoGas).events
            .filter((e): e is GasSwitchEvent => e.type === ComputerEventType.gasSwitch);
        expect(switches.map(s => s.gasName)).toContain('EAN50');
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

    it('Points are provided one by one', () => {
        const first = DiveComputer.start(calculatedDecoDive).points().next();
        expect(first.done).toBeFalse();
        expect(first.value.runTime).toEqual(0);
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
```

- [ ] **Step 2: Run them to check they fail**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Cannot find module './DiveComputer'".

- [ ] **Step 3: Implement it**

`projects/scuba-physics/src/lib/computer/DiveComputer.ts`:

```ts
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { Ceiling, Event } from '../algorithm/CalculatedProfile';
import { Segment } from '../depths/Segments';
import { ComputerData, ComputerEvent, RunTimePoint } from './ComputerData';
import { ComputerProfile } from './ComputerProfile';

/** The whole dive: its definition and already calculated results */
export interface CalculatedDive {
    /** Definition of the dive: plan defined by user, gases, options, breathing model and surface interval */
    dive: AlgorithmParams;
    /** Already calculated profile: user defined segments followed by the calculated ascent, see BuhlmannAlgorithm.decompression */
    profile: Segment[];
    /** Ceilings of the profile, sampled every second */
    ceilings: Ceiling[];
    /** All events of the profile calculated by the algorithm */
    events: Event[];
}

/**
 * Dive computer data of already calculated dive.
 * Everything except the slow no decompression limit is sampled when started,
 * the points with no decompression limit are provided one by one.
 */
export class DiveComputer {
    private constructor(private readonly data: ComputerData, private readonly noDecoLimits: Iterable<number>) {
    }

    /** Events of the dive sorted by run time */
    public get events(): ComputerEvent[] {
        return this.data.events;
    }

    /** Count of points, one for every second of the dive */
    public get total(): number {
        return this.data.profile.length;
    }

    /** Samples the calculated dive, nothing already calculated is calculated again */
    public static start(calculated: CalculatedDive): DiveComputer {
        const data = ComputerProfile.sample({
            profile: calculated.profile,
            ceilings: calculated.ceilings,
            events: calculated.events,
            userSegments: calculated.dive.segments.length
        });
        const noDecoLimits = new BuhlmannAlgorithm().noDecoLimitsOfProfile(calculated.dive, calculated.profile);
        return new DiveComputer(data, noDecoLimits);
    }

    /** Complete computer data of the whole dive including no decompression limits */
    public static calculate(calculated: CalculatedDive): ComputerData {
        const computer = DiveComputer.start(calculated);
        return {
            profile: Array.from(computer.points()),
            events: computer.events
        };
    }

    /** Yields every point as soon as its no decompression limit is calculated. Can be iterated only once. */
    public *points(): Generator<RunTimePoint> {
        const profile = this.data.profile;
        let index = 0;
        let lastLimit = 0;

        for (const limit of this.noDecoLimits) {
            // limits are calculated for every started second of each segment, so there may be more of them than points
            if (index >= profile.length) {
                break;
            }

            lastLimit = limit;
            yield this.withNoDecoLimit(index, limit);
            index++;
        }

        // defensive: in case there are less limits than points, the last limit is used
        for (; index < profile.length; index++) {
            yield this.withNoDecoLimit(index, lastLimit);
        }
    }

    private withNoDecoLimit(index: number, limit: number): RunTimePoint {
        const point = this.data.profile[index];
        point.ndl = limit;
        return point;
    }
}
```

In `public-api.ts`, add `export * from './lib/computer/DiveComputer';` after the `ComputerProfile` export.

- [ ] **Step 4: Run the tests to check they pass**

Run: the Step 2 command. Expected: 0 failures.

- [ ] **Step 5: Library suite, lint, build**

Run: `npm run test-lib-ci`, `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/computer/ projects/scuba-physics/src/public-api.ts`, `npm run build-lib`.
Expected: all pass, no lint errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/computer projects/scuba-physics/src/public-api.ts
git commit -m "feat: #106 dive computer data of calculated dive in scuba-physics"
```

---

### Task 4: `DiveResults` keeps the calculated dive for the computer (L3, L4)

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/shared/diveresults.ts`
- Modify: `projects/planner/src/app/shared/planner.service.ts`
- Test: `projects/planner/src/app/shared/planner.service.spec.ts`

**Interfaces:**

- Produces:
  - `DiveResults.profile: Segment[]`: the calculated profile in meters, the same segments the way points are made from. Empty when not calculated or failed.
  - `DiveResults.algorithmEvents: Event[]`: all events calculated by the algorithm, not filtered by the ignored issues. Empty when not calculated or failed.
  - `DiveResults.updateProfile(wayPoints, finalTissues, profile: Segment[] = [])`
  - `DiveResults.updateDiveInfo(..., dailyCns = 0, cnsExposures = [], algorithmEvents: Event[] = [])`
  - `PlannerService` fills both after each calculation of a dive.

- [ ] **Step 1: Write the failing tests**

In `planner.service.spec.ts`, add `EventType` to the `scuba-physics` import. Append inside `describe('App settings are applied', ...)` (that block ignores the no-deco event):

```ts
        it('Keeps all algorithm events for the dive computer', () => {
            expect(dive.algorithmEvents.some(e => e.type === EventType.noDecoEnd)).toBeTrue();
        });
```

Append inside the top level `describe('PlannerService', ...)`:

```ts
    describe('Calculated dive for the dive computer', () => {
        it('Keeps calculated profile in meters', () => {
            expect(dive.profile.length).toEqual(dive.wayPoints.length);
            expect(dive.profile[0].endDepth).toEqual(30);
        });

        it('Keeps algorithm events', () => {
            expect(dive.algorithmEvents.length).toBeGreaterThanOrEqual(dive.events.length);
        });
    });
```

- [ ] **Step 2: Run them to check they fail**

Run: `npx ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/shared/planner.service.spec.ts'`
Expected: compilation FAIL, "Property 'algorithmEvents' does not exist on type 'DiveResults'".

- [ ] **Step 3: Keep the data in `DiveResults`**

In `diveresults.ts`, add `Event` and `Segment` to the `scuba-physics` import, and add the fields next to `_wayPoints` and `_events`:

```ts
    private _profile: Segment[] = [];
    private _algorithmEvents: Event[] = [];
```

Add the getters next to `wayPoints` and `events`:

```ts
    /** Calculated profile in meters: user defined segments followed by the calculated ascent */
    public get profile(): Segment[] {
        return this._profile;
    }

    /** All events calculated by the algorithm, not filtered by the ignored issues. Used by the dive computer. */
    public get algorithmEvents(): Event[] {
        return this._algorithmEvents;
    }
```

Extend the update methods:

```ts
    public updateProfile(wayPoints: WayPoint[], finalTissues: LoadedTissues, profile: Segment[] = []): void {
        this.updateProfileInternal(wayPoints, finalTissues, profile);
        this.profileCalculation.finished();
    }
```

```ts
    private updateProfileInternal(wayPoints: WayPoint[], finalTissues: LoadedTissues, profile: Segment[] = []): void {
        this._wayPoints = wayPoints;
        this._finalTissues = finalTissues;
        this._profile = profile;
    }
```

In `updateDiveInfo`:

- add the last parameter `algorithmEvents: Event[] = []`;
- add `this._algorithmEvents = algorithmEvents;` next to `this._cnsExposures = cnsExposures;`.

In `emptyDiveInfo()`, add `this._algorithmEvents = [];`.

- [ ] **Step 4: Fill it in `PlannerService`**

In `planner.service.ts` `continueCalculation`, replace `diveResult.updateProfile(wayPoints, calculatedProfile.finalTissues);` with:

```ts
        const profile = calculatedProfile.errors.length > 0 ? [] : calculatedProfile.segments;
        diveResult.updateProfile(wayPoints, calculatedProfile.finalTissues, profile);
```

In `finishDiveInfo`, add `events.items` as the last argument of `diveResult.updateDiveInfo(...)`, after `diveInfoResult.cnsExposures`.

- [ ] **Step 5: Run the tests to check they pass**

Run: the Step 2 command. Expected: 0 failures.

- [ ] **Step 6: Full suite and lint**

Run: `npm run test-ci`, `npx eslint -c projects/planner/eslint.config.mjs projects/planner/src/app/shared/diveresults.ts projects/planner/src/app/shared/planner.service.ts projects/planner/src/app/shared/planner.service.spec.ts`.
Expected: all specs pass, no lint errors.

- [ ] **Step 7: Commit**

```bash
git add projects/planner/src/app/shared/diveresults.ts projects/planner/src/app/shared/planner.service.ts projects/planner/src/app/shared/planner.service.spec.ts
git commit -m "feat: #106 keep calculated profile and all events of the dive"
```

---

### Task 5: Planner uses the library (L2, L4, L5, L6)

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/shared/serialization.model.ts` (the request carries the calculated dive; model types come from `scuba-physics`)
- Modify: `projects/planner/src/app/shared/computer/computer-profile.service.ts` and `computer-profile.service.spec.ts`
- Modify (rewrite): `projects/planner/src/app/workers/computer.tasks.ts` and `computer.tasks.spec.ts`
- Modify: `projects/planner/src/app/workers/planning.tasks.ts` (add `diveParameters`; remove `noDecoLimits` / `noDecoLimitsSequence`)
- Modify: `projects/planner/src/app/shared/models.ts` and `models.spec.ts` (remove the now unused `BoundEvent.type` / `depthMeters`)
- Delete: `projects/planner/src/app/shared/computer/computer.model.ts`, `computerProfile.ts`, `computerProfile.spec.ts`

**Interfaces:**

- Consumes: `DiveComputer`, `CalculatedDive`, `RunTimePoint`, `ComputerEvent`, `ComputerData`, `StopEvent`, `ComputerEventType`, `ComputerProfile.empty` from `scuba-physics` (Tasks 1–3); `DiveResults.profile / ceilings / algorithmEvents` (Task 4).
- Produces:
  - `ComputerRequestDto extends PlanRequestDto { calculationId: number; profile: SegmentDto[]; ceilings: Ceiling[]; events: EventDto[]; }`
  - `PlanningTasks.diveParameters(task: PlanRequestDto): AlgorithmParams`: the definition of the dive planned by the user.
  - `ComputerTasks.calculate` posts the same messages as before. Its only remaining job is converting `nextStop` to `nextStopIndex`.

- [ ] **Step 1: Rewrite the worker spec**

Replace `computer.tasks.spec.ts`. The request now carries the calculated dive, prepared here the same way the planner calculates it:

```ts
import { BuhlmannAlgorithm, ComputerEventType } from 'scuba-physics';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { UnitConversion } from '../shared/UnitConversion';
import { PlanRequestFactory } from '../shared/planRequestFactory';
import {
    ComputerFinishedDto, ComputerPointDto, ComputerRequestDto,
    ComputerResultDto, ComputerStartedDto
} from '../shared/serialization.model';
import { ComputerTasks } from './computer.tasks';
import { PlanningTasks } from './planning.tasks';

describe('ComputerTasks', () => {
    /** Default dive of the planner, deepened to 40 m for 30 min to get deco stops, calculated the same way as by the planner */
    const createRequest = (): ComputerRequestDto => {
        const schedules = new DiveSchedules(new UnitConversion(), new ReloadDispatcher());
        const dive = schedules.selected;
        dive.depths.plannedDepth = 40;
        dive.depths.planDuration = 30;
        const request = PlanRequestFactory.create(dive, schedules.previousDiveTissues(dive.id));
        const profile = PlanningTasks.calculateDecompression(request).profile;
        const diveInfo = PlanningTasks.diveInfo({
            ...request,
            calculatedProfile: profile.segments,
            calculatedTissues: profile.finalTissues,
            eventOptions: { maxDensity: 5.7 },
            previousCns: 0,
            previousCnsExposures: []
        });

        return {
            ...request,
            calculationId: 7,
            profile: profile.segments,
            ceilings: diveInfo.ceilings,
            events: diveInfo.events
        };
    };

    const calculate = (request: ComputerRequestDto): ComputerResultDto[] => {
        const messages: ComputerResultDto[] = [];
        ComputerTasks.calculate(request, m => messages.push(m));
        return messages;
    };

    const pointsOf = (messages: ComputerResultDto[]): ComputerPointDto[] =>
        messages.filter((m): m is ComputerPointDto => m.type === 'point');

    it('Posts started, point for every second and finished', () => {
        const messages = calculate(createRequest());
        const started = messages[0] as ComputerStartedDto;
        const points = pointsOf(messages);
        expect(started.type).toEqual('started');
        expect(started.total).toBeGreaterThan(0);
        expect(points.length).toEqual(started.total);
        expect(points.map(p => p.index)).toEqual(points.map((_, i) => i));
        expect(points[10].point.runTime).toEqual(10);
        expect((messages[messages.length - 1] as ComputerFinishedDto).type).toEqual('finished');
    });

    it('Every message has the calculation id', () => {
        const messages = calculate(createRequest());
        expect(messages.every(m => m.calculationId === 7)).toBeTrue();
    });

    it('Points are calculated from the calculated dive', () => {
        const points = pointsOf(calculate(createRequest()));
        expect(points[points.length - 1].point.maxDepth).toBeCloseTo(40, 6);
        expect(points.some(p => p.point.ceiling > 0)).toBeTrue();
    });

    it('Points contain no decompression limit of the planned dive', () => {
        const request = createRequest();
        const limits = new BuhlmannAlgorithm().noDecoLimits(PlanningTasks.diveParameters(request));
        const points = pointsOf(calculate(request));
        expect(points[200].point.ndl).toEqual(limits[200]);
    });

    it('Started contains stop events of deco dive', () => {
        const started = calculate(createRequest())[0] as ComputerStartedDto;
        expect(started.events.some(e => e.type === ComputerEventType.stop)).toBeTrue();
    });

    it('Next stop is sent as index of the stop event', () => {
        const messages = calculate(createRequest());
        const started = messages[0] as ComputerStartedDto;
        const withStop = pointsOf(messages).find(p => p.point.nextStopIndex !== undefined);
        const stopIndex = withStop?.point.nextStopIndex ?? -1;
        expect(stopIndex).toBeGreaterThanOrEqual(0);
        expect([ComputerEventType.stop, ComputerEventType.safetyStop]).toContain(started.events[stopIndex]?.type);
        expect('nextStop' in (withStop?.point ?? {})).toBeFalse();
    });

    it('Empty profile posts no points', () => {
        const request = { ...createRequest(), plan: [], profile: [], ceilings: [], events: [] };
        const messages = calculate(request);
        expect(messages.map(m => m.type)).toEqual(['started', 'finished']);
        expect((messages[0] as ComputerStartedDto).total).toEqual(0);
    });
});
```

- [ ] **Step 2: Add the service test**

In `computer-profile.service.spec.ts`:

- replace the `./computer.model` import with `ComputerData, ComputerEventType, StopEvent` from `'scuba-physics'`;
- add `Ceiling, EventsFactory` to the `scuba-physics` import, merging these into the existing import;
- append inside `describe('Calculation', ...)`:

```ts
        it('Request contains calculated profile, ceilings and all events of selected dive', () => {
            const first = schedules.dives[0];
            const results = first.diveResult;
            const segment = new Segment(0, 0, StandardGases.air, 10);
            results.start();
            results.updateProfile([WayPoint.fromSegment(units, segment)], ProfileTissues.createAtSurface(0), [segment]);
            results.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(),
                [new Ceiling(1, 0)], [], [], 0, [], [EventsFactory.createNoDecoEnd(5, 0)]);
            results.updateConsumption(0, 0, 0, 0, 0, false, false, []);
            dispatcher.sendInfoCalculated(first.id);
            expect(worker.lastRequest.profile.length).toEqual(1);
            expect(worker.lastRequest.ceilings.length).toEqual(1);
            expect(worker.lastRequest.events.length).toEqual(1);
        });
```

- [ ] **Step 3: Run them to check they fail**

Run: `npx ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/computer.tasks.spec.ts' --include='**/computer/computer-profile.service.spec.ts'`
Expected: compilation FAIL. `ComputerRequestDto` has no `profile` / `ceilings` / `events`, and `PlanningTasks.diveParameters` doesn't exist.

- [ ] **Step 4: Request DTO, planning task, worker and service**

In `serialization.model.ts`:

- remove `import { ComputerData, RunTimePoint } from './computer/computer.model';`;
- add `ComputerData, RunTimePoint` to the existing `scuba-physics` import (it already imports `Ceiling`);
- replace `ComputerRequestDto` with:

```ts
export interface ComputerRequestDto extends PlanRequestDto {
    /** Identifies the calculation, messages of interrupted calculations are ignored */
    calculationId: number;
    /** Already calculated profile of the dive: user defined segments followed by the calculated ascent */
    profile: SegmentDto[];
    /** Already calculated ceilings of the profile, plain objects after the transfer */
    ceilings: Ceiling[];
    /** All events of the profile calculated by the algorithm, not filtered by ignored issues */
    events: EventDto[];
}
```

In `planning.tasks.ts`:

- remove `noDecoLimits` and `noDecoLimitsSequence`;
- add (`AlgorithmParams` is already imported):

```ts
    /** Definition of the whole dive planned by the user */
    public static diveParameters(task: PlanRequestDto): AlgorithmParams {
        const tanks = DtoSerialization.toTanks(task.tanks);
        return this.profileParametersFromTask(task, tanks, task.plan);
    }
```

Replace `computer.tasks.ts` with:

```ts
import { ComputerEvent, DiveComputer, RunTimePoint } from 'scuba-physics';
import { DtoSerialization } from '../shared/dtoSerialization';
import { ComputerPointDto, ComputerRequestDto, ComputerResultDto } from '../shared/serialization.model';
import { PlanningTasks } from './planning.tasks';

/** Streams the dive computer data calculated by the library from the already calculated dive */
export class ComputerTasks {
    /** Posts started, one point for every second of the dive and finished message */
    public static calculate(task: ComputerRequestDto, post: (message: ComputerResultDto) => void): void {
        const calculationId = task.calculationId;
        const tanks = DtoSerialization.toTanks(task.tanks);
        const computer = DiveComputer.start({
            dive: PlanningTasks.diveParameters(task),
            profile: DtoSerialization.toSegments(task.profile, tanks),
            ceilings: task.ceilings,
            events: DtoSerialization.toEvents(task.events).items
        });

        post({ calculationId: calculationId, type: 'started', total: computer.total, events: computer.events });
        let index = 0;

        // NDL is the slow part, so every point is posted as soon as its limit is calculated
        for (const point of computer.points()) {
            post(ComputerTasks.toPointMessage(calculationId, computer.events, index, point));
            index++;
        }

        post({ calculationId: calculationId, type: 'finished' });
    }

    private static toPointMessage(calculationId: number, events: ComputerEvent[], index: number, point: RunTimePoint): ComputerPointDto {
        const { nextStop, ...values } = point;
        const nextStopIndex = nextStop ? events.indexOf(nextStop) : undefined;

        return {
            calculationId: calculationId,
            type: 'point',
            index: index,
            point: { ...values, nextStopIndex: nextStopIndex }
        };
    }
}
```

In `computer-profile.service.ts`:

- replace the `./computer.model` and `./computerProfile` imports with `import { ComputerData, ComputerProfile, RunTimePoint, StopEvent } from 'scuba-physics';`;
- add `import { DtoSerialization } from '../dtoSerialization';`;
- in `refresh()`, replace the `this.task.calculate(...)` call with:

```ts
        this.task.calculate({
            ...request,
            calculationId: this.calculationId,
            profile: DtoSerialization.fromSegments(results.profile),
            ceilings: results.ceilings,
            events: DtoSerialization.fromEvents(results.algorithmEvents)
        });
```

- [ ] **Step 5: Remove the planner model, calculator and unused members**

```bash
git rm projects/planner/src/app/shared/computer/computer.model.ts projects/planner/src/app/shared/computer/computerProfile.ts projects/planner/src/app/shared/computer/computerProfile.spec.ts
```

In `models.ts`, remove the `BoundEvent.type` and `BoundEvent.depthMeters` getters; nothing uses them any more. Keep `gasName`, which `chartEventText` uses. In `models.spec.ts`, remove the specs "Exposes event type" and "Depth in meters with imperial units". Remove `EventType` from the spec's imports if it is no longer used.

Check that nothing references the removed code:
`grep -rn "\.depthMeters\b\|computer\.model\|computerProfile'\|noDecoLimitsSequence\|PlanningTasks.noDecoLimits" projects/planner/src`
Expected: no matches. `WayPoint.startDepthMeters` / `endDepthMeters` are different members and stay.

- [ ] **Step 6: Run the tests to check they pass**

Run: `npx ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/background-task.spec.ts' --include='**/workers/computer.tasks.spec.ts' --include='**/computer/*.spec.ts' --include='**/shared/models.spec.ts'`
Expected: 0 failures.

- [ ] **Step 7: Full suite, lint, production build and worker bundle check**

Run:

- `npm run test-ci`;
- `npx eslint -c projects/planner/eslint.config.mjs` on all files changed by this task;
- `npm run build`.

Expected:

- all specs pass, and the changed files have no lint errors;
- the build succeeds;
- in the "Lazy chunk files" table, `computer-worker` is roughly the size of `profile-worker` (about 150 kB) instead of 427 kB, which shows Angular is no longer bundled into the worker. Record the size in the task report.

- [ ] **Step 8: Commit**

```bash
git add projects/planner/src/app/workers projects/planner/src/app/shared/serialization.model.ts projects/planner/src/app/shared/computer projects/planner/src/app/shared/models.ts projects/planner/src/app/shared/models.spec.ts
git commit -m "refactor: #106 calculate computer data by scuba-physics"
```

---

### Task 6: Performance test in the library (L7)

- [x] Status

**Files:**

- Create: `projects/scuba-physics/src/lib/computer/DiveComputer.performance.spec.ts`
- Create: `projects/scuba-physics/karma.performance.conf.js`
- Delete: `projects/planner/src/app/workers/computer.performance.spec.ts`, `projects/planner/karma.performance.conf.js`
- Modify: `package.json` (`test-performance` targets the library; the library test scripts exclude performance specs)

**Interfaces:**

- Consumes: `DiveComputer.start / points / total`, `CalculatedDive` (Task 3).
- Produces: `npm run test-performance`. It runs `**/*.performance.spec.ts` of `scuba-physics` in headless Chrome with `--enable-precise-memory-info --js-flags=--expose-gc`, and logs one line per dive: `<dive>: <ms> ms, <points> points, peak heap +<MB> MB, retained heap +<MB> MB`.

**What is measured:** the computer calculation from the already calculated dive: the sampling plus the NDL of every point. That is the work the computer worker does. The dive itself (profile, ceilings, events) is calculated before the measurement starts, because the planner has already calculated it.

The dives are the same three as R17. They are built from library types with the library test options (GF 40/85, 20 m/min descent), so the numbers aren't directly comparable with the earlier planner measurement.

- [ ] **Step 1: Karma configuration and scripts**

`projects/scuba-physics/karma.performance.conf.js`:

```js
// Karma configuration for the performance tests, see "npm run test-performance"
const baseConfig = require('./karma.conf.js');

module.exports = function (config) {
  baseConfig(config);
  config.set({
    browsers: ['ChromeHeadlessPerformance'],
    customLaunchers: {
      ChromeHeadlessPerformance: {
        base: 'ChromeHeadless',
        // precise heap sizes and manual garbage collection for the memory measurement
        flags: ['--enable-precise-memory-info', '--js-flags=--expose-gc']
      }
    },
    singleRun: true,
    autoWatch: false,
    restartOnFileChange: false,
    // the longest dive is calculated synchronously for seconds without reporting any progress
    browserNoActivityTimeout: 30 * 60 * 1000
  });
};
```

In `package.json`:

- `test-performance`: `ng test --project scuba-physics --karma-config projects/scuba-physics/karma.performance.conf.js --no-watch --include=**/*.performance.spec.ts`;
- `test-lib`: append ` --exclude **/*.performance.spec.ts`;
- `test-lib-ci`: append ` --exclude **/*.performance.spec.ts`, keeping the existing `performanceTests.spec.ts` exclude.

Delete the planner files:

```bash
git rm projects/planner/src/app/workers/computer.performance.spec.ts projects/planner/karma.performance.conf.js
```

- [ ] **Step 2: Write the performance test**

`projects/scuba-physics/src/lib/computer/DiveComputer.performance.spec.ts`:

```ts
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams, durationFor } from '../algorithm/BuhlmannAlgorithmParameters';
import { OptionExtensions } from '../algorithm/Options.spec';
import { ProfileEvents } from '../algorithm/ProfileEvents';
import { Segments } from '../depths/Segments';
import { GasDensity } from '../gases/GasDensity';
import { Gas, Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { RunTimePoint } from './ComputerData';
import { CalculatedDive, DiveComputer } from './DiveComputer';

/** Chrome only, precise values require --enable-precise-memory-info, see karma.performance.conf.js */
interface ChromeMemory {
    usedJSHeapSize: number;
}

interface Measurement {
    durationMs: number;
    points: number;
    peakHeapMb: number;
    retainedHeapMb: number;
}

/** in bytes, NaN if not supported by the browser */
const usedHeap = (): number => {
    const memory = (performance as unknown as { memory?: ChromeMemory }).memory;
    return memory?.usedJSHeapSize ?? Number.NaN;
};

/** Requires --js-flags=--expose-gc, see karma.performance.conf.js */
const garbageCollector = (): (() => void) | undefined => (globalThis as unknown as { gc?: () => void }).gc;

const collectGarbage = (): void => {
    garbageCollector()?.();
};

const toMegaBytes = (bytes: number): number => Math.round(bytes / 1024 / 1024 * 100) / 100;

describe('Dive computer performance', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    const algorithm = new BuhlmannAlgorithm();

    /** Descent at the descent speed, then staying at the depth, so the plan takes the given minutes */
    const createDive = (depth: number, minutes: number, bottomGas: Gas, decoGases: Gas[] = []): AlgorithmParams => {
        const gases = new Gases();
        gases.add(bottomGas);
        decoGases.forEach(g => gases.add(g));
        const segments = new Segments();
        const descent = durationFor(depth, options.descentSpeed);
        segments.add(depth, bottomGas, descent);
        segments.addFlat(bottomGas, Time.oneMinute * minutes - descent);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
    };

    /** Calculates the dive the same way as the planner does: profile, ceilings and all events */
    const calculateDive = (dive: AlgorithmParams): CalculatedDive => {
        const profile = algorithm.decompression(dive).segments;
        const calculatedSegments = Segments.fromCollection(profile);
        const calculatedDive = AlgorithmParams.forMultilevelDive(calculatedSegments, dive.gases, dive.options, dive.breathing);
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

    /** Calculates complete computer data of already calculated dive and measures it */
    const measure = (name: string, dive: AlgorithmParams): Measurement => {
        const calculated = calculateDive(dive);
        const points: RunTimePoint[] = [];
        collectGarbage();
        const heapBefore = usedHeap();
        let peakHeap = heapBefore;
        const start = performance.now();

        const computer = DiveComputer.start(calculated);

        for (const point of computer.points()) {
            points.push(point);
            peakHeap = Math.max(peakHeap, usedHeap());
        }

        const durationMs = performance.now() - start;
        collectGarbage();
        // points and computer are still referenced, so the retained heap contains the complete computer data
        const retainedHeap = usedHeap();
        const result: Measurement = {
            durationMs: Math.round(durationMs),
            points: points.length,
            peakHeapMb: toMegaBytes(peakHeap - heapBefore),
            retainedHeapMb: toMegaBytes(retainedHeap - heapBefore)
        };

        console.log(`${name}: ${result.durationMs} ms, ${result.points} points, ` +
            `peak heap +${result.peakHeapMb} MB, retained heap +${result.retainedHeapMb} MB`);

        expect(result.points).toEqual(computer.total);
        expect(result.points).toBeGreaterThan(0);
        return result;
    };

    it('Memory measurement is available', () => {
        expect(usedHeap()).not.toBeNaN();
        expect(garbageCollector()).toBeDefined();
    });

    it('30 m for 30 min on air', () => {
        measure('30 m / 30 min, air', createDive(30, 30, StandardGases.air));
    });

    it('60 m for 200 min on air', () => {
        measure('60 m / 200 min, air', createDive(60, 200, StandardGases.air));
    });

    it('80 m for 30 min on trimix 12/65 with EAN50, oxygen, trimix 21/35 and trimix 35/25', () => {
        const decoGases = [StandardGases.ean50, StandardGases.oxygen, StandardGases.trimix2135, StandardGases.trimix3525];
        measure('80 m / 30 min, trimix 12/65 + EAN50, O2, 21/35, 35/25', createDive(80, 30, new Gas(0.12, 0.65), decoGases));
    });
});
```

- [ ] **Step 3: Check the test can fail**

Temporarily change `expect(result.points).toBeGreaterThan(0);` to `expect(result.points).toBeLessThan(0);`.
Run: `npm run test-performance`.
Expected: the 3 dive specs FAIL with "Expected <points> to be less than 0.". Revert the change.

- [ ] **Step 4: Run the performance test**

Run: `npm run test-performance`.
Expected: 4 specs, 0 failures. Copy the three measurement lines into the task report.

- [ ] **Step 5: CI and lint**

Run:

- `npm run test-lib-ci`. Expected: passes and doesn't run the performance spec.
- `npm run test-ci`. Expected: passes.
- `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/computer/DiveComputer.performance.spec.ts`. Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/computer/DiveComputer.performance.spec.ts projects/scuba-physics/karma.performance.conf.js projects/planner/src/app/workers/computer.performance.spec.ts projects/planner/karma.performance.conf.js package.json
git commit -m "test: #106 dive computer performance test in scuba-physics"
```
