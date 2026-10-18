# #106 One Average Depth Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Project override (CLAUDE.md):** implement ONE task per request, run its verification (tests + lint), tick its `- [ ] Status` checkbox, then STOP for review, unless the user explicitly says to continue.

**Goal:** Calculate the average depth for every second of the profile with one library class. Use it for both the dive computer data and the profile chart.

**Architecture:** A new class `AverageDepth` in `scuba-physics` (`depths/AverageDepth.ts`) has two methods:

- `add(depth: number): number` takes the depth of one more second of the dive and returns the average depth from the start of the dive to that second.
  - It doesn't loop over anything.
  - It keeps only the previous depth, the number of seconds and the current average.
  - Each second adds the average of the previous and the new depth (a trapezoid, exact for linear depth change within the second) to a cumulative mean. So no growing sum of depths is kept.
- `addProfile(profile: Segment[]): number[]` samples the depth of the profile at every whole second, passes each depth to `add`, and returns the averages produced (index = runtime in seconds).

The getter `average` returns the last average produced, or 0 when nothing was added. Callers that need only the average of the whole dive read it after `addProfile`, so they don't repeat "last value or 0".

The two current per-second calculations are replaced:

- the dive computer's `ComputerProfileContext` (library, `computer/ComputerProfile.ts`) keeps an `AverageDepth` instance and calls `add` every second, instead of its own `depthArea` sum;
- the profile chart's `ResamplingService.transformAverageDepth` (planner) is replaced by `AverageDepth.addProfile` on the calculated profile (`DiveResults.profile`). The planner keeps only the unit conversion and rounding for display.

`Segments.averageDepth` is replaced by `AverageDepth.average` after `addProfile`, and removed. Its callers are:

- the dive summary (`PlanningTasks` in `planning.tasks.ts`);
- the ascent speeds (`AscentSpeeds.markAverageDepth` in `depths/speeds.ts`).

Durations that aren't whole seconds lose their last part-second. The planner's segments use whole seconds, so in practice nothing changes.

**Tech Stack:** TypeScript, `scuba-physics` (ng-packagr library), Angular planner app, Karma/Jasmine.

**Spec:** the user's requests of 2026-10-18 and 2026-10-19:

- "merge the average depths calculation into one method within the library and replace both average depth for every profile second calculation";
- "The Average depth calculation will become separate class. The class will contain two methods, one will calculate average depth for provided list of segments and call the second method. The seconds method will take one number a time and add it to the average and return produced average. So the second method will not loop over segments or anything.";
- "yes replace also the segments.averageDepth.";
- "Yes, Implement the design choice to solve last value or 0." (a getter instead of repeating "last value or 0" in the callers)

Background: the chart's running mean of the depths at the start of each second lags behind depth changes, and doesn't end at the dive's average depth (`DiveResults.averageDepth`).

## Requirements

- A1: `AverageDepth.add(depth)` takes the depth in meters of the next whole second and returns the time-weighted average depth from the start of the dive.
  - The first call is the start of the dive (second 0) and returns that depth.
  - Every later call adds one second: `(previous depth + depth) / 2` added to a cumulative mean.
  - It doesn't loop and doesn't keep a sum of depths.
- A2: `AverageDepth.addProfile(profile)` returns the averages for every whole second `0 .. floor(total duration)` by calling `add`. An empty profile gives `[]`. A zero-duration segment contributes its end depth and never produces `NaN`. After it, `average` is the average of the whole profile, or 0 for an empty profile.
- A3: The dive computer data (`RunTimePoint.averageDepth`) uses `AverageDepth.add`; `ComputerProfileContext` no longer sums depths.
- A4: The profile chart's average depth trace uses `AverageDepth.addProfile` on the calculated profile; `ResamplingService` no longer calculates an average.
- A5: The dive summary average depth and the ascent speeds' average depth use `AverageDepth.average` after `addProfile` (0 for an empty profile). `Segments.averageDepth` is removed, so the chart, the computer and the dive summary agree at the end of the dive.

## Global Constraints

- Branch `feat/106-computer-simulator`, continuing #106. Conventional commits with the `#106` prefix.
- Library code stays free of planner and UI types. Depths in meters, times in seconds.
- After the `scuba-physics` change, run `npm run build-lib` before planner tests.
- ESLint: 4-space indent, single quotes, semicolons, 140-char lines, member ordering (fields, constructor, getters, static methods, instance methods).
- Library focused tests: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include=<glob>`. Planner: the same with `--project planner`.
- Commit only the files the task names.

## Review Focus

1. **The `add` contract.** The first call is second 0 and every next call is exactly one second later; the class can't check this. Test: Task 1, "Add depth" specs.
2. **Zero-duration segments** (for example a plan without enough time). There must be no `NaN`; the depth of such a segment is its end depth. Test: Task 1, "Zero duration segment".
3. **Fractional profile duration.** The last value is at `floor(total)`, and there is no out-of-range sampling. Test: Task 1, "Fractional duration".
4. **Failed or not calculated dive.** `DiveResults.profile` is empty, so the chart's average trace is empty and doesn't throw. Test: Task 3, "Empty profile has no average depth".
5. **Imperial units on the chart.** The library calculates in meters; the chart converts and rounds. Test: Task 3, "Average depth in imperial units".
6. **Visible chart change.** The average line is slightly higher during descents than before, and its last value now matches the dive summary. The x axis now includes the final second. Check: Task 3, Step 6.
7. **Ascent speeds.** `AscentSpeeds.markAverageDepth` runs inside the decompression calculation. Its average now comes from per-second sampling of the deepest part. It must give the same value for whole-second profiles, and the per-second loop must not slow the algorithm down noticeably. Test: Task 4, the new `markAverageDepth` specs plus the unchanged Bühlmann and performance specs.

---

### Task 1: `AverageDepth` class in the library (A1, A2, A5)

- [x] Status

**Files:**

- Create: `projects/scuba-physics/src/lib/depths/AverageDepth.ts`
- Create: `projects/scuba-physics/src/lib/depths/AverageDepth.spec.ts`
- Modify: `projects/scuba-physics/src/public-api.ts` (export the new file next to `./lib/depths/Segments`)

**Interfaces:**

- Produces:
  - `new AverageDepth()`;
  - `AverageDepth.add(depth: number): number`: the depth in meters of the next whole second; returns the average in meters from the start of the dive;
  - `AverageDepth.average: number`: the last average returned by `add`, 0 before the first call;
  - `AverageDepth.addProfile(profile: Segment[]): number[]`: `floor(total) + 1` values, index = runtime in seconds; `[]` for an empty profile. The profile is the whole dive, so it is used on a new instance.

- [ ] **Step 1: Write the failing tests**

Create `AverageDepth.spec.ts`:

```ts
import { AverageDepth } from './AverageDepth';
import { Segment } from './Segments';
import { StandardGases } from '../gases/StandardGases';

describe('Average depth', () => {
    describe('Add depth', () => {
        it('Is zero before first depth', () => {
            expect(new AverageDepth().average).toEqual(0);
        });

        it('First depth is the start of the dive', () => {
            const sut = new AverageDepth();
            expect(sut.add(10)).toEqual(10);
            expect(sut.average).toEqual(10);
        });

        it('Same depth keeps the average', () => {
            const sut = new AverageDepth();
            sut.add(20);
            sut.add(20);
            expect(sut.add(20)).toEqual(20);
        });

        it('Each second counts as average of previous and current depth', () => {
            const sut = new AverageDepth();
            sut.add(0);
            // seconds: (0 + 2) / 2 = 1, (2 + 4) / 2 = 3
            sut.add(2);
            expect(sut.add(4)).toBeCloseTo(2, 6);
        });

        it('Returns the average after the added depth', () => {
            const sut = new AverageDepth();
            sut.add(0);
            const added = sut.add(10);
            expect(added).toEqual(sut.average);
            expect(added).toBeCloseTo(5, 6);
        });
    });

    describe('Add profile', () => {
        // descent to 10 m in 60 s, then 60 s at 10 m
        const descentAndBottom = [
            new Segment(0, 10, StandardGases.air, 60),
            new Segment(10, 10, StandardGases.air, 60)
        ];

        it('No segments = no values', () => {
            expect(new AverageDepth().addProfile([])).toEqual([]);
        });

        it('One value for every second including start and end', () => {
            expect(new AverageDepth().addProfile(descentAndBottom).length).toEqual(121);
        });

        it('Starts with the depth at the start of the dive', () => {
            expect(new AverageDepth().addProfile(descentAndBottom)[0]).toEqual(0);
        });

        it('Is time weighted average from start of the dive to the second', () => {
            const averages = new AverageDepth().addProfile(descentAndBottom);
            // descent 0 -> 10 m in 60 s: area 300 m*s / 60 s
            expect(averages[60]).toBeCloseTo(5, 6);
            // + 60 s at 10 m: (300 + 600) / 120 s
            expect(averages[120]).toBeCloseTo(7.5, 6);
        });

        // moved from Segments.spec 'Average depth', which is removed in Task 4
        it('One segment ends at its middle depth', () => {
            const averages = new AverageDepth().addProfile([new Segment(10, 30, StandardGases.air, 60)]);
            expect(averages[averages.length - 1]).toBeCloseTo(20, 6);
        });

        it('Ends at the average depth of the whole profile', () => {
            const segments = [
                new Segment(0, 40, StandardGases.air, 60),
                new Segment(40, 40, StandardGases.air, 120),
                new Segment(40, 0, StandardGases.air, 60)
            ];
            const averages = new AverageDepth().addProfile(segments);
            expect(averages[averages.length - 1]).toBeCloseTo(30, 6);
        });

        it('Average is the average of the whole profile', () => {
            const sut = new AverageDepth();
            sut.addProfile(descentAndBottom);
            expect(sut.average).toBeCloseTo(7.5, 6);
        });

        it('Average of empty profile = 0 m', () => {
            const sut = new AverageDepth();
            sut.addProfile([]);
            expect(sut.average).toBe(0);
        });

        it('Zero duration segment', () => {
            const segments = [
                new Segment(40, 40, StandardGases.air, 0),
                new Segment(40, 40, StandardGases.air, 60)
            ];
            const averages = new AverageDepth().addProfile(segments);
            expect(averages[0]).toEqual(40);
            expect(averages.every(a => !Number.isNaN(a))).toBeTrue();
            expect(averages[60]).toBeCloseTo(40, 6);
        });

        it('Fractional duration ends at last whole second', () => {
            const averages = new AverageDepth().addProfile([new Segment(0, 10, StandardGases.air, 90.5)]);
            expect(averages.length).toEqual(91);
            // depth at 90 s is 10 * 90 / 90.5, average of linear descent is half of it
            expect(averages[90]).toBeCloseTo(10 * 90 / 90.5 / 2, 6);
        });
    });
});
```

- [ ] **Step 2: Run them to check they fail**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/depths/AverageDepth.spec.ts'`
Expected: compilation FAIL, "Cannot find module './AverageDepth'".

- [ ] **Step 3: Implement it**

Create `AverageDepth.ts`:

```ts
import { Segment } from './Segments';

/**
 * Time weighted average depth from start of the dive, built from the depth of every whole second.
 * Uses cumulative average, so no sum of all depths is kept.
 */
export class AverageDepth {
    /** seconds added after the start of the dive */
    private seconds = 0;
    private previousDepth = 0;
    private started = false;
    private _average = 0;

    /** in meters, the last average returned by add, 0 before the first depth */
    public get average(): number {
        return this._average;
    }

    /**
     * Adds depth of every whole second of the profile, see add. The profile is the whole dive, so use it on a new instance.
     * @param profile Not null profile, the segments follow each other
     * @returns Average depths in meters, index is run time in seconds (0 .. floor of total duration).
     * The first value is the depth at the start. Empty for empty profile.
     */
    public addProfile(profile: Segment[]): number[] {
        const averages: number[] = [];
        const lastSecond = Math.floor(profile.reduce((sum, segment) => sum + segment.duration, 0));
        let segmentIndex = 0;
        let segmentStart = 0;

        for (let runTime = 0; runTime <= lastSecond && profile.length > 0; runTime++) {
            while (segmentIndex < profile.length - 1 && segmentStart + profile[segmentIndex].duration < runTime) {
                segmentStart += profile[segmentIndex].duration;
                segmentIndex++;
            }

            const segment = profile[segmentIndex];
            // zero duration segment has no speed, so it stays at its end depth
            const depth = segment.duration > 0 ? segment.depthAt(runTime - segmentStart) : segment.endDepth;
            averages.push(this.add(depth));
        }

        return averages;
    }

    /**
     * Adds depth of the next whole second of the dive.
     * The first depth is the start of the dive, every next depth is one second later.
     * @param depth in meters
     * @returns average depth in meters from the start of the dive to this second
     */
    public add(depth: number): number {
        if (!this.started) {
            this.started = true;
            this._average = depth;
        } else {
            this.seconds++;
            // trapezoid of the last second, exact for linear depth change
            const secondAverage = (this.previousDepth + depth) / 2;
            this._average += (secondAverage - this._average) / this.seconds;
        }

        this.previousDepth = depth;
        return this._average;
    }
}
```

In `public-api.ts`, add `export * from './lib/depths/AverageDepth';` next to the `Segments` export.

- [ ] **Step 4: Run the tests to check they pass**

Run: the Step 2 command. Expected: 0 failures.

- [ ] **Step 5: Library suite, lint, build**

Run:

- `npm run test-lib-ci`;
- `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/depths/AverageDepth.ts projects/scuba-physics/src/lib/depths/AverageDepth.spec.ts projects/scuba-physics/src/public-api.ts`;
- `npm run build-lib`.

Expected: all pass, no lint errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/depths/AverageDepth.ts projects/scuba-physics/src/lib/depths/AverageDepth.spec.ts projects/scuba-physics/src/public-api.ts
git commit -m "feat: #106 average depth for every second of the profile"
```

---

### Task 2: Dive computer uses `AverageDepth.add` (A3)

- [ ] Status

**Files:**

- Modify: `projects/scuba-physics/src/lib/computer/ComputerProfile.ts`
- Test (existing, must stay green): `projects/scuba-physics/src/lib/computer/ComputerProfile.spec.ts`, describe "Depth statistics"

**Interfaces:**

- Consumes: `AverageDepth` (Task 1).
- Produces: no API change. `ComputerProfileContext.averageDepth` returns the value of `AverageDepth.add` for the current second. `depthArea` is removed.

This is a refactor: the existing specs "Average depth is zero at start" and "Average depth is current time weighted average depth at the moment" are the safety net and must pass unchanged. The profile starts at the surface, so the depth at second 0, which `add` returns, is 0.

- [ ] **Step 1: Confirm the safety net**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/computer/*.spec.ts' --exclude='**/*.performance.spec.ts'`
Expected: 0 failures (record the spec count).

- [ ] **Step 2: Replace the sum**

In `ComputerProfile.ts`:

- add `import { AverageDepth } from '../depths/AverageDepth';`;
- in `ComputerProfileContext`:
  - replace the `depthArea` field and its comment with `private readonly averageDepths = new AverageDepth();` and `private _averageDepth = 0;`;
  - change the `averageDepth` getter body to `return this._averageDepth;`;
  - in `moveTo`, replace the `if (runTime > 0) { ... depthArea ... }` block with `this._averageDepth = this.averageDepths.add(depth);`.
- `sample()` doesn't change; it keeps `averageDepth: context.averageDepth`.

- [ ] **Step 3: Run the tests**

Run: the Step 1 command. Expected: the same spec count, 0 failures.

- [ ] **Step 4: Library suite, lint, build**

Run:

- `npm run test-lib-ci`;
- `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/computer/ComputerProfile.ts`;
- `npm run build-lib`.

Expected: all pass, no lint errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add projects/scuba-physics/src/lib/computer/ComputerProfile.ts
git commit -m "refactor: #106 computer average depth by library average depth"
```

---

### Task 3: Profile chart uses `AverageDepth.addProfile` (A4, A5)

- [ ] Status

**Files:**

- Modify: `projects/planner/src/app/shared/ResamplingService.ts` (`resampleAverageDepth` takes the profile; `transformAverageDepth` removed)
- Modify: `projects/planner/src/app/shared/chartPlotter.ts` (`DiveTracesBuilder.profileTraces` / `plotAverageDepth` use `DiveResults.profile`)
- Test: `projects/planner/src/app/shared/ResamplingService.spec.ts`

**Interfaces:**

- Consumes: `AverageDepth.addProfile` (Task 1); `DiveResults.profile: Segment[]`, the calculated profile in meters kept since the computer library plan.
- Produces: `ResamplingService.resampleAverageDepth(profile: Segment[]): AxisValues`.
  - x is the date of every whole second, `0 .. floor(total)`.
  - y is the average depth converted to the user's units and rounded to 0.1, as before.

- [ ] **Step 1: Write the failing tests**

In `ResamplingService.spec.ts`, extend the `scuba-physics` import with `Segment`, and append inside the top-level `describe`:

```ts
    describe('Average depth', () => {
        // descent to 10 m in 60 s, then 60 s at 10 m
        const profile = [
            new Segment(0, 10, StandardGases.air, 60),
            new Segment(10, 10, StandardGases.air, 60)
        ];

        it('Empty profile has no average depth', () => {
            const resampled = sut.resampleAverageDepth([]);
            expect(resampled.xValues).toEqual([]);
            expect(resampled.yValues).toEqual([]);
        });

        it('Value for every second of the profile', () => {
            const resampled = sut.resampleAverageDepth(profile);
            expect(resampled.xValues.length).toEqual(121);
            expect(resampled.yValues.length).toEqual(121);
        });

        it('Time weighted average depth from start of the dive', () => {
            const resampled = sut.resampleAverageDepth(profile);
            expect(resampled.yValues[60]).toEqual(5);
            expect(resampled.yValues[120]).toEqual(7.5);
        });

        it('Average depth in imperial units', () => {
            units.imperialUnits = true;
            const resampled = sut.resampleAverageDepth(profile);
            // 7.5 m = 24.6 ft
            expect(resampled.yValues[120]).toBeCloseTo(24.6, 1);
        });
    });
```

- [ ] **Step 2: Run them to check they fail**

Run: `npx ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/shared/ResamplingService.spec.ts'`
Expected: compilation FAIL. `resampleAverageDepth` takes `WayPoint[]`, not `Segment[]`.

- [ ] **Step 3: Use the library average depth in the resampling**

In `ResamplingService.ts`:

- add `AverageDepth, Segment` to the `scuba-physics` import;
- replace `resampleAverageDepth` with:

```ts
    /** Average depth in user units for every second of the calculated profile, see AverageDepth.addProfile */
    public resampleAverageDepth(profile: Segment[]): AxisValues {
        const xValues: Date[] = [];
        const yValues: number[] = [];

        new AverageDepth().addProfile(profile).forEach((average, runTime) => {
            xValues.push(DateFormats.toDate(runTime));
            yValues.push(this.convertDepth(average));
        });

        return {
            xValues,
            yValues
        };
    }
```

- remove the private `transformAverageDepth` method.

- [ ] **Step 4: Plot the calculated profile**

In `chartPlotter.ts` `DiveTracesBuilder`:

- in `profileTraces()`, replace `this.plotAverageDepth(diveResult.wayPoints)` with `this.plotAverageDepth(diveResult.profile)`;
- change the `plotAverageDepth` parameter to `profile: Segment[]` and pass it to `this.resampling.resampleAverageDepth(profile)`;
- add `Segment` to the `scuba-physics` import; keep `WayPoint`, which `plotDepths` still uses.

- [ ] **Step 5: Run the tests to check they pass**

Run: the Step 2 command. Expected: 0 failures.

- [ ] **Step 6: Full suite, lint, build and a look at the chart**

Run:

- `npm run test-ci`;
- `npx eslint -c projects/planner/eslint.config.mjs projects/planner/src/app/shared/ResamplingService.ts projects/planner/src/app/shared/ResamplingService.spec.ts projects/planner/src/app/shared/chartPlotter.ts`;
- `npm run build`.

Expected: all specs pass, no lint errors in the changed lines, build succeeds.

Then run `npm start` and open the plan page. Check that the dotted average-depth line:

- rises a little faster during the descent than before;
- ends at the dive's average depth shown in the dive info.

Do the same on the diff page, which uses the same trace builder.

- [ ] **Step 7: Commit**

```bash
git add projects/planner/src/app/shared/ResamplingService.ts projects/planner/src/app/shared/ResamplingService.spec.ts projects/planner/src/app/shared/chartPlotter.ts
git commit -m "feat: #106 profile chart average depth by library average depth"
```

---

### Task 4: Dive summary and ascent speeds use `AverageDepth.average`; remove `Segments.averageDepth` (A5)

- [ ] Status

**Files:**

- Modify: `projects/scuba-physics/src/lib/depths/speeds.ts` (`AscentSpeeds.markAverageDepth`)
- Modify: `projects/scuba-physics/src/lib/depths/speeds.spec.ts` (new `markAverageDepth` specs)
- Modify: `projects/scuba-physics/src/lib/depths/Segments.ts` (remove `averageDepth`)
- Modify: `projects/scuba-physics/src/lib/depths/Segments.spec.ts` (remove `describe('Average depth')`; Task 1 moved its cases)
- Modify: `projects/planner/src/app/workers/planning.tasks.ts` (dive summary average depth)
- Test (existing, must stay green): `projects/planner/src/app/shared/planner.service.spec.ts` (`expect(dive.averageDepth).toEqual(21.75)`), the Bühlmann algorithm specs and the performance specs.

**Interfaces:**

- Consumes: `AverageDepth.addProfile` and `AverageDepth.average` (Task 1).
- Produces: `Segments.averageDepth` no longer exists. `AscentSpeeds.averageDepth` and `DiveInfoResultDto.averageDepth` keep their meaning: `AverageDepth.average` after `addProfile`, 0 for an empty profile.

This is a refactor. `markAverageDepth` has no specs yet, so Step 1 adds characterization specs that pass before and after the change.

- [ ] **Step 1: Write the characterization specs**

In `speeds.spec.ts`, extend the imports:

```ts
import { AscentSpeeds } from './speeds';
import { Segments } from './Segments';
import { StandardGases } from '../gases/StandardGases';
```

and append inside `describe('Speeds', ...)`:

```ts
    describe('Mark average depth', () => {
        const options = {
            ascentSpeed6m: 3,
            ascentSpeed50percTo6m: 6,
            ascentSpeed50perc: 9
        };

        it('Empty profile = 0 m', () => {
            const speeds = new AscentSpeeds(options);
            speeds.markAverageDepth(new Segments());
            expect(speeds.averageDepth).toBe(0);
        });

        it('Counts only the profile till the deepest point', () => {
            const segments = new Segments();
            segments.add(40, StandardGases.air, 120);
            segments.addFlat(StandardGases.air, 600);
            segments.add(20, StandardGases.air, 120);
            const speeds = new AscentSpeeds(options);

            speeds.markAverageDepth(segments);

            // (20 m * 120 s + 40 m * 600 s) / 720 s, the ascent isn't counted
            expect(speeds.averageDepth).toBeCloseTo(36.667, 3);
        });
    });
```

- [ ] **Step 2: Run them to confirm they pass on the current code**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/depths/speeds.spec.ts'`
Expected: 0 failures (characterization of the current behavior).

- [ ] **Step 3: Replace the callers**

In `speeds.ts`:

- add `import { AverageDepth } from './AverageDepth';`;
- change `markAverageDepth` to:

```ts
    public markAverageDepth(profile: Segments): void {
        const averageDepth = new AverageDepth();
        averageDepth.addProfile(profile.deepestPart());
        this.averageDepth = averageDepth.average;
    }
```

In `planning.tasks.ts`:

- add `AverageDepth` to the `scuba-physics` import (keep `Segments`, which `Segments.depthAt` still uses);
- replace `const averageDepth = Segments.averageDepth(originalProfile);` with:

```ts
        const averageDepths = new AverageDepth();
        averageDepths.addProfile(originalProfile);
        const averageDepth = averageDepths.average;
```

- [ ] **Step 4: Remove `Segments.averageDepth`**

- In `Segments.ts`, delete the `averageDepth(segments)` static method and its doc comment.
- In `Segments.spec.ts`, delete `describe('Average depth', ...)`; Task 1 moved its cases to `AverageDepth.spec.ts`.
- Run `grep -rn "Segments.averageDepth" projects` and expect no matches.

- [ ] **Step 5: Library suite, build, planner suite, lint**

Run:

- `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/depths/*.spec.ts'` (0 failures);
- `npm run test-lib-ci` (0 failures; the Bühlmann specs check that the ascent speeds didn't change, and the performance specs that it isn't slower);
- `npm run build-lib`;
- `npm run test-ci` (0 failures; `planner.service.spec.ts` still expects the dive average depth 21.75);
- `npx eslint -c projects/scuba-physics/eslint.config.mjs projects/scuba-physics/src/lib/depths/speeds.ts projects/scuba-physics/src/lib/depths/speeds.spec.ts projects/scuba-physics/src/lib/depths/Segments.ts projects/scuba-physics/src/lib/depths/Segments.spec.ts`;
- `npx eslint -c projects/planner/eslint.config.mjs projects/planner/src/app/workers/planning.tasks.ts`;
- `npm run build`.

Expected: all pass, no lint errors, builds succeed.

- [ ] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/depths/speeds.ts projects/scuba-physics/src/lib/depths/speeds.spec.ts projects/scuba-physics/src/lib/depths/Segments.ts projects/scuba-physics/src/lib/depths/Segments.spec.ts projects/planner/src/app/workers/planning.tasks.ts
git commit -m "refactor: #106 dive average depth by library average depth"
```
