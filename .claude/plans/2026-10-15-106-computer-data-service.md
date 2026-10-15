# #106 Dive Computer Data Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Project override (CLAUDE.md):** implement ONE task per request, run its verification (tests + `npm run lint`), tick its `- [ ] Status` checkbox, then STOP for review.

**Goal:** Provide an injectable service which, for the dive selected within the service, publishes an observable `ComputerData` (per-second dive computer readings) as the data source for the future dive computer simulator page (#106).

**Architecture:** A pure calculator class `ComputerProfile` turns a calculated `DiveResults` (way points + ceilings) into one `RunTimePoint` per second of the dive. An Angular service `ComputerProfileService` owns its own dive selection (first dive by default, independent of the planner's `DiveSchedules.selected`), listens to `ReloadDispatcher` events (dive calculated, dive removed) and re-publishes the result via a `BehaviorSubject`. NDL per second comes from a new `scuba-physics` method `BuhlmannAlgorithm.noDecoLimits`, which runs in the computer worker. From Task 4 on, the whole calculation runs in a worker that streams the points with progress. Stage 3 adds events to `ComputerData`: warnings copied from `DiveResults.events`, plus Stop and safety stop events, which `RunTimePoint.nextStop` points to. Everything lives in the new directory `projects/planner/src/app/shared/computer/` (a sibling of `shared/diff/`).

**Tech Stack:** Angular (standalone, `@Injectable` services), RxJS, `scuba-physics` (`Ceiling`, `Segment`), Karma/Jasmine.

**Spec:** the #106 request in this session (summarized in **Requirements** below) + GitHub issue #106 "Dive computer simulator".

## Requirements

Stage 1

> **Dive selection:** throughout this plan, "selected dive" means the dive selected **within `ComputerProfileService`**, never `DiveSchedules.selected` (the planner's selection). By default the first dive is selected.

- R1: Turn the prototype `ComputerProfile` class (from `shared/serialization.model.computer.ts`) into a service. Use the prototype only as an example.
- R2: The service stores its own selected dive. By default the first dive is selected; it changes only by `ComputerProfileService.select(index)`.
- R3: `ComputerData` is recalculated automatically when the service's selected dive changes, or when `PlannerService` finishes calculating that dive.
- R4: The service and the whole data model go into a new directory, next to `shared/diff/`.
- R5: `RunTimePoint` is created for every second of the selected dive's profile.

Stage 2: every value is the current value at a given moment. It changes every second, so it is a property of `RunTimePoint` (next to `depth`/`ceiling`), not a single value on `ComputerData`.

- R6: Maximum depth in meters: the current maximum depth at that moment, i.e. the deepest depth reached so far.
- R7: Average depth in meters: the current average depth at that moment, i.e. what the dive computer shows as AVG at that second (time weighted over the dive from its start to that moment).
- R8: NoDecoLimit: the current NDL at that moment, i.e. the number of seconds until the ceiling becomes non-zero if the diver stays at the current depth on the current gas. It is `0` while the ceiling is non-zero. A new NDL is calculated for the moment whenever the depth (or gas) changes, after the deco ceiling is cleared, and before any ceiling. While the diver stays on the same level, it counts down. `Infinity` at the surface or above 1000 minutes. The algorithm is a new `scuba-physics` method; the computer worker runs it for the selected dive and streams it point by point. `ndl` already exists on `RunTimePoint` and gets filled in.

Stage 3: events

- R9: Copy the high ppO2, low ppO2, broken ceiling and gas switch events from `DiveResults.events` into `ComputerData.events`.
- R10: Add a safety stop event, with `depth` and `duration` like a stop, created from the `DiveResults` safety stop event.
- R11: Add new Stop events, which exist only in the computer data and have `depth` and `duration`. Create one for every flat profile segment that meets all three conditions:
  - it comes after the deepest point of the dive (during the ascent);
  - it isn't user defined;
  - the ceiling is non-zero at its start.

  A gas switch way point is handled like any other flat segment: when the ceiling is non-zero at its start, it becomes a Stop (and stays a gas switch event too); otherwise it is only the gas switch event. This applies to a pure switch way point and to a switch merged with the stop that follows it at the same depth.
- R12: Add `nextStop` to `RunTimePoint`: the next stop event (Stop or safety stop) the diver still has to finish, including the stop in progress. When a Stop overlaps the safety stop, point to the Stop, never to the safety stop.

Stage 4: background calculation

- R13: Move the computer data calculation into a worker thread. The worker contains the whole procedure for everything needed to get `ComputerData`: decompression profile, ceilings, events, stops, depths and NDL.
- R14: The worker streams its results: it reports every `RunTimePoint` as soon as it is calculated.
- R15: A selected dive change, or the selected dive being calculated, interrupts the running calculation. The service then resets its computer data to empty and starts a new calculation.
- R16: The service has a new observable `progress$` with the percentage of `RunTimePoint`s already calculated. It is reset to 0 whenever a new calculation starts, updated for every point the worker reports, and ends at 100 when the calculation finishes.

Stage 5: performance

- R17: A final performance test measures, for each of three dives, how long the complete `ComputerData` calculation takes and how much memory it consumes during the execution:
  1. 30 m for 30 min on air;
  2. 60 m for 200 min on air;
  3. 80 m for 30 min with trimix 12/65, EAN50, oxygen, trimix 21/35 and trimix 35/25.

## Global Constraints

- Branch: `feat/106-computer-simulator` (renamed from `computer_simulator`), rebased on the latest `origin/master`.
- Commit messages: Conventional Commits with the issue prefix, e.g. `feat: #106 computer profile service`.
- New directory: `projects/planner/src/app/shared/computer/`.
- All depths in the model are in **meters** and all times are in **seconds**, whatever the user's unit settings (use `WayPoint.startDepthMeters`/`endDepthMeters`, never `startDepth`/`endDepth`).
- Keep the worker DTOs in `serialization.model.ts` and both factories (`WorkersFactory`, `WorkersFactoryCommon`) in sync (CLAUDE.md).
- After changing `scuba-physics`, run `npm run build-lib` before planner tests (the planner consumes the built library).
- Register the new service in the `SERVICES` array in `projects/planner/src/app/app.config.ts`.
- No UI, no i18n keys and no E2E in this plan (the page doesn't exist yet). Events carry no user-facing text (no `message`): the future page translates them by `ComputerEventType`, per the ngx-translate rule in CLAUDE.md.
- ESLint: 4-space indent, single quotes, semicolons, 140-char lines. Run `npm run lint` before finishing each task.
- Planner tests: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`.

## Review Focus

1. **Profile not calculated, calculation failed, or interrupted.** The service must publish empty data (`profile: []`), not throw or mix data from different calculations. Late messages from an interrupted worker calculation must be ignored. Covered by Task 2 tests ("not calculated", "failed") and Task 4 tests ("ignores messages of interrupted calculation", "worker failure").
2. **Selected dive removed, or planner selection changed.** If the service's selected dive is removed (`DiveSchedules.remove()`, or `clear()` when all dives are reloaded), the service falls back to the first dive and recalculates. Changing the planner's own selection (`DiveSchedules.selected`, `add()`) must not affect the service. Covered by Task 2 tests ("removed", "ignores planner selection").
3. **Imperial units.** Depths in points and events must still be in meters. `BoundEvent.depth` is in user units, so events use the new `BoundEvent.depthMeters`. Covered by the Task 1 test "depth in meters with imperial units" and the Task 7 test "event depth in meters with imperial units".
4. **Last deco stop at the safety stop depth.** On a deco dive, the last 3 m stop and the safety stop overlap. `nextStop` must show the Stop, also while the diver is at that stop, and must not show a stop the diver has already finished. Covered by Task 9 tests ("overlapping safety stop", "current stop", "after last stop").
5. **NDL after deco is cleared, or before any ceiling, while depth changes.** A new NDL must be predicted for that moment from the current tissues, depth and gas. It must count down only while the diver stays on the same level. It must not count down from the 0 of the deco phase, and it must not stay at a stale value during ascents or descents. Covered by Task 5 tests ("new prediction when depth changes", "new prediction after deco cleared", "counts down"). Shallow seconds can take up to 1000 simulated minutes each; this runs in the computer worker (Task 6), not on the main thread.

---

### Task 1: Data model + per-second `ComputerProfile` calculator (Stage 1, R1/R4/R5)

- [x] Status

**Files:**

- Create: `projects/planner/src/app/shared/computer/computer.model.ts`
- Create: `projects/planner/src/app/shared/computer/computerProfile.ts`
- Test: `projects/planner/src/app/shared/computer/computerProfile.spec.ts`
- Delete: `projects/planner/src/app/shared/serialization.model.computer.ts`
- Modify: `projects/planner/src/app/shared/planner.service.ts` (revert the prototype lines added by commit `ca7f5a22`)

**Interfaces:**

- Produces:
  - `interface RunTimePoint { runTime: number; depth: number; ceiling: number; ndl: number; tts: number; }`
  - `interface Warning { runTime: number; eventType: EventType; message: string; }`
  - `interface ComputerData { profile: RunTimePoint[]; events: Warning[]; }`
  - `class ComputerProfile { static empty(): ComputerData; static calculate(dive: DiveResults): ComputerData; }`

- [ ] **Step 1: Rebase the branch on the latest master**

```bash
git fetch origin
git rebase origin/master
```

Expected: clean rebase (the branch only adds files plus a small `planner.service.ts` change). Don't push. The remote branch is still named `computer_simulator`, and renaming it on the remote is the user's decision.

- [ ] **Step 2: Remove the prototype**

In `projects/planner/src/app/shared/planner.service.ts`, restore the import line to `import { BoundEvent } from './models';`. Delete the `ComputerProfile` import and these two lines in `finishDiveInfo`:

```ts
        const computerProfile = ComputerProfile.calculate(diveResult);
        const serializedProfile = JSON.stringify(computerProfile);
```

Then delete `projects/planner/src/app/shared/serialization.model.computer.ts`.

(The `Warning` interface below is kept from the prototype for now. Task 7 replaces it with the Stage 3 event model.)
Check: `git diff origin/master -- projects/planner/src/app/shared/planner.service.ts` prints nothing.

- [ ] **Step 3: Create the model**

`projects/planner/src/app/shared/computer/computer.model.ts`:

```ts
import { EventType } from 'scuba-physics';

/** One sample of the dive computer readings */
export interface RunTimePoint {
    /** in seconds since start of the dive */
    runTime: number;
    /** current depth in meters */
    depth: number;
    /** current ceiling in meters */
    ceiling: number;
    /** remaining no decompression time in seconds */
    ndl: number;
    /**
     * Not the total runtime to end of the dive, but current time to surface at this point in the dive profile.
     * This will require calculate the profile for every second of the dive - performance hit maybe not feasible.
     * in seconds.
     **/
    tts: number;
}

export interface Warning {
    /** in seconds */
    runTime: number;
    eventType: EventType;
    message: string;
}

/**
 * Model to generate data for computer visualization.
 * Sampling for every second of the dive.
 */
export interface ComputerData {
    profile: RunTimePoint[];
    events: Warning[];
}
```

- [ ] **Step 4: Write the failing tests**

`projects/planner/src/app/shared/computer/computerProfile.spec.ts`:

```ts
import { Ceiling, HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveResults } from '../diveresults';
import { UnitConversion } from '../UnitConversion';
import { WayPoint } from '../wayPoint';
import { ComputerProfile } from './computerProfile';

describe('ComputerProfile', () => {
    const tissues = ProfileTissues.createAtSurface(0);

    /** Ceilings are sampled every second starting at 1 s, the same way the algorithm does it */
    const ceilingsFrom = (depths: number[]): Ceiling[] => depths.map((depth, index) => new Ceiling(index + 1, depth));

    const createResults = (segments: Segment[], ceilings: Ceiling[] = [], noDecoTime = 0,
        units = new UnitConversion()): DiveResults => {
        const results = new DiveResults();
        let offset = 0;
        const wayPoints = segments.map((segment) => {
            const wayPoint = WayPoint.fromSegment(units, segment, offset);
            offset += segment.duration;
            return wayPoint;
        });
        results.updateProfile(wayPoints, tissues);
        results.updateDiveInfo(noDecoTime, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), ceilings, [], []);
        return results;
    };

    const air = StandardGases.air;
    // descent to 10 m in 60 s, then 60 s at 10 m
    const simpleDive = [
        new Segment(0, 10, air, 60),
        new Segment(10, 10, air, 60)
    ];

    it('Empty profile results in no points', () => {
        const data = ComputerProfile.calculate(createResults([]));
        expect(data.profile).toEqual([]);
        expect(data.events).toEqual([]);
    });

    it('Empty data has no points', () => {
        expect(ComputerProfile.empty()).toEqual({ profile: [], events: [] });
    });

    it('Creates point for every second including start and end', () => {
        const data = ComputerProfile.calculate(createResults(simpleDive));
        expect(data.profile.length).toEqual(121);
        expect(data.profile.map(p => p.runTime)).toEqual(Array.from({ length: 121 }, (_, i) => i));
    });

    it('Interpolates depth within way point', () => {
        const profile = ComputerProfile.calculate(createResults(simpleDive)).profile;
        expect(profile[0].depth).toBeCloseTo(0, 6);
        expect(profile[30].depth).toBeCloseTo(5, 6);
        expect(profile[60].depth).toBeCloseTo(10, 6);
        expect(profile[90].depth).toBeCloseTo(10, 6);
    });

    it('Depth in meters with imperial units', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const profile = ComputerProfile.calculate(createResults(simpleDive, [], 0, units)).profile;
        expect(profile[90].depth).toBeCloseTo(10, 6);
    });

    it('Fractional duration ends at last whole second', () => {
        const profile = ComputerProfile.calculate(createResults([new Segment(0, 10, air, 90.5)])).profile;
        expect(profile.length).toEqual(91);
        expect(profile[90].runTime).toEqual(90);
        expect(profile[90].depth).toBeCloseTo(9.945, 3);
    });

    it('Ceiling taken from latest ceiling sample at the same or earlier time', () => {
        const ceilings = ceilingsFrom([0, 0, 3, 3.5]);
        const profile = ComputerProfile.calculate(createResults(simpleDive, ceilings)).profile;
        expect(profile[0].ceiling).toEqual(0);
        expect(profile[2].ceiling).toEqual(0);
        expect(profile[3].ceiling).toEqual(3);
        expect(profile[4].ceiling).toEqual(3.5);
        // no more samples, last known ceiling is kept
        expect(profile[100].ceiling).toEqual(3.5);
    });
});
```

- [ ] **Step 5: Run the tests to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Cannot find module './computerProfile'".

- [ ] **Step 6: Write the minimal implementation**

`projects/planner/src/app/shared/computer/computerProfile.ts`:

```ts
import { DiveResults } from '../diveresults';
import { WayPoint } from '../wayPoint';
import { ComputerData, RunTimePoint } from './computer.model';

/** Samples calculated dive results for every second of the dive. */
export class ComputerProfile {
    public static empty(): ComputerData {
        return {
            profile: [],
            events: []
        };
    }

    public static calculate(dive: DiveResults): ComputerData {
        const wayPoints = dive.wayPoints;

        if (wayPoints.length === 0) {
            return ComputerProfile.empty();
        }

        const ceilings = dive.ceilings;
        const duration = Math.floor(wayPoints[wayPoints.length - 1].endTime);
        const profile: RunTimePoint[] = [];
        let wayPointIndex = 0;
        let ceilingIndex = 0;
        let ceiling = 0;

        for (let runTime = 0; runTime <= duration; runTime++) {
            while (wayPointIndex < wayPoints.length - 1 && wayPoints[wayPointIndex].endTime < runTime) {
                wayPointIndex++;
            }

            while (ceilingIndex < ceilings.length && ceilings[ceilingIndex].time <= runTime) {
                ceiling = ceilings[ceilingIndex].depth;
                ceilingIndex++;
            }

            profile.push({
                runTime: runTime,
                depth: ComputerProfile.depthAt(wayPoints[wayPointIndex], runTime),
                ceiling: ceiling,
                ndl: 0,
                tts: 0
            });
        }

        return {
            profile: profile,
            events: []
        };
    }

    /** Linear interpolation of the depth in meters within the way point */
    private static depthAt(wayPoint: WayPoint, runTime: number): number {
        const duration = wayPoint.endTime - wayPoint.startTime;

        if (duration <= 0) {
            return wayPoint.endDepthMeters;
        }

        const elapsed = Math.min(Math.max(runTime - wayPoint.startTime, 0), duration);
        const depthChange = wayPoint.endDepthMeters - wayPoint.startDepthMeters;
        return wayPoint.startDepthMeters + depthChange * elapsed / duration;
    }
}
```

- [ ] **Step 7: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: 7 specs, 0 failures.

- [ ] **Step 8: Lint and run the full planner suite**

Run: `npm run lint` then `npm run test-ci`
Expected: no lint errors, all specs pass.

- [ ] **Step 9: Commit**

```bash
git add projects/planner/src/app/shared/computer projects/planner/src/app/shared/planner.service.ts projects/planner/src/app/shared/serialization.model.computer.ts
git commit -m "feat: #106 sample computer profile for every second of the dive"
```

---

### Task 2: `ComputerProfileService` with its own dive selection (Stage 1, R1/R2/R3)

- [x] Status

**Files:**

- Create: `projects/planner/src/app/shared/computer/computer-profile.service.ts`
- Test: `projects/planner/src/app/shared/computer/computer-profile.service.spec.ts`
- Modify: `projects/planner/src/app/app.config.ts` (import + add to `SERVICES` after `ProfileComparatorService`)

**Interfaces:**

- Consumes: `ComputerProfile.empty()`, `ComputerProfile.calculate(dive: DiveResults)`, `ComputerData` (Task 1); `DiveSchedules.dives`, `DiveSchedule.index / id / diveResult`, `ReloadDispatcher.infoCalculated$ / depthChanged$`. It does **not** use `DiveSchedules.selected` or `ReloadDispatcher.selectedChanged$`.
- Produces:
  - `class ComputerProfileService extends Streamed`
  - `get selectedDive(): DiveSchedule`: the dive selected within the service (first dive by default), which the current data was calculated from
  - `get selectedIndex(): number`: index of `selectedDive` in `DiveSchedules.dives`
  - `select(index: number): void`: selects another dive and recalculates; ignores an out-of-range index or the already selected dive
  - `get computerData(): ComputerData`: last published value
  - `readonly computerData$: Observable<ComputerData>`: replays the last value to new subscribers (`BehaviorSubject`)

- [ ] **Step 1: Write the failing tests**

`projects/planner/src/app/shared/computer/computer-profile.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { WayPoint } from '../wayPoint';
import { ComputerData } from './computer.model';
import { ComputerProfileService } from './computer-profile.service';

describe('ComputerProfileService', () => {
    let sut: ComputerProfileService;
    let schedules: DiveSchedules;
    let dispatcher: ReloadDispatcher;
    let units: UnitConversion;
    let published: ComputerData[];

    /** Simulates PlannerService finishing calculation of a dive with given duration in seconds */
    const calculate = (dive: DiveSchedule, duration: number): void => {
        const results = dive.diveResult;
        results.start();
        results.updateProfile([WayPoint.fromSegment(units, new Segment(0, 0, StandardGases.air, duration))],
            ProfileTissues.createAtSurface(0));
        results.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
        results.updateConsumption(0, 0, 0, 0, 0, false, false, []);
        dispatcher.sendInfoCalculated(dive.id);
    };

    const lastPublished = (): ComputerData => published[published.length - 1];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ComputerProfileService, DiveSchedules, ReloadDispatcher, UnitConversion]
        });

        schedules = TestBed.inject(DiveSchedules);
        dispatcher = TestBed.inject(ReloadDispatcher);
        units = TestBed.inject(UnitConversion);
        sut = TestBed.inject(ComputerProfileService);
        published = [];
        sut.computerData$.subscribe(d => published.push(d));
    });

    it('Selects first dive by default', () => {
        expect(sut.selectedDive).toBe(schedules.dives[0]);
        expect(sut.selectedIndex).toEqual(0);
    });

    it('Selects first dive by default even if planner selected another dive', () => {
        schedules.add(); // DiveSchedules.add selects the added dive in the planner
        const newSut = new ComputerProfileService(schedules, dispatcher);
        expect(newSut.selectedDive).toBe(schedules.dives[0]);
    });

    it('Publishes empty data when selected dive is not calculated', () => {
        expect(published.length).toEqual(1);
        expect(lastPublished().profile).toEqual([]);
    });

    it('Recalculates when selected dive is calculated', () => {
        calculate(schedules.dives[0], 10);
        expect(lastPublished().profile.length).toEqual(11);
        expect(sut.computerData).toBe(lastPublished());
    });

    it('Publishes empty data when calculation failed', () => {
        const first = schedules.dives[0];
        calculate(first, 10);
        first.diveResult.endFailed();
        dispatcher.sendInfoCalculated(first.id);
        expect(lastPublished().profile).toEqual([]);
    });

    it('Ignores calculation of not selected dive', () => {
        const second = schedules.add();
        const countBefore = published.length;
        calculate(second, 10);
        expect(published.length).toEqual(countBefore);
        expect(sut.selectedDive).toBe(schedules.dives[0]);
    });

    it('Recalculates when other dive selected', () => {
        const second = schedules.add();
        calculate(second, 20);
        sut.select(1);
        expect(sut.selectedDive).toBe(second);
        expect(sut.selectedIndex).toEqual(1);
        expect(lastPublished().profile.length).toEqual(21);
    });

    it('Selecting already selected dive does not recalculate', () => {
        const countBefore = published.length;
        sut.select(0);
        expect(published.length).toEqual(countBefore);
    });

    it('Ignores out of range selection', () => {
        const countBefore = published.length;
        sut.select(-1);
        sut.select(1);
        expect(sut.selectedIndex).toEqual(0);
        expect(published.length).toEqual(countBefore);
    });

    it('Ignores planner selection', () => {
        schedules.add();
        const countBefore = published.length;
        schedules.setSelectedIndex(1); // fires selectedChanged$
        expect(sut.selectedDive).toBe(schedules.dives[0]);
        expect(published.length).toEqual(countBefore);
    });

    it('Selects first dive when selected dive removed', () => {
        const first = schedules.dives[0];
        calculate(first, 10);
        const second = schedules.add();
        calculate(second, 30);
        sut.select(1);
        schedules.remove(second); // fires depthChanged$
        expect(sut.selectedDive).toBe(first);
        expect(lastPublished().profile.length).toEqual(11);
    });

    it('Keeps selection when other dive removed', () => {
        const second = schedules.add();
        const third = schedules.add();
        calculate(third, 30);
        sut.select(2);
        const countBefore = published.length;
        schedules.remove(second);
        expect(sut.selectedDive).toBe(third);
        expect(sut.selectedIndex).toEqual(1);
        expect(published.length).toEqual(countBefore);
    });

    it('Selects first dive when selected dive cleared without depth change event', () => {
        schedules.add();
        sut.select(1);
        schedules.clear(); // used when all dives are reloaded, fires no event
        calculate(schedules.dives[0], 10);
        expect(sut.selectedDive).toBe(schedules.dives[0]);
        expect(lastPublished().profile.length).toEqual(11);
    });
});
```

- [ ] **Step 2: Run the tests to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Cannot find module './computer-profile.service'".

- [ ] **Step 3: Write the minimal implementation**

`projects/planner/src/app/shared/computer/computer-profile.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { Streamed } from '../streamed';
import { ComputerData } from './computer.model';
import { ComputerProfile } from './computerProfile';

/**
 * Source data for the dive computer simulator.
 * Keeps its own dive selection (first dive by default), independent of the planner selected dive,
 * and keeps computer data of the selected dive up to date.
 */
@Injectable()
export class ComputerProfileService extends Streamed {
    public readonly computerData$: Observable<ComputerData>;
    private _selectedDive: DiveSchedule;
    private readonly onComputerData: BehaviorSubject<ComputerData>;

    constructor(private schedules: DiveSchedules, private dispatcher: ReloadDispatcher) {
        super();
        this._selectedDive = this.schedules.dives[0];
        this.onComputerData = new BehaviorSubject<ComputerData>(this.calculate());
        this.computerData$ = this.onComputerData.asObservable();

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.diveCalculated(diveId));

        // In case dive removed
        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.resetIfRemoved());
    }

    /** The dive selected within this service, the current computer data was calculated from */
    public get selectedDive(): DiveSchedule {
        return this._selectedDive;
    }

    public get selectedIndex(): number {
        return this._selectedDive.index;
    }

    public get computerData(): ComputerData {
        return this.onComputerData.value;
    }

    private get selectedRemoved(): boolean {
        return !this.schedules.dives.includes(this._selectedDive);
    }

    public select(index: number): void {
        const dives = this.schedules.dives;

        if (index < 0 || index >= dives.length || dives[index] === this._selectedDive) {
            return;
        }

        this._selectedDive = dives[index];
        this.refresh();
    }

    private diveCalculated(diveId?: number): void {
        // dives may be cleared and reloaded without depth changed event
        if (this.selectedRemoved) {
            this.selectFirst();
            return;
        }

        if (diveId === undefined || diveId === this._selectedDive.id) {
            this.refresh();
        }
    }

    private resetIfRemoved(): void {
        if (this.selectedRemoved) {
            this.selectFirst();
        }
    }

    private selectFirst(): void {
        this._selectedDive = this.schedules.dives[0];
        this.refresh();
    }

    private refresh(): void {
        this.onComputerData.next(this.calculate());
    }

    private calculate(): ComputerData {
        const results = this._selectedDive.diveResult;

        if (results.failed || !results.profileCalculated || !results.diveInfoCalculated) {
            return ComputerProfile.empty();
        }

        return ComputerProfile.calculate(results);
    }
}
```

- [ ] **Step 4: Register the service**

In `projects/planner/src/app/app.config.ts`, add the import next to the `ProfileComparatorService` import:

```ts
import { ComputerProfileService } from './shared/computer/computer-profile.service';
```

and add `ComputerProfileService,` to the `SERVICES` array right after `ProfileComparatorService,`.

- [ ] **Step 5: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: 20 specs (7 + 13), 0 failures.

- [ ] **Step 6: Lint and run the full planner suite**

Run: `npm run lint` then `npm run test-ci`
Expected: no lint errors, all specs pass.

- [ ] **Step 7: Commit**

```bash
git add projects/planner/src/app/shared/computer projects/planner/src/app/app.config.ts
git commit -m "feat: #106 computer profile service for selected dive"
```

---

### Task 3: Maximum and average depth per second (Stage 2, R6/R7)

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/shared/computer/computer.model.ts` (`RunTimePoint`)
- Modify: `projects/planner/src/app/shared/computer/computerProfile.ts` (`calculate`)
- Test: `projects/planner/src/app/shared/computer/computerProfile.spec.ts`

**Interfaces:**

- Consumes: `ComputerProfile.calculate` and the `createResults` / `simpleDive` test helpers (Task 1).
- Produces: `RunTimePoint.maxDepth: number` (meters, current maximum depth at that moment) and `RunTimePoint.averageDepth: number` (meters, current average depth at that moment: time weighted from dive start to `runTime`; `0` at `runTime` 0).

- [ ] **Step 1: Write the failing tests** (append inside the `describe` in `computerProfile.spec.ts`)

```ts
    describe('Depth statistics', () => {
        // 0 -> 30 m in 60 s, 60 s at 30 m, ascent 30 -> 10 m in 60 s
        const diveWithAscent = [
            new Segment(0, 30, air, 60),
            new Segment(30, 30, air, 60),
            new Segment(30, 10, air, 60)
        ];

        it('Maximum depth is current maximum depth at the moment', () => {
            const profile = ComputerProfile.calculate(createResults(diveWithAscent)).profile;
            expect(profile[0].maxDepth).toBeCloseTo(0, 6);
            expect(profile[30].maxDepth).toBeCloseTo(15, 6);
            expect(profile[150].depth).toBeCloseTo(20, 6);
            expect(profile[150].maxDepth).toBeCloseTo(30, 6);
        });

        it('Average depth is zero at start', () => {
            const profile = ComputerProfile.calculate(createResults(simpleDive)).profile;
            expect(profile[0].averageDepth).toEqual(0);
        });

        it('Average depth is current time weighted average depth at the moment', () => {
            const profile = ComputerProfile.calculate(createResults(simpleDive)).profile;
            // descent 0 -> 10 m in 60 s: area 300 m*s / 60 s
            expect(profile[60].averageDepth).toBeCloseTo(5, 6);
            // + 60 s at 10 m: (300 + 600) / 120 s
            expect(profile[120].averageDepth).toBeCloseTo(7.5, 6);
        });
    });
```

- [ ] **Step 2: Run the tests to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Property 'maxDepth' does not exist on type 'RunTimePoint'".

- [ ] **Step 3: Extend the model**

In `computer.model.ts`, add after `depth` in `RunTimePoint`:

```ts
    /** current maximum depth at this moment in meters, the deepest depth reached so far */
    maxDepth: number;
    /** current average depth at this moment in meters, time weighted from start of the dive */
    averageDepth: number;
```

- [ ] **Step 4: Implement it in `calculate`**

In `computerProfile.ts`, replace the `for` loop in `calculate` with:

```ts
        let maxDepth = 0;
        let depthArea = 0; // meters * seconds
        let previousDepth = 0;

        for (let runTime = 0; runTime <= duration; runTime++) {
            while (wayPointIndex < wayPoints.length - 1 && wayPoints[wayPointIndex].endTime < runTime) {
                wayPointIndex++;
            }

            while (ceilingIndex < ceilings.length && ceilings[ceilingIndex].time <= runTime) {
                ceiling = ceilings[ceilingIndex].depth;
                ceilingIndex++;
            }

            const depth = ComputerProfile.depthAt(wayPoints[wayPointIndex], runTime);
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
```

- [ ] **Step 5: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: 23 specs, 0 failures.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add projects/planner/src/app/shared/computer
git commit -m "feat: #106 computer profile maximum and average depth"
```

---

### Task 4: Calculate computer data in a worker with streaming and progress (Stage 4, R13–R16)

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/workers/background-task.ts` (`IRestartableTask`, `RestartableBackgroundTask`)
- Create test: `projects/planner/src/app/workers/background-task.spec.ts`
- Create: `projects/planner/src/app/shared/planRequestFactory.ts`
- Modify: `projects/planner/src/app/shared/planner.service.ts` (`createPlanRequest` delegates to the factory)
- Modify: `projects/planner/src/app/shared/serialization.model.ts` (computer DTOs)
- Create: `projects/planner/src/app/workers/computer.tasks.ts` (the whole computer data procedure)
- Create test: `projects/planner/src/app/workers/computer.tasks.spec.ts`
- Create: `projects/planner/src/app/workers/computer.worker.ts`
- Modify: `projects/planner/src/app/shared/serial.workers.factory.ts` and `projects/planner/src/app/shared/workers.factory.ts` (`createComputerWorker`)
- Modify: `projects/planner/src/app/shared/computer/computerProfile.ts` (input type `ComputerSource`)
- Modify (rewrite): `projects/planner/src/app/shared/computer/computer-profile.service.ts`
- Modify (rewrite): `projects/planner/src/app/shared/computer/computer-profile.service.spec.ts`

**Interfaces:**

- Consumes: `ComputerProfile.calculate / empty`, `ComputerData`, `RunTimePoint` (Tasks 1, 3); service selection behavior (Task 2); `PlanningTasks.calculateDecompression / diveInfo`; `WayPointsService.calculateWayPoints`; `DtoSerialization.toTanks / toProfile / toEvents`; `DiveSchedules.previousDiveTissues(diveId): LoadedTissues`.
- Produces:
  - `PlanRequestFactory.create(dive: DiveSchedule, previousTissues: LoadedTissues): PlanRequestDto`, moved unchanged from `PlannerService.createPlanRequest`.
  - `interface IRestartableTask<TRequest, TResponse> extends IBackgroundTask<TRequest, TResponse> { cancel(): void; }` and `class RestartableBackgroundTask<TRequest, TResponse>(createWorker: () => Worker)`. `cancel()` terminates the worker and starts a new one.
  - DTOs in `serialization.model.ts`:
    - `ComputerRequestDto extends PlanRequestDto { calculationId: number; }`
    - `ComputerStartedDto { calculationId; type: 'started'; total: number; events: ComputerData['events'] }`
    - `ComputerPointDto { calculationId; type: 'point'; index: number; point: RunTimePoint }`. Task 9 changes `point` to `RunTimePointDto`.
    - `ComputerFinishedDto { calculationId; type: 'finished' }`
    - `type ComputerResultDto = ComputerStartedDto | ComputerPointDto | ComputerFinishedDto`
  - `ComputerTasks.calculate(task: ComputerRequestDto, post: (message: ComputerResultDto) => void): void`. It runs the whole procedure and posts, in order: `started` once, one `point` for every second, then `finished`. Later tasks extend it: NDL (Task 6), stops (Task 8), next stop (Task 9).
  - `WorkersFactoryCommon.createComputerWorker(): IRestartableTask<ComputerRequestDto, ComputerResultDto>`. The serial version calculates synchronously and its `cancel` does nothing.
  - `interface ComputerSource { readonly wayPoints: WayPoint[]; readonly ceilings: Ceiling[]; readonly events: BoundEvent[]; }`, exported from `computerProfile.ts`. `DiveResults` satisfies it, so the calculator tests keep passing `DiveResults`. `ComputerProfile.calculate(source: ComputerSource)`.
  - `ComputerProfileService`:
    - The constructor gets a third dependency, `WorkersFactoryCommon`.
    - `readonly progress$: Observable<number>`: the percentage (0–100) of the `RunTimePoint`s already calculated by the running calculation.
    - `computerData$` emits when a calculation starts (empty data), when the worker reports `started` (events, no points yet), and when it reports `finished` (all points). The `computerData` getter also shows the points collected so far.
    - The service no longer calls `ComputerProfile.calculate`; the worker does the whole calculation.
  - Test helpers in `computer-profile.service.spec.ts` that Task 9 extends: `FakeComputerTask`, `FakeWorkersFactory`, `point(runTime)`, `report(total, points, finish)`.

**Behavior:**

- **Starting a calculation.** A calculation is started by `refresh()`, which runs when the service's selected dive changes or when that dive has been calculated. `refresh()` does the following, in order:
  1. If a calculation is running, cancel it (terminate the worker).
  2. Increment `calculationId`.
  3. Reset the computer data to empty and the progress to `0`.
  4. Send a new request. This is skipped if the dive isn't calculated or its calculation failed; then the data stays empty and the progress stays `0`.
- **Handling messages.**
  - Messages carrying a different `calculationId` (from an interrupted calculation) are ignored.
  - Each `point` is appended, and the progress becomes `round(received * 100 / total)`.
  - On `finished`, the progress becomes `100`.
- **Worker failure.** If the worker fails (`failed$`), the data is reset to empty and the progress becomes `100`.

- [ ] **Step 1: Write the failing restartable task tests**

`projects/planner/src/app/workers/background-task.spec.ts`:

```ts
import { RestartableBackgroundTask } from './background-task';

describe('RestartableBackgroundTask', () => {
    let created: jasmine.SpyObj<Worker>[];
    let sut: RestartableBackgroundTask<number, string>;

    const createWorker = (): Worker => {
        const worker = jasmine.createSpyObj<Worker>('Worker', ['addEventListener', 'postMessage', 'terminate']);
        created.push(worker);
        return worker;
    };

    /** Simulates message from the worker */
    const reply = (worker: jasmine.SpyObj<Worker>, data: string): void => {
        const listener = worker.addEventListener.calls.all()
            .find(c => c.args[0] === 'message')!.args[1] as (m: MessageEvent<string>) => void;
        listener({ data: data } as MessageEvent<string>);
    };

    beforeEach(() => {
        created = [];
        sut = new RestartableBackgroundTask<number, string>(createWorker);
    });

    it('Posts request to the worker', () => {
        sut.calculate(1);
        expect(created[0].postMessage).toHaveBeenCalledWith(1);
    });

    it('Streams every message of the worker', () => {
        const received: string[] = [];
        sut.calculated$.subscribe(m => received.push(m));
        reply(created[0], 'a');
        reply(created[0], 'b');
        expect(received).toEqual(['a', 'b']);
    });

    it('Cancel terminates the worker and uses new one', () => {
        sut.cancel();
        sut.calculate(2);
        expect(created[0].terminate).toHaveBeenCalled();
        expect(created[1].postMessage).toHaveBeenCalledWith(2);
    });

    it('Reports messages of the new worker after cancel', () => {
        const received: string[] = [];
        sut.calculated$.subscribe(m => received.push(m));
        sut.cancel();
        reply(created[1], 'c');
        expect(received).toEqual(['c']);
    });
});
```

- [ ] **Step 2: Write the failing worker procedure tests**

`projects/planner/src/app/workers/computer.tasks.spec.ts`:

```ts
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { UnitConversion } from '../shared/UnitConversion';
import { PlanRequestFactory } from '../shared/planRequestFactory';
import {
    ComputerFinishedDto, ComputerPointDto, ComputerRequestDto,
    ComputerResultDto, ComputerStartedDto
} from '../shared/serialization.model';
import { ComputerTasks } from './computer.tasks';

describe('ComputerTasks', () => {
    /** Default dive of the planner, deepened to 40 m for 30 min to get deco stops */
    const createRequest = (): ComputerRequestDto => {
        const schedules = new DiveSchedules(new UnitConversion(), new ReloadDispatcher());
        const dive = schedules.selected;
        dive.depths.plannedDepth = 40;
        dive.depths.planDuration = 30;
        const request = PlanRequestFactory.create(dive, schedules.previousDiveTissues(dive.id));
        return { ...request, calculationId: 7 };
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

    it('Points are calculated from the planned dive', () => {
        const points = pointsOf(calculate(createRequest()));
        const maxDepth = points[points.length - 1].point.maxDepth;
        expect(maxDepth).toBeCloseTo(40, 6);
    });

    it('Empty plan posts no points', () => {
        const request = { ...createRequest(), plan: [] };
        const messages = calculate(request);
        expect(messages.map(m => m.type)).toEqual(['started', 'finished']);
        expect((messages[0] as ComputerStartedDto).total).toEqual(0);
    });
});
```

- [ ] **Step 3: Run them to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/*.spec.ts'`
Expected: compilation FAIL, "Module './background-task' has no exported member 'RestartableBackgroundTask'" / "Cannot find module './computer.tasks'".

- [ ] **Step 4: Implement the restartable task**

Append to `background-task.ts`:

```ts
export interface IRestartableTask<TRequest, TResponse> extends IBackgroundTask<TRequest, TResponse> {
    /** Stops running calculation, its remaining results are not reported */
    cancel(): void;
}

/** Background task streaming all messages of the worker, which can interrupt running calculation by replacing the worker */
export class RestartableBackgroundTask<TRequest, TResponse> implements IRestartableTask<TRequest, TResponse> {
    public calculated$: Observable<TResponse>;
    public failed$: Observable<void>;
    private onCalculated = new Subject<TResponse>();
    private onFailed = new Subject<void>();
    private worker: Worker;

    constructor(private createWorker: () => Worker) {
        this.calculated$ = this.onCalculated.asObservable();
        this.failed$ = this.onFailed.asObservable();
        this.worker = this.startWorker();
    }

    public calculate(request: TRequest): void {
        this.worker.postMessage(request);
    }

    public cancel(): void {
        this.worker.terminate();
        this.worker = this.startWorker();
    }

    private startWorker(): Worker {
        const worker = this.createWorker();
        worker.addEventListener('message', (m: MessageEvent<TResponse>) => this.onCalculated.next(m.data));
        worker.addEventListener('error', () => this.onFailed.next());
        return worker;
    }
}
```

- [ ] **Step 5: Extract the plan request**

Create `projects/planner/src/app/shared/planRequestFactory.ts`. Import `ITankBound` and `PlanRequestDto` from the same module `planner.service.ts` imports them from:

```ts
import { LoadedTissues } from 'scuba-physics';
import { DiveSchedule } from './dive.schedules';
import { DtoSerialization } from './dtoSerialization';
import { ITankBound, PlanRequestDto } from './serialization.model';

/** Creates algorithm request of the dive, shared by planner and dive computer */
export class PlanRequestFactory {
    public static create(dive: DiveSchedule, previousTissues: LoadedTissues): PlanRequestDto {
        const serializableTanks = dive.tanksService.tanks as ITankBound[];
        return {
            diveId: dive.id,
            tanks: DtoSerialization.fromTanks(serializableTanks),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
            previousTissues: DtoSerialization.fromTissues(previousTissues),
            surfaceInterval: dive.surfaceInterval
        };
    }
}
```

In `planner.service.ts`, replace the body of `createPlanRequest` with:

```ts
        const previousTissues = this.schedules.previousDiveTissues(dive.id);
        return PlanRequestFactory.create(dive, previousTissues);
```

Add `import { PlanRequestFactory } from './planRequestFactory';` and remove `ITankBound` from the imports if it's no longer used there.

- [ ] **Step 6: Add the DTOs**

Append to `serialization.model.ts` (add `import { ComputerData, RunTimePoint } from './computer/computer.model';`):

```ts
export interface ComputerRequestDto extends PlanRequestDto {
    /** Identifies the calculation, messages of interrupted calculations are ignored */
    calculationId: number;
}

export interface ComputerStartedDto {
    calculationId: number;
    type: 'started';
    /** Count of points, which will follow */
    total: number;
    events: ComputerData['events'];
}

export interface ComputerPointDto {
    calculationId: number;
    type: 'point';
    index: number;
    point: RunTimePoint;
}

export interface ComputerFinishedDto {
    calculationId: number;
    type: 'finished';
}

export type ComputerResultDto = ComputerStartedDto | ComputerPointDto | ComputerFinishedDto;
```

- [ ] **Step 7: Let the calculator accept any source**

In `computerProfile.ts`, add (import `Ceiling` from `'scuba-physics'` and `BoundEvent` from `'../models'`):

```ts
/** Calculated dive data needed by the computer, the dive results are one of them */
export interface ComputerSource {
    readonly wayPoints: WayPoint[];
    readonly ceilings: Ceiling[];
    readonly events: BoundEvent[];
}
```

Replace `dive: DiveResults` with `source: ComputerSource` in `calculate`, rename `dive.` to `source.` inside it, and remove the `DiveResults` import.

- [ ] **Step 8: Implement the worker procedure**

Create `projects/planner/src/app/workers/computer.tasks.ts`:

```ts
import { DtoSerialization } from '../shared/dtoSerialization';
import { BoundEvent } from '../shared/models';
import {
    CalculatedProfileDto, ComputerRequestDto,
    ComputerResultDto, EventOptionsDto
} from '../shared/serialization.model';
import { UnitConversion } from '../shared/UnitConversion';
import { WayPointsService } from '../shared/waypoints.service';
import { ComputerData } from '../shared/computer/computer.model';
import { ComputerProfile, ComputerSource } from '../shared/computer/computerProfile';
import { PlanningTasks } from './planning.tasks';

/** The whole calculation of the dive computer data, running in the worker */
export class ComputerTasks {
    /** Density events aren't shown by the computer, but the dive info calculation requires the limit */
    private static readonly eventOptions: EventOptionsDto = { maxDensity: 5.7 };

    /** Posts started, one point for every second of the dive and finished message */
    public static calculate(task: ComputerRequestDto, post: (message: ComputerResultDto) => void): void {
        const calculationId = task.calculationId;
        const profile = PlanningTasks.calculateDecompression(task).profile;

        if (profile.errors.length > 0) {
            post({ calculationId: calculationId, type: 'started', total: 0, events: [] });
            post({ calculationId: calculationId, type: 'finished' });
            return;
        }

        const data = ComputerTasks.calculateData(task, profile);
        post({ calculationId: calculationId, type: 'started', total: data.profile.length, events: data.events });

        data.profile.forEach((point, index) => {
            post({ calculationId: calculationId, type: 'point', index: index, point: point });
        });

        post({ calculationId: calculationId, type: 'finished' });
    }

    private static calculateData(task: ComputerRequestDto, profile: CalculatedProfileDto): ComputerData {
        const tanks = DtoSerialization.toTanks(task.tanks);
        const calculatedProfile = DtoSerialization.toProfile(profile, tanks);
        const diveInfo = PlanningTasks.diveInfo({
            ...task,
            calculatedProfile: profile.segments,
            calculatedTissues: profile.finalTissues,
            eventOptions: ComputerTasks.eventOptions,
            previousCns: 0,
            previousCnsExposures: []
        });
        // values in meters are used, so the units don't matter
        const units = new UnitConversion();
        const source: ComputerSource = {
            wayPoints: new WayPointsService(units).calculateWayPoints(calculatedProfile.segments),
            ceilings: diveInfo.ceilings,
            events: DtoSerialization.toEvents(diveInfo.events).items.map(e => new BoundEvent(units, e))
        };

        return ComputerProfile.calculate(source);
    }
}
```

`PlanningTasks.diveInfo` returns the ceilings as `Ceiling` objects. Inside the worker they're never serialized, so `notAtSurface` etc. still work.

- [ ] **Step 9: Add the worker and both factories**

`projects/planner/src/app/workers/computer.worker.ts`:

```ts
/// <reference lib="webworker" />
import { ComputerTasks } from './computer.tasks';

addEventListener('message', ({ data }) => {
    ComputerTasks.calculate(data, (message) => postMessage(message));
});
```

In `workers.factory.ts` (import `RestartableBackgroundTask`, `IRestartableTask` and the two DTOs):

```ts
    public createComputerWorker(): IRestartableTask<ComputerRequestDto, ComputerResultDto> {
        return new RestartableBackgroundTask<ComputerRequestDto, ComputerResultDto>(
            () => new Worker(new URL('../workers/computer.worker', import.meta.url)));
    }
```

In `serial.workers.factory.ts` (import `IRestartableTask`, `ComputerTasks` and the two DTOs):

```ts
    public createComputerWorker(): IRestartableTask<ComputerRequestDto, ComputerResultDto> {
        const subject = new Subject<ComputerResultDto>();
        const failedSubject = new Subject<void>();
        return {
            calculated$: subject,
            calculate: (request: ComputerRequestDto): void => {
                try {
                    ComputerTasks.calculate(request, (message) => subject.next(message));
                } catch {
                    failedSubject.next();
                }
            },
            failed$: failedSubject,
            cancel: (): void => {
                // synchronous calculation is always finished, nothing to interrupt
            }
        };
    }
```

- [ ] **Step 10: Run the worker tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/*.spec.ts' --include='**/computer/computerProfile.spec.ts'`
Expected: 0 failures. The calculator specs still pass `DiveResults` as the source.

- [ ] **Step 11: Rewrite the failing service tests**

Replace the whole `computer-profile.service.spec.ts` with the version below. It keeps every selection test from Task 2, but asserts on the **requests sent to the worker** instead of the calculated data, because the data now comes from the worker. A fake worker lets each test decide what the worker reports.

```ts
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { WayPoint } from '../wayPoint';
import { WorkersFactoryCommon } from '../serial.workers.factory';
import { IRestartableTask } from '../../workers/background-task';
import { ComputerRequestDto, ComputerResultDto } from '../serialization.model';
import { ComputerData, RunTimePoint } from './computer.model';
import { ComputerProfileService } from './computer-profile.service';

/** Replaces the worker, the test decides what the worker reports */
class FakeComputerTask implements IRestartableTask<ComputerRequestDto, ComputerResultDto> {
    public readonly requests: ComputerRequestDto[] = [];
    public cancelled = 0;
    public readonly calculated = new Subject<ComputerResultDto>();
    public readonly failed = new Subject<void>();
    public readonly calculated$: Observable<ComputerResultDto> = this.calculated;
    public readonly failed$: Observable<void> = this.failed;

    public get lastRequest(): ComputerRequestDto {
        return this.requests[this.requests.length - 1];
    }

    public calculate(request: ComputerRequestDto): void {
        this.requests.push(request);
    }

    public cancel(): void {
        this.cancelled++;
    }
}

class FakeWorkersFactory extends WorkersFactoryCommon {
    public readonly computerTask = new FakeComputerTask();

    public createComputerWorker(): IRestartableTask<ComputerRequestDto, ComputerResultDto> {
        return this.computerTask;
    }
}

describe('ComputerProfileService', () => {
    let sut: ComputerProfileService;
    let schedules: DiveSchedules;
    let dispatcher: ReloadDispatcher;
    let units: UnitConversion;
    let worker: FakeComputerTask;
    let published: ComputerData[];
    let progress: number[];

    /** Simulates PlannerService finishing calculation of a dive with given duration in seconds */
    const calculate = (dive: DiveSchedule, duration: number): void => {
        const results = dive.diveResult;
        results.start();
        results.updateProfile([WayPoint.fromSegment(units, new Segment(0, 0, StandardGases.air, duration))],
            ProfileTissues.createAtSurface(0));
        results.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
        results.updateConsumption(0, 0, 0, 0, 0, false, false, []);
        dispatcher.sendInfoCalculated(dive.id);
    };

    const point = (runTime: number): RunTimePoint => ({
        runTime: runTime, depth: 0, maxDepth: 0, averageDepth: 0, ceiling: 0, ndl: 0, tts: 0
    });

    /** Reports started with given total, then the points, for the last request */
    const report = (total: number, points: RunTimePoint[], finish: boolean): void => {
        const calculationId = worker.lastRequest.calculationId;
        worker.calculated.next({ calculationId: calculationId, type: 'started', total: total, events: [] });
        points.forEach((p, index) => worker.calculated.next({ calculationId: calculationId, type: 'point', index: index, point: p }));

        if (finish) {
            worker.calculated.next({ calculationId: calculationId, type: 'finished' });
        }
    };

    const lastPublished = (): ComputerData => published[published.length - 1];
    const lastProgress = (): number => progress[progress.length - 1];

    beforeEach(() => {
        const workers = new FakeWorkersFactory();
        worker = workers.computerTask;
        TestBed.configureTestingModule({
            providers: [
                ComputerProfileService, DiveSchedules, ReloadDispatcher, UnitConversion,
                { provide: WorkersFactoryCommon, useValue: workers }
            ]
        });

        schedules = TestBed.inject(DiveSchedules);
        dispatcher = TestBed.inject(ReloadDispatcher);
        units = TestBed.inject(UnitConversion);
        sut = TestBed.inject(ComputerProfileService);
        published = [];
        progress = [];
        sut.computerData$.subscribe(d => published.push(d));
        sut.progress$.subscribe(p => progress.push(p));
    });

    describe('Selection', () => {
        it('Selects first dive by default', () => {
            expect(sut.selectedDive).toBe(schedules.dives[0]);
            expect(sut.selectedIndex).toEqual(0);
        });

        it('Selects first dive by default even if planner selected another dive', () => {
            schedules.add(); // DiveSchedules.add selects the added dive in the planner
            const newSut = new ComputerProfileService(schedules, dispatcher, new FakeWorkersFactory());
            expect(newSut.selectedDive).toBe(schedules.dives[0]);
        });

        it('Ignores calculation of not selected dive', () => {
            const second = schedules.add();
            calculate(second, 10);
            expect(worker.requests.length).toEqual(0);
            expect(sut.selectedDive).toBe(schedules.dives[0]);
        });

        it('Calculates other dive when selected', () => {
            const second = schedules.add();
            calculate(second, 20);
            sut.select(1);
            expect(sut.selectedDive).toBe(second);
            expect(sut.selectedIndex).toEqual(1);
            expect(worker.lastRequest.diveId).toEqual(second.id);
        });

        it('Selecting already selected dive does not recalculate', () => {
            calculate(schedules.dives[0], 10);
            const countBefore = worker.requests.length;
            sut.select(0);
            expect(worker.requests.length).toEqual(countBefore);
        });

        it('Ignores out of range selection', () => {
            const countBefore = published.length;
            sut.select(-1);
            sut.select(1);
            expect(sut.selectedIndex).toEqual(0);
            expect(published.length).toEqual(countBefore);
        });

        it('Ignores planner selection', () => {
            schedules.add();
            const countBefore = published.length;
            schedules.setSelectedIndex(1); // fires selectedChanged$
            expect(sut.selectedDive).toBe(schedules.dives[0]);
            expect(published.length).toEqual(countBefore);
        });

        it('Selects first dive when selected dive removed', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            const second = schedules.add();
            calculate(second, 30);
            sut.select(1);
            schedules.remove(second); // fires depthChanged$
            expect(sut.selectedDive).toBe(first);
            expect(worker.lastRequest.diveId).toEqual(first.id);
        });

        it('Keeps selection when other dive removed', () => {
            const second = schedules.add();
            const third = schedules.add();
            calculate(third, 30);
            sut.select(2);
            const countBefore = worker.requests.length;
            schedules.remove(second);
            expect(sut.selectedDive).toBe(third);
            expect(sut.selectedIndex).toEqual(1);
            expect(worker.requests.length).toEqual(countBefore);
        });

        it('Selects first dive when selected dive cleared without depth change event', () => {
            schedules.add();
            sut.select(1);
            schedules.clear(); // used when all dives are reloaded, fires no event
            calculate(schedules.dives[0], 10);
            expect(sut.selectedDive).toBe(schedules.dives[0]);
            expect(worker.lastRequest.diveId).toEqual(schedules.dives[0].id);
        });
    });

    describe('Calculation', () => {
        it('Does not calculate not calculated dive', () => {
            expect(worker.requests.length).toEqual(0);
            expect(lastPublished().profile).toEqual([]);
            expect(lastProgress()).toEqual(0);
        });

        it('Starts calculation with plan of selected dive when calculated', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            expect(worker.lastRequest.diveId).toEqual(first.id);
            expect(worker.lastRequest.plan.length).toEqual(first.depths.segments.length);
        });

        it('Does not calculate failed dive', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            first.diveResult.endFailed();
            dispatcher.sendInfoCalculated(first.id);
            expect(worker.requests.length).toEqual(1);
            expect(lastPublished().profile).toEqual([]);
        });

        it('Collects streamed points', () => {
            calculate(schedules.dives[0], 10);
            report(2, [point(0), point(1)], true);
            expect(sut.computerData.profile.map(p => p.runTime)).toEqual([0, 1]);
            expect(lastPublished().profile.length).toEqual(2);
        });

        it('Updates progress for every point and ends at 100 %', () => {
            calculate(schedules.dives[0], 10);
            report(4, [point(0), point(1)], false);
            expect(progress.slice(-2)).toEqual([25, 50]);
            worker.calculated.next({ calculationId: worker.lastRequest.calculationId, type: 'finished' });
            expect(lastProgress()).toEqual(100);
        });

        it('New calculation interrupts the running one and resets data and progress', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            const previousId = worker.lastRequest.calculationId;
            report(4, [point(0)], false);
            calculate(first, 20);
            expect(worker.cancelled).toEqual(1);
            expect(worker.lastRequest.calculationId).not.toEqual(previousId);
            expect(sut.computerData.profile).toEqual([]);
            expect(lastProgress()).toEqual(0);
        });

        it('Ignores messages of interrupted calculation', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            const previousId = worker.lastRequest.calculationId;
            calculate(first, 20);
            worker.calculated.next({ calculationId: previousId, type: 'point', index: 0, point: point(0) });
            expect(sut.computerData.profile).toEqual([]);
            expect(lastProgress()).toEqual(0);
        });

        it('Selected dive change interrupts the running calculation', () => {
            const second = schedules.add();
            calculate(second, 20);
            calculate(schedules.dives[0], 10);
            sut.select(1);
            expect(worker.cancelled).toEqual(1);
            expect(worker.lastRequest.diveId).toEqual(second.id);
        });

        it('Worker failure resets data and ends progress', () => {
            calculate(schedules.dives[0], 10);
            report(4, [point(0)], false);
            worker.failed.next();
            expect(sut.computerData.profile).toEqual([]);
            expect(lastProgress()).toEqual(100);
        });
    });
});
```

- [ ] **Step 12: Run them to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/computer-profile.service.spec.ts'`
Expected: compilation FAIL. `progress$` doesn't exist, and the constructor takes only 2 arguments.

- [ ] **Step 13: Rewrite the service**

Replace the whole `computer-profile.service.ts` with:

```ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { Streamed } from '../streamed';
import { PlanRequestFactory } from '../planRequestFactory';
import { WorkersFactoryCommon } from '../serial.workers.factory';
import { IRestartableTask } from '../../workers/background-task';
import {
    ComputerPointDto, ComputerRequestDto,
    ComputerResultDto, ComputerStartedDto
} from '../serialization.model';
import { ComputerData } from './computer.model';
import { ComputerProfile } from './computerProfile';

/**
 * Source data for the dive computer simulator.
 * Keeps its own dive selection (first dive by default), independent of the planner selected dive.
 * The computer data of the selected dive are calculated in background and streamed point by point.
 */
@Injectable()
export class ComputerProfileService extends Streamed {
    public readonly computerData$: Observable<ComputerData>;
    /** Percents (0 - 100) of already calculated points of the current calculation */
    public readonly progress$: Observable<number>;
    private _selectedDive: DiveSchedule;
    private readonly onComputerData = new BehaviorSubject<ComputerData>(ComputerProfile.empty());
    private readonly onProgress = new BehaviorSubject<number>(0);
    private readonly task: IRestartableTask<ComputerRequestDto, ComputerResultDto>;
    private calculationId = 0;
    private running = false;
    private total = 0;

    constructor(private schedules: DiveSchedules, private dispatcher: ReloadDispatcher, workers: WorkersFactoryCommon) {
        super();
        this._selectedDive = this.schedules.dives[0];
        this.computerData$ = this.onComputerData.asObservable();
        this.progress$ = this.onProgress.asObservable();
        this.task = workers.createComputerWorker();

        // subscribe before the first calculation, the serial worker reports synchronously
        this.task.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((message) => this.processMessage(message));

        this.task.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.calculationFailed());

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.diveCalculated(diveId));

        // In case dive removed
        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.resetIfRemoved());

        this.refresh();
    }

    /** The dive selected within this service, the current computer data are calculated from */
    public get selectedDive(): DiveSchedule {
        return this._selectedDive;
    }

    public get selectedIndex(): number {
        return this._selectedDive.index;
    }

    /** Contains also already received points of running calculation */
    public get computerData(): ComputerData {
        return this.onComputerData.value;
    }

    private get selectedRemoved(): boolean {
        return !this.schedules.dives.includes(this._selectedDive);
    }

    public select(index: number): void {
        const dives = this.schedules.dives;

        if (index < 0 || index >= dives.length || dives[index] === this._selectedDive) {
            return;
        }

        this._selectedDive = dives[index];
        this.refresh();
    }

    private diveCalculated(diveId?: number): void {
        // dives may be cleared and reloaded without depth changed event
        if (this.selectedRemoved) {
            this.selectFirst();
            return;
        }

        if (diveId === undefined || diveId === this._selectedDive.id) {
            this.refresh();
        }
    }

    private resetIfRemoved(): void {
        if (this.selectedRemoved) {
            this.selectFirst();
        }
    }

    private selectFirst(): void {
        this._selectedDive = this.schedules.dives[0];
        this.refresh();
    }

    /** Interrupts running calculation, resets the data and starts new calculation */
    private refresh(): void {
        if (this.running) {
            this.task.cancel();
        }

        this.calculationId++;
        this.running = false;
        this.total = 0;
        this.onComputerData.next(ComputerProfile.empty());
        this.onProgress.next(0);
        const results = this._selectedDive.diveResult;

        if (results.failed || !results.profileCalculated || !results.diveInfoCalculated) {
            return;
        }

        const dive = this._selectedDive;
        const request = PlanRequestFactory.create(dive, this.schedules.previousDiveTissues(dive.id));
        this.running = true;
        this.task.calculate({ ...request, calculationId: this.calculationId });
    }

    private processMessage(message: ComputerResultDto): void {
        // message of interrupted calculation
        if (message.calculationId !== this.calculationId) {
            return;
        }

        switch (message.type) {
            case 'started':
                this.started(message);
                break;
            case 'point':
                this.pointCalculated(message);
                break;
            case 'finished':
                this.finished();
                break;
        }
    }

    private started(message: ComputerStartedDto): void {
        this.total = message.total;
        this.onComputerData.next({ profile: [], events: message.events });
    }

    private pointCalculated(message: ComputerPointDto): void {
        const data = this.onComputerData.value;
        data.profile.push(message.point);
        this.onProgress.next(Math.round(data.profile.length * 100 / this.total));
    }

    private finished(): void {
        this.running = false;
        this.onComputerData.next({ ...this.onComputerData.value });
        this.onProgress.next(100);
    }

    private calculationFailed(): void {
        this.running = false;
        this.onComputerData.next(ComputerProfile.empty());
        this.onProgress.next(100);
    }
}
```

- [ ] **Step 14: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts' --include='**/workers/*.spec.ts'`
Expected: 0 failures.

- [ ] **Step 15: Lint, full suite and a production build**

Run: `npm run lint`, `npm run test-ci`, then `npm run build` (this checks that the new worker bundles; it imports `UnitConversion` / `WayPointsService`, which use `@Injectable` from `@angular/core`).
Expected: no lint errors, all specs pass, build succeeds. The `planner.service` specs cover the moved request creation.

- [ ] **Step 16: Commit**

```bash
git add projects/planner/src/app/workers projects/planner/src/app/shared/planRequestFactory.ts projects/planner/src/app/shared/planner.service.ts projects/planner/src/app/shared/serialization.model.ts projects/planner/src/app/shared/serial.workers.factory.ts projects/planner/src/app/shared/workers.factory.ts projects/planner/src/app/shared/computer
git commit -m "feat: #106 calculate computer data in background worker"
```

---

### Task 5: Per-second NDL prediction in `scuba-physics` (Stage 2, R8)

- [x] Status

**Files:**

- Modify: `projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.ts`
- Test: `projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.noDecoLimits.spec.ts`

**Interfaces:**

- Consumes: existing `BuhlmannAlgorithm.decompression`, `applySurfaceInterval`, private `swimPart` / `toLoadSegment`; `AlgorithmContext.createWithoutStatistics / ceiling() / loadTissues / inspiredGas / createMemento / restore / runTime`.
- Produces: `BuhlmannAlgorithm.noDecoLimitsSequence(algorithmParams: AlgorithmParams): Generator<number>`, which yields the limit of every second as soon as it is calculated, so the worker can stream it (Task 6). Also `BuhlmannAlgorithm.noDecoLimits(algorithmParams: AlgorithmParams): number[]`, the same values as an array.
  - Input: the user plan, the same parameters as for `decompression`. It first calculates the decompression profile itself.
  - Output: NDL in seconds for every second of the calculated profile (index = runtime in seconds, including the final moment at the surface). Empty if the profile can't be calculated.
  - Rule for every moment, using the tissues at that moment:
    1. ceiling > 0 → `0`;
    2. otherwise, if the diver stays on the same flat segment (same depth, same gas) and the previous second had a non-zero NDL → previous − 1 (count down);
    3. otherwise → a **new prediction**: the seconds until the ceiling becomes non-zero, assuming the diver stays at the current depth on the current gas. This covers depth changes, gas changes, the first moment after the deco ceiling is cleared, and every moment before any ceiling.
  - `Infinity` at the surface, when the tissues saturate without a ceiling, or when the prediction exceeds 1000 minutes.

- [ ] **Step 1: Write the failing tests**

`projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.noDecoLimits.spec.ts`:

```ts
import { Time } from '../physics/Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from '../physics/pressure-converter';
import { StandardGases } from '../gases/StandardGases';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';

describe('Buhlmann Algorithm - No decompression limits for every second', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);
    const algorithm = new BuhlmannAlgorithm();
    const air = StandardGases.air;

    const paramsFor = (fill: (segments: Segments) => void): AlgorithmParams => {
        const gases = new Gases();
        gases.add(air);
        const segments = new Segments();
        fill(segments);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
    };

    // descent 0 -> 30 m in 120 s, bottom at 30 m 120 - 720 s, then calculated ascent
    const squareDive = paramsFor(s => {
        s.add(30, air, Time.oneMinute * 2);
        s.addFlat(air, Time.oneMinute * 10);
    });

    it('Returns value for every second of the calculated profile', () => {
        const profile = algorithm.decompression(squareDive).segments;
        const seconds = profile.reduce((sum, s) => sum + Math.ceil(s.duration), 0);
        expect(algorithm.noDecoLimits(squareDive).length).toEqual(seconds + 1);
    });

    it('Infinity at surface', () => {
        const limits = algorithm.noDecoLimits(squareDive);
        expect(limits[0]).toBe(Infinity);
        expect(limits[limits.length - 1]).toBe(Infinity);
    });

    it('Counts down while staying at the same depth', () => {
        const limits = algorithm.noDecoLimits(squareDive);
        expect(limits[200]).toEqual(limits[150] - 50);
    });

    it('Prediction at bottom corresponds to no deco limit of the dive', () => {
        const ndlMinutes = algorithm.noDecoLimit(paramsFor(s => s.add(30, air, Time.oneMinute * 2)));
        const limits = algorithm.noDecoLimits(squareDive);
        // noDecoLimit is floored to minutes and counted from the dive start
        const ndlFromStart = (120 + limits[120]) / Time.oneMinute;
        expect(ndlFromStart).toBeGreaterThanOrEqual(ndlMinutes);
        expect(ndlFromStart).toBeLessThan(ndlMinutes + 2);
    });

    it('New prediction when depth changes', () => {
        // 30 m 120 - 720 s, ascent to 15 m 720 - 810 s, 15 m from 810 s
        const multiLevel = paramsFor(s => {
            s.add(30, air, Time.oneMinute * 2);
            s.addFlat(air, Time.oneMinute * 10);
            s.add(15, air, 90);
            s.addFlat(air, Time.oneMinute * 20);
        });
        const limits = algorithm.noDecoLimits(multiLevel);
        expect(limits[815]).toBeGreaterThan(limits[719] + 95);
    });

    it('Zero while ceiling is not at surface and new prediction after deco cleared', () => {
        const decoDive = paramsFor(s => {
            s.add(40, air, 160);
            s.addFlat(air, Time.oneMinute * 25);
        });
        const limits = algorithm.noDecoLimits(decoDive);
        const firstZero = limits.indexOf(0);
        const clearedAt = limits.findIndex((limit, index) => index > firstZero && limit > 0);
        expect(firstZero).toBeGreaterThan(0);
        expect(clearedAt).toBeGreaterThan(firstZero);
        // still under water, before the final moment at surface
        expect(clearedAt).toBeLessThan(limits.length - 1);
    });

    it('Shallow depth exceeding 1000 minutes is Infinity', () => {
        const shallow = paramsFor(s => {
            s.add(5, air, Time.oneMinute);
            s.addFlat(air, Time.oneMinute * 10);
        });
        const limits = algorithm.noDecoLimits(shallow);
        expect(limits[300]).toBe(Infinity);
    });

    it('Sequence yields the same limits one by one', () => {
        const sequence = algorithm.noDecoLimitsSequence(squareDive);
        const first = sequence.next();
        expect(first.done).toBeFalse();
        expect([first.value, ...sequence]).toEqual(algorithm.noDecoLimits(squareDive));
    });

    it('Empty when profile can\'t be calculated', () => {
        // gas used by the segment isn't in the gases
        const gases = new Gases();
        gases.add(air);
        const segments = new Segments();
        segments.add(30, StandardGases.ean50, Time.oneMinute * 2);
        const invalid = AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
        expect(algorithm.noDecoLimits(invalid)).toEqual([]);
    });
});
```

- [ ] **Step 2: Run the tests to check they fail**

Run: `ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/BuhlmannAlgorithm.noDecoLimits.spec.ts'`
Expected: compilation FAIL, "Property 'noDecoLimits' does not exist on type 'BuhlmannAlgorithm'".

- [ ] **Step 3: Implement it**

In `BuhlmannAlgorithm.ts`, add any missing imports (`Gas` from `'../gases/Gases'`, `Segments` / `Segment` from `'../depths/Segments'`). Add a class constant:

```ts
    /** Prediction of no decompression limit is not calculated beyond this limit in seconds */
    private static readonly maxPredictedNdl = Time.oneMinute * 1000;
```

Add the public methods below `noDecoLimit`:

```ts
    /**
     * Calculates no decompression limit for every second of the dive, as a dive computer shows it.
     * New limit is predicted when depth or gas changes, ceiling was cleared or before any ceiling,
     * expecting the diver stays at current depth breathing current gas. Otherwise it counts down.
     * This method is slow.
     * @param algorithmParams Not null plan definition, the same as for the decompression method.
     * @returns Seconds remaining till the ceiling isn't at surface for every second of the calculated profile
     * (index is runtime in seconds). 0 while the ceiling isn't at surface. Infinity at surface or for more than 1000 minutes.
     * Empty, if the profile can't be calculated.
     */
    public noDecoLimits(algorithmParams: AlgorithmParams): number[] {
        return Array.from(this.noDecoLimitsSequence(algorithmParams));
    }

    /**
     * The same as noDecoLimits, but yields the limit of every second as soon as it is calculated.
     * Allows to stream the results of this slow calculation.
     */
    public *noDecoLimitsSequence(algorithmParams: AlgorithmParams): Generator<number> {
        const profile = this.decompression(algorithmParams);

        if (profile.errors.length > 0) {
            return;
        }

        const { gases, options, surfaceInterval, breathing } = algorithmParams;
        const depthConverter = new DepthConverterFactory(options).create();
        const rested = this.applySurfaceInterval(surfaceInterval);
        const context = AlgorithmContext.createWithoutStatistics(gases, Segments.fromCollection(profile.segments),
            options, depthConverter, breathing, rested.finalTissues);
        let previous: number | undefined;

        for (const segment of profile.segments) {
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
        const last = profile.segments[profile.segments.length - 1];
        yield this.noDecoLimitAt(context, last.endDepth, last.gas, last.speed === 0 ? previous : undefined);
    }
```

Add the private methods near `predictNoDecoLimit`:

```ts
    /**
     * @param previous no decompression limit of previous second at the same level, undefined if depth or gas changed
     */
    private noDecoLimitAt(context: AlgorithmContext, depth: number, gas: Gas, previous?: number): number {
        if (context.ceiling() > 0) {
            return 0;
        }

        // zero means the ceiling was just cleared, so new prediction is needed
        if (previous !== undefined && previous > 0) {
            return previous - 1;
        }

        return this.predictNoDecoLimitAt(context, depth, gas);
    }

    /** Seconds till the ceiling isn't at surface, when staying at the depth. Context is restored after the prediction. */
    private predictNoDecoLimitAt(context: AlgorithmContext, depth: number, gas: Gas): number {
        if (depth <= 0) {
            return Number.POSITIVE_INFINITY;
        }

        const start = context.createMemento();
        const startTime = context.runTime;
        const minuteHover = new Segment(depth, depth, gas, Time.oneMinute);
        const minuteLoad = this.toLoadSegment(context.depthConverter, minuteHover);
        const inspired = context.inspiredGas(minuteHover);
        let beforeMinute = start;
        let change = 1;

        // fast search by minutes
        while (context.ceiling() <= 0 && change > 0 && context.runTime - startTime < BuhlmannAlgorithm.maxPredictedNdl) {
            beforeMinute = context.createMemento();
            change = context.loadTissues(minuteLoad, inspired);
            context.runTime += Time.oneMinute;
        }

        let result = Number.POSITIVE_INFINITY;

        if (context.ceiling() > 0) {
            // exact second within the last minute
            context.restore(beforeMinute);
            const secondLoad = this.toLoadSegment(context.depthConverter, new Segment(depth, depth, gas, Time.oneSecond));

            while (context.ceiling() <= 0) {
                context.loadTissues(secondLoad, inspired);
                context.runTime += Time.oneSecond;
            }

            result = context.runTime - startTime;
        }

        context.restore(start);
        return result;
    }
```

Notes:

- `swimPart` calls `context.addStatistics`. That does nothing for a context created by `createWithoutStatistics`.
- `restore` copies the tissue values (`Tissue.restoreFrom`), so one memento can be restored more than once.

- [ ] **Step 4: Run the tests to check they pass**

Run: `ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/BuhlmannAlgorithm.noDecoLimits.spec.ts'`
Expected: 9 specs, 0 failures. If "Empty when profile can't be calculated" doesn't produce an error, check `SegmentsValidator` for the input it rejects and use that input instead.

- [ ] **Step 5: Run the whole library suite, lint and build the library**

Run: `npm run test-lib-ci`, `npm run lint`, then `npm run build-lib` (the planner consumes the built library).
Expected: all specs pass, no lint errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.ts projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.noDecoLimits.spec.ts
git commit -m "feat: #106 no decompression limit for every second of the dive"
```

---

### Task 6: Stream NDL from the worker (Stage 2, R8)

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/workers/planning.tasks.ts` (`noDecoLimits`, `noDecoLimitsSequence`)
- Modify: `projects/planner/src/app/workers/computer.tasks.ts`
- Modify: `projects/planner/src/app/shared/computer/computer.model.ts` (doc comment of `ndl`)
- Test: `projects/planner/src/app/workers/computer.tasks.spec.ts`

**Interfaces:**

- Consumes: `BuhlmannAlgorithm.noDecoLimitsSequence` (Task 5); `ComputerTasks.calculate`, `createRequest` / `calculate` / `pointsOf` test helpers (Task 4).
- Produces:
  - `PlanningTasks.noDecoLimitsSequence(task: PlanRequestDto): Iterable<number>` and `PlanningTasks.noDecoLimits(task: PlanRequestDto): number[]`.
  - `ComputerTasks` posts each point only after its NDL is calculated. `RunTimePoint.ndl` in the posted points is the limit of that second. Points beyond the calculated limits (fractional segment durations) get the last limit.
  - `ComputerProfile.calculate` keeps `ndl: 0`; NDL is filled only by the worker procedure.

- [ ] **Step 1: Write the failing test**

Append inside the `describe` in `computer.tasks.spec.ts` (add `import { PlanningTasks } from './planning.tasks';`):

```ts
    it('Points contain calculated no decompression limit', () => {
        const request = createRequest();
        const limits = PlanningTasks.noDecoLimits(request);
        const points = pointsOf(calculate(request));
        expect(points[0].point.ndl).toEqual(limits[0]);
        expect(points[200].point.ndl).toEqual(limits[200]);
        expect(points[200].point.ndl).toBeGreaterThan(0);
    });
```

- [ ] **Step 2: Run it to check it fails**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/computer.tasks.spec.ts'`
Expected: compilation FAIL, "Property 'noDecoLimits' does not exist on type 'typeof PlanningTasks'".

- [ ] **Step 3: Add the planning tasks**

In `planning.tasks.ts`, add below `calculateDecompression`:

```ts
    /** No decompression limit in seconds for every second of the calculated profile */
    public static noDecoLimits(task: PlanRequestDto): number[] {
        return Array.from(PlanningTasks.noDecoLimitsSequence(task));
    }

    /** The same as noDecoLimits, but yields every limit as soon as it is calculated */
    public static noDecoLimitsSequence(task: PlanRequestDto): Iterable<number> {
        const tanks = DtoSerialization.toTanks(task.tanks);
        const parameters = this.profileParametersFromTask(task, tanks, task.plan);
        return new BuhlmannAlgorithm().noDecoLimitsSequence(parameters);
    }
```

- [ ] **Step 4: Stream the points with NDL**

In `computer.tasks.ts`, add `ComputerPointDto` to the `serialization.model` import. In `calculate`, replace

```ts
        data.profile.forEach((point, index) => {
            post({ calculationId: calculationId, type: 'point', index: index, point: point });
        });
```

with:

```ts
        let index = 0;
        let lastLimit = 0;

        // NDL is the slow part, so every point is posted as soon as its limit is calculated
        for (const limit of PlanningTasks.noDecoLimitsSequence(task)) {
            if (index >= data.profile.length) {
                break;
            }

            lastLimit = limit;
            post(ComputerTasks.toPointMessage(calculationId, data, index, limit));
            index++;
        }

        // limits may be shorter in case of fractional segment durations
        for (; index < data.profile.length; index++) {
            post(ComputerTasks.toPointMessage(calculationId, data, index, lastLimit));
        }
```

and add:

```ts
    private static toPointMessage(calculationId: number, data: ComputerData, index: number, ndl: number): ComputerPointDto {
        return {
            calculationId: calculationId,
            type: 'point',
            index: index,
            point: { ...data.profile[index], ndl: ndl }
        };
    }
```

Update the `ndl` doc comment in `computer.model.ts`:

```ts
    /**
     * Current no decompression limit at this moment in seconds: remaining time till the ceiling isn't at surface,
     * when staying at current depth on current gas. 0 while in decompression, Infinity at surface or for more than 1000 minutes.
     * Calculated by the computer worker.
     */
    ndl: number;
```

- [ ] **Step 5: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/*.spec.ts' --include='**/computer/*.spec.ts'`
Expected: 0 failures.

- [ ] **Step 6: Lint and run the full planner suite**

Run: `npm run lint` then `npm run test-ci`
Expected: no lint errors, all specs pass.

- [ ] **Step 7: Commit**

```bash
git add projects/planner/src/app/workers projects/planner/src/app/shared/computer
git commit -m "feat: #106 stream computer no decompression limit"
```

---

### Task 7: Events from dive results (Stage 3, R9/R10)

- [ ] Status

**Files:**

- Modify: `projects/planner/src/app/shared/models.ts` (`BoundEvent`)
- Test: `projects/planner/src/app/shared/models.spec.ts`
- Modify: `projects/planner/src/app/shared/computer/computer.model.ts` (replace `Warning`)
- Modify: `projects/planner/src/app/shared/computer/computerProfile.ts`
- Test: `projects/planner/src/app/shared/computer/computerProfile.spec.ts`

**Interfaces:**

- Consumes: `ComputerSource.events: BoundEvent[]` (Task 4; `DiveResults` in tests, dive info events in the worker); `ComputerProfile.calculate` and the `createResults` test helper (Task 1).
- Produces:
  - `BoundEvent.type: EventType`, `BoundEvent.depthMeters: number`, `BoundEvent.gasName: string` (empty if the event has no gas)
  - `enum ComputerEventType { highPpO2 = 0, lowPpO2 = 1, brokenCeiling = 2, gasSwitch = 3, stop = 4, safetyStop = 5 }`
  - `interface ComputerEvent { type: ComputerEventType; runTime: number; depth: number; }`
  - `interface GasSwitchEvent extends ComputerEvent { type: ComputerEventType.gasSwitch; gasName: string; }`
  - `interface StopEvent extends ComputerEvent { type: ComputerEventType.stop | ComputerEventType.safetyStop; duration: number; }`
  - `ComputerData.events: ComputerEvent[]`. The worker posts them in the `started` message; `ComputerStartedDto.events` is typed as `ComputerData['events']`, so it follows automatically.
  - `createResults(segments, ceilings = [], noDecoTime = 0, units = new UnitConversion(), events: Event[] = [])` test helper

- [ ] **Step 1: Write the failing `BoundEvent` tests**

Append to `projects/planner/src/app/shared/models.spec.ts` (add any missing imports from `'scuba-physics'`: `EventsFactory`, `EventType`, `StandardGases`; and `import { BoundEvent } from './models';`, `import { UnitConversion } from './UnitConversion';`):

```ts
describe('BoundEvent', () => {
    it('Exposes event type', () => {
        const sut = new BoundEvent(new UnitConversion(), EventsFactory.createHighPpO2(10, 20));
        expect(sut.type).toEqual(EventType.highPpO2);
    });

    it('Depth in meters with imperial units', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const sut = new BoundEvent(units, EventsFactory.createHighPpO2(10, 20));
        expect(sut.depthMeters).toEqual(20);
    });

    it('Gas name of gas switch', () => {
        const sut = new BoundEvent(new UnitConversion(), EventsFactory.createGasSwitch(10, 21, StandardGases.ean50));
        expect(sut.gasName).toEqual('EAN50');
    });

    it('Empty gas name for event without gas', () => {
        const sut = new BoundEvent(new UnitConversion(), EventsFactory.createHighPpO2(10, 20));
        expect(sut.gasName).toEqual('');
    });
});
```

- [ ] **Step 2: Write the failing computer events tests**

In `computerProfile.spec.ts`, extend the imports (`BoundEvent` from `'../models'`; `Event`, `EventsFactory` from `'scuba-physics'`; `ComputerEventType` from `'./computer.model'`). Replace the `createResults` helper with:

```ts
    const createResults = (segments: Segment[], ceilings: Ceiling[] = [], noDecoTime = 0,
        units = new UnitConversion(), events: Event[] = []): DiveResults => {
        const results = new DiveResults();
        let offset = 0;
        const wayPoints = segments.map((segment) => {
            const wayPoint = WayPoint.fromSegment(units, segment, offset);
            offset += segment.duration;
            return wayPoint;
        });
        const boundEvents = events.map(e => new BoundEvent(units, e));
        results.updateProfile(wayPoints, tissues);
        results.updateDiveInfo(noDecoTime, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), ceilings, [], boundEvents);
        return results;
    };
```

Append inside the `describe`:

```ts
    describe('Dive results events', () => {
        const eventsOf = (events: Event[], units = new UnitConversion()) =>
            ComputerProfile.calculate(createResults(simpleDive, [], 0, units, events)).events;

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

        it('Event depth in meters with imperial units', () => {
            const units = new UnitConversion();
            units.imperialUnits = true;
            const events = eventsOf([EventsFactory.createHighPpO2(60, 10)], units);
            expect(events[0].depth).toEqual(10);
        });
    });
```

(also import `ComputerEvent` from `'./computer.model'`)

- [ ] **Step 3: Run the tests to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts' --include='**/shared/models.spec.ts'`
Expected: compilation FAIL, "Property 'type' does not exist on type 'BoundEvent'" / "Module './computer.model' has no exported member 'ComputerEventType'".

- [ ] **Step 4: Extend `BoundEvent`**

In `projects/planner/src/app/shared/models.ts`, add to `BoundEvent` after the `depth` getter:

```ts
    public get type(): EventType {
        return this.event.type;
    }

    /** in meters */
    public get depthMeters(): number {
        return this.event.depth;
    }

    /** Name of the gas associated with the event, empty if the event has no gas */
    public get gasName(): string {
        const gas = this.event.gas;
        return gas ? GasNames.nameFor(gas.fO2, gas.fHe) : '';
    }
```

In `chartEventText`, replace the body of `case EventType.gasSwitch: { ... }` with `return this.gasName;` (same behavior, no duplication).

- [ ] **Step 5: Replace `Warning` in the model**

In `computer.model.ts`, remove `import { EventType } from 'scuba-physics';` and the `Warning` interface. Add:

```ts
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
```

and change `ComputerData.events` to `events: ComputerEvent[];`.

- [ ] **Step 6: Map the events**

In `computerProfile.ts`, extend the imports:

```ts
import { EventType, Time } from 'scuba-physics';
import { BoundEvent } from '../models';
import {
    ComputerData, ComputerEvent, ComputerEventType,
    GasSwitchEvent, RunTimePoint, StopEvent
} from './computer.model';
```

Replace `events: []` in the final `return` of `calculate` with `events: ComputerProfile.eventsFrom(source)`, and add:

```ts
    private static eventsFrom(source: ComputerSource): ComputerEvent[] {
        const events: ComputerEvent[] = [];

        source.events.forEach((event) => {
            const converted = ComputerProfile.toComputerEvent(event);

            if (converted) {
                events.push(converted);
            }
        });

        return events;
    }

    private static toComputerEvent(event: BoundEvent): ComputerEvent | undefined {
        const runTime = event.timeStamp;
        const depth = event.depthMeters;

        switch (event.type) {
            case EventType.highPpO2:
                return { type: ComputerEventType.highPpO2, runTime: runTime, depth: depth };
            case EventType.lowPpO2:
                return { type: ComputerEventType.lowPpO2, runTime: runTime, depth: depth };
            case EventType.brokenCeiling:
                return { type: ComputerEventType.brokenCeiling, runTime: runTime, depth: depth };
            case EventType.gasSwitch: {
                const gasSwitch: GasSwitchEvent = {
                    type: ComputerEventType.gasSwitch, runTime: runTime, depth: depth, gasName: event.gasName
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
```

(If `computerProfile.ts` already imports from `'scuba-physics'`, merge these names into that single import.)

- [ ] **Step 7: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts' --include='**/shared/models.spec.ts'`
Expected: 0 failures.

- [ ] **Step 8: Lint and run the full planner suite**

Run: `npm run lint` then `npm run test-ci`
Expected: no lint errors, all specs pass (the `chartEventText` refactoring is covered by existing chart specs).

- [ ] **Step 9: Commit**

```bash
git add projects/planner/src/app/shared/models.ts projects/planner/src/app/shared/models.spec.ts projects/planner/src/app/shared/computer
git commit -m "feat: #106 computer events from dive results"
```

---

### Task 8: Stop events (Stage 3, R11)

- [ ] Status

**Files:**

- Modify: `projects/planner/src/app/shared/computer/computerProfile.ts`
- Modify: `projects/planner/src/app/workers/computer.tasks.ts` (pass the user segment count)
- Test: `projects/planner/src/app/shared/computer/computerProfile.spec.ts`
- Test: `projects/planner/src/app/workers/computer.tasks.spec.ts`

**Interfaces:**

- Consumes: `StopEvent`, `ComputerEventType.stop`, `eventsFrom` (Task 7); `RunTimePoint.ceiling` (Task 1); `ComputerSource` (Task 4); `ComputerRequestDto.plan` (user defined segments of the dive); `createRequest` / `calculate` test helpers in `computer.tasks.spec.ts` (Task 4).
- Produces:
  - `interface ComputerProfileParameters { userSegments: number; }`, exported from `computerProfile.ts`. `userSegments` is the count of user defined segments at the start of the profile.
  - `ComputerProfile.calculate(source: ComputerSource, parameters?: ComputerProfileParameters): ComputerData`. Without `parameters`, no stops are created.
  - `ComputerData.events` sorted by `runTime` (stable; dive results events before stops at the same time).
  - Test fixtures `decoDive`, `decoCeilings`, `decoParameters`, `isStop`, used by Task 9.

**Gas switch rule:** a gas switch way point (`SwimAction.switch`) is handled like any other flat segment. If the ceiling is non-zero at its start, it's a Stop and also a gas switch event (Task 7). Otherwise it's only the gas switch event. This applies to a pure switch way point and to a switch merged with the stop that follows it at the same depth.

- [ ] **Step 1: Write the failing calculator tests**

Append inside the `describe` in `computerProfile.spec.ts` (import `StopEvent` from `'./computer.model'` and `ComputerProfileParameters` from `'./computerProfile'`):

```ts
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
    const decoParameters: ComputerProfileParameters = {
        userSegments: 2
    };
    // ceiling 2 m up to 999 s, cleared from 1000 s
    const decoCeilings = ceilingsFrom([...Array.from({ length: 999 }, () => 2), ...Array.from({ length: 201 }, () => 0)]);
    const isStop = (e: ComputerEvent): boolean => e.type === ComputerEventType.stop;

    describe('Stops', () => {
        const noCeilings = ceilingsFrom(Array.from({ length: 1200 }, () => 0));

        const stopsOf = (results: DiveResults, parameters?: ComputerProfileParameters): ComputerEvent[] =>
            ComputerProfile.calculate(results, parameters).events.filter(isStop);

        /** Marks the 6 m way point (900 - 960 s) as gas switch */
        const withSwitchAtSixMeters = (ceilings: Ceiling[]): DiveResults => {
            const results = createResults(decoDive, ceilings);
            results.wayPoints[3].asGasSwitch();
            return results;
        };

        it('Creates stop for every calculated flat ascent segment with ceiling', () => {
            expect(stopsOf(createResults(decoDive, decoCeilings), decoParameters)).toEqual([
                { type: ComputerEventType.stop, runTime: 900, depth: 6, duration: 60 } as StopEvent,
                { type: ComputerEventType.stop, runTime: 990, depth: 3, duration: 180 } as StopEvent
            ]);
        });

        it('User defined flat segment is not a stop', () => {
            const stops = stopsOf(createResults(decoDive, decoCeilings), { ...decoParameters, userSegments: 4 });
            expect(stops.map(s => s.runTime)).toEqual([990]);
        });

        it('Flat segment with zero ceiling is not a stop', () => {
            expect(stopsOf(createResults(decoDive, noCeilings), decoParameters)).toEqual([]);
        });

        it('Flat segment before end of deepest point is not a stop', () => {
            // bottom segment has ceiling, but ends at the deepest point
            const stops = stopsOf(createResults(decoDive, decoCeilings), { ...decoParameters, userSegments: 0 });
            expect(stops.map(s => s.runTime)).toEqual([900, 990]);
        });

        it('No stops without parameters', () => {
            expect(stopsOf(createResults(decoDive, decoCeilings))).toEqual([]);
        });

        it('Gas switch with ceiling is a stop', () => {
            const stops = stopsOf(withSwitchAtSixMeters(decoCeilings), decoParameters);
            expect(stops[0]).toEqual({ type: ComputerEventType.stop, runTime: 900, depth: 6, duration: 60 } as StopEvent);
        });

        it('Gas switch without ceiling is not a stop', () => {
            expect(stopsOf(withSwitchAtSixMeters(noCeilings), decoParameters)).toEqual([]);
        });

        it('Events are sorted by run time', () => {
            const events = [EventsFactory.createHighPpO2(1000, 3), EventsFactory.createSafetyStopStart(990, 3)];
            const results = createResults(decoDive, decoCeilings, 0, new UnitConversion(), events);
            const runTimes = ComputerProfile.calculate(results, decoParameters).events.map(e => e.runTime);
            expect(runTimes).toEqual([900, 990, 990, 1000]);
        });
    });
```

- [ ] **Step 2: Write the failing worker test**

Append inside the `describe` in `computer.tasks.spec.ts` (add `import { ComputerEventType } from '../shared/computer/computer.model';`):

```ts
    it('Started contains stop events of deco dive', () => {
        const started = calculate(createRequest())[0] as ComputerStartedDto;
        expect(started.events.some(e => e.type === ComputerEventType.stop)).toBeTrue();
    });
```

- [ ] **Step 3: Run the tests to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Module './computerProfile' has no exported member 'ComputerProfileParameters'".

- [ ] **Step 4: Implement stops in the calculator**

In `computerProfile.ts`, add above the class:

```ts
/** Dive specific values not available in the calculated dive data */
export interface ComputerProfileParameters {
    /** Count of user defined segments at the start of the profile, those are never stops */
    userSegments: number;
}
```

Change the signature and documentation of `calculate`:

```ts
    /**
     * @param source calculated dive data
     * @param parameters needed to create stop events, no stops are created if not provided
     */
    public static calculate(source: ComputerSource, parameters?: ComputerProfileParameters): ComputerData {
```

Replace the final `return` of `calculate` with:

```ts
        const stops = parameters ? ComputerProfile.stopsFrom(wayPoints, profile, parameters.userSegments) : [];
        const events = [...ComputerProfile.eventsFrom(source), ...stops]
            .sort((a, b) => a.runTime - b.runTime);

        return {
            profile: profile,
            events: events
        };
```

and add:

```ts
    /**
     * Flat calculated segments during the ascent from the deepest point, where the ceiling is not zero.
     * Gas switch is the same as any other flat segment.
     */
    private static stopsFrom(wayPoints: WayPoint[], profile: RunTimePoint[], userSegments: number): StopEvent[] {
        const ascentStart = ComputerProfile.lastDeepestIndex(wayPoints) + 1;
        const firstCandidate = Math.max(ascentStart, userSegments);
        const stops: StopEvent[] = [];

        for (let index = firstCandidate; index < wayPoints.length; index++) {
            const wayPoint = wayPoints[index];
            const duration = wayPoint.endTime - wayPoint.startTime;
            const isFlat = wayPoint.startDepthMeters === wayPoint.endDepthMeters;
            const ceiling = profile[Math.floor(wayPoint.startTime)].ceiling;

            if (isFlat && duration > 0 && ceiling > 0) {
                stops.push({
                    type: ComputerEventType.stop,
                    runTime: wayPoint.startTime,
                    depth: wayPoint.endDepthMeters,
                    duration: duration
                });
            }
        }

        return stops;
    }

    /** Index of the last way point which reaches the maximum depth */
    private static lastDeepestIndex(wayPoints: WayPoint[]): number {
        const maxDepth = Math.max(...wayPoints.map(w => w.endDepthMeters));
        let deepestIndex = 0;

        wayPoints.forEach((wayPoint, index) => {
            if (wayPoint.endDepthMeters === maxDepth) {
                deepestIndex = index;
            }
        });

        return deepestIndex;
    }
```

Use `endTime - startTime` for the duration. `WayPoint.duration` contains the start offset, so it isn't the segment duration.

- [ ] **Step 5: Pass the user segments from the worker**

In `computer.tasks.ts`, at the end of `calculateData`, replace `return ComputerProfile.calculate(source);` with:

```ts
        return ComputerProfile.calculate(source, {
            userSegments: task.plan.length
        });
```

- [ ] **Step 6: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts' --include='**/workers/*.spec.ts'`
Expected: 0 failures.

- [ ] **Step 7: Lint and run the full planner suite**

Run: `npm run lint` then `npm run test-ci`
Expected: no lint errors, all specs pass.

- [ ] **Step 8: Commit**

```bash
git add projects/planner/src/app/shared/computer projects/planner/src/app/workers
git commit -m "feat: #106 computer stop events"
```

---

### Task 9: Next stop per second (Stage 3, R12)

- [ ] Status

**Files:**

- Modify: `projects/planner/src/app/shared/computer/computer.model.ts` (`RunTimePoint`)
- Modify: `projects/planner/src/app/shared/computer/computerProfile.ts`
- Test: `projects/planner/src/app/shared/computer/computerProfile.spec.ts`
- Modify: `projects/planner/src/app/shared/serialization.model.ts` (`RunTimePointDto`)
- Modify: `projects/planner/src/app/workers/computer.tasks.ts`
- Test: `projects/planner/src/app/workers/computer.tasks.spec.ts`
- Modify: `projects/planner/src/app/shared/computer/computer-profile.service.ts`
- Test: `projects/planner/src/app/shared/computer/computer-profile.service.spec.ts`

**Interfaces:**

- Consumes: sorted `ComputerData.events` with `StopEvent`s (Tasks 7, 8); `decoDive`, `decoCeilings`, `decoParameters`, `isStop` test fixtures (Task 8); worker DTOs, `ComputerTasks.toPointMessage` and service test helpers (Tasks 4, 6).
- Produces: `RunTimePoint.nextStop?: StopEvent`, a reference to an object in `ComputerData.events`:
  - the first stop (Stop or safety stop) that hasn't finished yet (`runTime + duration > point.runTime`), which may be the stop the diver is at right now;
  - a safety stop that overlaps any Stop in time is never pointed to; the Stop is used instead;
  - `undefined` after the last stop has finished.
- Produces (worker transfer): `RunTimePointDto extends Omit<RunTimePoint, 'nextStop'> { nextStopIndex?: number; }` in `serialization.model.ts`. `ComputerPointDto.point` becomes `RunTimePointDto`. The service resolves `nextStopIndex` back to the same object as the one in `computerData.events`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe` in `computerProfile.spec.ts`:

```ts
    describe('Next stop', () => {
        // safety stop at 3 m overlaps the last deco stop 990 - 1170
        const safetyStop = EventsFactory.createSafetyStopStart(990, 3);

        const calculateDeco = (ceilings: Ceiling[]) => {
            const results = createResults(decoDive, ceilings, 0, new UnitConversion(), [safetyStop]);
            return ComputerProfile.calculate(results, decoParameters);
        };

        it('Points to first stop before it starts', () => {
            const data = calculateDeco(decoCeilings);
            const stops = data.events.filter(isStop);
            expect(data.profile[0].nextStop).toBe(stops[0] as StopEvent);
        });

        it('Points to current stop while at the stop', () => {
            const data = calculateDeco(decoCeilings);
            const stops = data.events.filter(isStop);
            expect(data.profile[930].nextStop).toBe(stops[0] as StopEvent);
        });

        it('Points to following stop after stop finished', () => {
            const data = calculateDeco(decoCeilings);
            const stops = data.events.filter(isStop);
            expect(data.profile[960].nextStop).toBe(stops[1] as StopEvent);
        });

        it('Points to stop, not to overlapping safety stop', () => {
            const profile = calculateDeco(decoCeilings).profile;
            expect(profile[980].nextStop?.type).toEqual(ComputerEventType.stop);
            expect(profile[1000].nextStop?.type).toEqual(ComputerEventType.stop);
        });

        it('Points to safety stop when there is no deco stop', () => {
            const noCeilings = ceilingsFrom(Array.from({ length: 1200 }, () => 0));
            const point = calculateDeco(noCeilings).profile[500];
            expect(point.nextStop?.type).toEqual(ComputerEventType.safetyStop);
            expect(point.nextStop?.duration).toEqual(180);
        });

        it('No next stop after last stop finished', () => {
            const profile = calculateDeco(decoCeilings).profile;
            expect(profile[1170].nextStop).toBeUndefined();
            expect(profile[1200].nextStop).toBeUndefined();
        });
    });
```

- [ ] **Step 2: Run the tests to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Property 'nextStop' does not exist on type 'RunTimePoint'".

- [ ] **Step 3: Extend the model**

In `computer.model.ts`, add to `RunTimePoint` (after `tts`):

```ts
    /**
     * Next stop (decompression or safety stop) not finished yet at this moment, including the stop in progress.
     * A decompression stop takes precedence over an overlapping safety stop.
     * Undefined after the last stop.
     */
    nextStop?: StopEvent;
```

`RunTimePoint` now references `StopEvent`, so if lint complains about "used before defined", move the `RunTimePoint` interface below the event interfaces.

- [ ] **Step 4: Implement it**

In `computerProfile.ts`, call it in `calculate` right after the sorted `events` are created:

```ts
        ComputerProfile.assignNextStop(profile, events);
```

and add:

```ts
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
```

- [ ] **Step 5: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts'`
Expected: 0 failures.

- [ ] **Step 6: Write the failing transfer tests**

Object references don't survive `postMessage`, so the worker sends `nextStopIndex`, an index into the events, and the service turns it back into the same event object.

Append inside the `describe` in `computer.tasks.spec.ts`:

```ts
    it('Next stop is sent as index of the stop event', () => {
        const messages = calculate(createRequest());
        const started = messages[0] as ComputerStartedDto;
        const withStop = pointsOf(messages).find(p => p.point.nextStopIndex !== undefined)!;
        const stop = started.events[withStop.point.nextStopIndex!];
        expect([ComputerEventType.stop, ComputerEventType.safetyStop]).toContain(stop.type);
        expect('nextStop' in withStop.point).toBeFalse();
    });
```

In `computer-profile.service.spec.ts`:

- Change the `computer.model` import to `import { ComputerData, ComputerEventType, StopEvent } from './computer.model';`.
- Add `RunTimePointDto` to the `serialization.model` import.
- Replace the `point` and `report` helpers with:

```ts
    const stop: StopEvent = { type: ComputerEventType.stop, runTime: 5, depth: 3, duration: 60 };

    const point = (runTime: number, nextStopIndex?: number): RunTimePointDto => ({
        runTime: runTime, depth: 0, maxDepth: 0, averageDepth: 0, ceiling: 0, ndl: 0, tts: 0, nextStopIndex: nextStopIndex
    });

    /** Reports started with given total, then the points, for the last request */
    const report = (total: number, points: RunTimePointDto[], finish: boolean): void => {
        const calculationId = worker.lastRequest.calculationId;
        worker.calculated.next({ calculationId: calculationId, type: 'started', total: total, events: [stop] });
        points.forEach((p, index) => worker.calculated.next({ calculationId: calculationId, type: 'point', index: index, point: p }));

        if (finish) {
            worker.calculated.next({ calculationId: calculationId, type: 'finished' });
        }
    };
```

Then append inside `describe('Calculation', ...)`:

```ts
        it('Resolves next stop to the reported event', () => {
            calculate(schedules.dives[0], 10);
            report(2, [point(0, 0), point(1)], true);
            const profile = sut.computerData.profile;
            expect(profile[0].nextStop).toBe(sut.computerData.events[0] as StopEvent);
            expect(profile[1].nextStop).toBeUndefined();
        });
```

- [ ] **Step 7: Run them to check they fail**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/*.spec.ts' --include='**/computer/*.spec.ts'`
Expected: compilation FAIL, "Module '../serialization.model' has no exported member 'RunTimePointDto'".

- [ ] **Step 8: Send the next stop as index**

In `serialization.model.ts`, add:

```ts
/** Object references can't be transferred, so next stop is index in the events */
export interface RunTimePointDto extends Omit<RunTimePoint, 'nextStop'> {
    nextStopIndex?: number;
}
```

and change `ComputerPointDto.point` to `point: RunTimePointDto;`.

In `computer.tasks.ts`, replace the body of `toPointMessage` with:

```ts
        const { nextStop, ...values } = data.profile[index];
        const nextStopIndex = nextStop ? data.events.indexOf(nextStop) : undefined;

        return {
            calculationId: calculationId,
            type: 'point',
            index: index,
            point: { ...values, ndl: ndl, nextStopIndex: nextStopIndex }
        };
```

In `computer-profile.service.ts`, change the `computer.model` import to `import { ComputerData, RunTimePoint, StopEvent } from './computer.model';` and replace `pointCalculated` with:

```ts
    private pointCalculated(message: ComputerPointDto): void {
        const data = this.onComputerData.value;
        const { nextStopIndex, ...values } = message.point;
        const point: RunTimePoint = { ...values };

        if (nextStopIndex !== undefined) {
            point.nextStop = data.events[nextStopIndex] as StopEvent;
        }

        data.profile.push(point);
        this.onProgress.next(Math.round(data.profile.length * 100 / this.total));
    }
```

- [ ] **Step 9: Run the tests to check they pass**

Run: `ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/workers/*.spec.ts' --include='**/computer/*.spec.ts'`
Expected: 0 failures.

- [ ] **Step 10: Lint, full suites and a production build**

Run: `npm run lint`, `npm run test-lib-ci`, `npm run test-ci`, then `npm run build`.
Expected: no lint errors, all specs pass, build succeeds.

- [ ] **Step 11: Commit**

```bash
git add projects/planner/src/app/shared/computer projects/planner/src/app/shared/serialization.model.ts projects/planner/src/app/workers
git commit -m "feat: #106 computer next stop"
```

---

### Task 10: Computer data performance test (Stage 5, R17)

- [ ] Status

**Files:**

- Create: `projects/planner/src/app/workers/computer.performance.spec.ts`
- Create: `projects/planner/karma.performance.conf.js` (Chrome flags for memory measurement, long inactivity timeout)
- Modify: `package.json` (new `test-performance` script; `test-ci` excludes the performance spec)

**Interfaces:**

- Consumes: `ComputerTasks.calculate` (Tasks 4, 6, 8, 9: the complete computer data procedure the worker runs); `PlanRequestFactory.create` (Task 4); `DiveSchedules`, `DiveSchedule.depths.plannedDepth / planDuration`, `TanksService.firstTank / addTank / tanks`, `TankBound.o2 / he / assignStandardGas`; `GasNames.oxygenName`.
- Produces:
  - `npm run test-performance`. It runs only `**/*.performance.spec.ts` in a headless Chrome started with `--enable-precise-memory-info` and `--js-flags=--expose-gc`.
  - One console line per dive: `<dive>: <duration> ms, <points> points, peak heap +<MB> MB, retained heap +<MB> MB`.
  - `npm run test-ci` no longer runs the performance spec. This is the same approach as `test-lib-ci`, which excludes `performanceTests.spec.ts`.

**Measurement:**

- **Duration:** the wall-clock time from the start of `ComputerTasks.calculate` until the `finished` message, using `performance.now()`. That is the whole procedure for the complete `ComputerData`: decompression profile, dive info, points, events, stops, next stops and NDL.
- **Peak heap:** the highest `performance.memory.usedJSHeapSize` (Chrome only) sampled at every posted message, minus the heap just before the calculation (after a forced GC).
  - It includes garbage that hasn't been collected yet, so it's an approximation of the memory needed during the calculation.
  - The heap is sampled only between messages, so a short peak inside a single NDL prediction can be missed.
- **Retained heap:** the heap after the calculation and a forced GC, minus the starting heap. It is the memory still held by the collected messages, which represent the complete computer data.
- **No limits:** the request gave no targets, so the test only measures and reports. It asserts only that each calculation completed (`finished` was posted, and the number of points equals `total`) and that memory measurement is available. Limits can be added once the first numbers are known.

**Dives**, each built through the planner model like a user would (`DiveSchedules` → `PlanRequestFactory`) with default options:

1. 30 m for 30 min on air (the default tank).
2. 60 m for 200 min on air.
3. 80 m for 30 min:
   - bottom gas trimix 12/65 in the first tank;
   - added tanks with EAN50, oxygen, trimix 21/35 and trimix 35/25.

- [ ] **Step 1: Add the Karma configuration and npm scripts**

`projects/planner/karma.performance.conf.js`:

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
    // the longest dive is calculated synchronously for minutes without reporting any progress
    browserNoActivityTimeout: 30 * 60 * 1000
  });
};
```

In `package.json`:

- add the script `"test-performance": "ng test --project planner --karma-config projects/planner/karma.performance.conf.js --no-watch --include=**/*.performance.spec.ts"`;
- append ` --exclude **/*.performance.spec.ts` to the existing `test-ci` script.

- [ ] **Step 2: Write the performance test**

`projects/planner/src/app/workers/computer.performance.spec.ts`:

```ts
import { GasNames } from 'scuba-physics';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { UnitConversion } from '../shared/UnitConversion';
import { PlanRequestFactory } from '../shared/planRequestFactory';
import { TanksService } from '../shared/tanks.service';
import { ComputerRequestDto, ComputerResultDto, ComputerStartedDto } from '../shared/serialization.model';
import { ComputerTasks } from './computer.tasks';

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

describe('Computer data performance', () => {
    const createRequest = (depth: number, duration: number, configureTanks?: (tanks: TanksService) => void): ComputerRequestDto => {
        const schedules = new DiveSchedules(new UnitConversion(), new ReloadDispatcher());
        const dive = schedules.selected;
        configureTanks?.(dive.tanksService);
        dive.depths.plannedDepth = depth;
        dive.depths.planDuration = duration;
        const request = PlanRequestFactory.create(dive, schedules.previousDiveTissues(dive.id));
        return { ...request, calculationId: 1 };
    };

    /** Bottom gas trimix 12/65, deco gases EAN50, oxygen, trimix 21/35 and trimix 35/25 */
    const trimixTanks = (tanks: TanksService): void => {
        // helium first, so the oxygen isn't limited by the previous helium content
        tanks.firstTank.he = 65;
        tanks.firstTank.o2 = 12;

        ['EAN50', GasNames.oxygenName, 'Helitrox 21/35', 'Helitrox 35/25'].forEach((gasName) => {
            tanks.addTank();
            const added = tanks.tanks[tanks.tanks.length - 1];
            added.assignStandardGas(gasName);
        });
    };

    /** Calculates complete computer data the same way as the worker and measures it */
    const measure = (name: string, request: ComputerRequestDto): Measurement => {
        const messages: ComputerResultDto[] = [];
        collectGarbage();
        const heapBefore = usedHeap();
        let peakHeap = heapBefore;
        const start = performance.now();

        ComputerTasks.calculate(request, (message) => {
            messages.push(message);
            peakHeap = Math.max(peakHeap, usedHeap());
        });

        const durationMs = performance.now() - start;
        collectGarbage();
        // messages are still referenced, so the retained heap contains the complete computer data
        const retainedHeap = usedHeap();
        const started = messages[0] as ComputerStartedDto;
        const result: Measurement = {
            durationMs: Math.round(durationMs),
            points: messages.filter(m => m.type === 'point').length,
            peakHeapMb: toMegaBytes(peakHeap - heapBefore),
            retainedHeapMb: toMegaBytes(retainedHeap - heapBefore)
        };

        console.log(`${name}: ${result.durationMs} ms, ${result.points} points, ` +
            `peak heap +${result.peakHeapMb} MB, retained heap +${result.retainedHeapMb} MB`);

        expect(messages[messages.length - 1].type).toEqual('finished');
        expect(result.points).toEqual(started.total);
        expect(result.points).toBeGreaterThan(0);
        return result;
    };

    it('Memory measurement is available', () => {
        expect(usedHeap()).not.toBeNaN();
        expect(garbageCollector()).toBeDefined();
    });

    it('30 m for 30 min on air', () => {
        measure('30 m / 30 min, air', createRequest(30, 30));
    });

    it('60 m for 200 min on air', () => {
        measure('60 m / 200 min, air', createRequest(60, 200));
    });

    it('80 m for 30 min on trimix 12/65 with EAN50, oxygen, trimix 21/35 and trimix 35/25', () => {
        measure('80 m / 30 min, trimix 12/65 + EAN50, O2, 21/35, 35/25', createRequest(80, 30, trimixTanks));
    });
});
```

- [ ] **Step 3: Check the test can fail**

Temporarily change `expect(result.points).toBeGreaterThan(0);` to `expect(result.points).toBeLessThan(0);`.

Run: `npm run test-performance`
Expected: 3 dive specs FAIL with "Expected <points> to be less than 0." This proves that the dives were calculated and the assertions run. Then revert the change.

- [ ] **Step 4: Run the performance test**

Run: `npm run test-performance`
Expected: 4 specs, 0 failures. The console shows one measurement line per dive. Copy the three lines into the task report.

- [ ] **Step 5: Check CI excludes it, lint**

Run: `npm run test-ci`. Expected: all specs pass, and the spec count doesn't include the 4 performance specs.
Run: `npx eslint -c projects/planner/eslint.config.mjs projects/planner/src/app/workers/computer.performance.spec.ts`. Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add projects/planner/src/app/workers/computer.performance.spec.ts projects/planner/karma.performance.conf.js package.json
git commit -m "test: #106 computer data performance test"
```
