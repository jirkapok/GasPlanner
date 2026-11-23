# Unified Bailout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the rebreather emergency (bailout) ascent consistent: everything after the deepest point is breathed as open circuit, the Results tab shows the bailout runtime next to the runtime, and the waypoints bailout tab no longer drives the profile chart.

**Architecture:** In `scuba-physics`, `PlanFactory.emergencyAscent` starts the ascent (`startAscentIndex`) right after the deepest point, and `BailoutBreathing` switches to open circuit on `isAscent`. The now unused `isCalculatedAscent` flag is removed from the breathing model and the algorithm. In `planner`, `DiveResults` exposes the bailout runtime, the dive info template shows it in brackets for rebreather dives, and the profile chart drops its effect that followed the waypoints tab.

**Tech Stack:** TypeScript, Angular 22 standalone + zoneless, Vitest (browser mode), `scuba-physics` library.

**Spec:** this document (agreed in conversation on 2026-11-23).

### Design (agreed)
- Bailout happens at the end of the deepest point. The problem solving segment and any user defined ascent after the deepest point are breathed as open circuit from the tanks, for tissues as well as consumption (consumption already did so).
- Results tab, `Total dive time` cell: for rebreather dives show `<runtime> (<bailout runtime>)`, where bailout runtime = end time of the last emergency ascent waypoint. Open circuit dives unchanged. No new column, no new label.
- Switching between the `Dive profile` and `Bailout profile` tabs in the waypoints table doesn't change the profile chart. The chart keeps only its own emergency ascent toggle button.
- Out of scope: bailout CNS/OTU.

**Approaches considered:** (a) switch the bailout model on `isAscent` with an explicit `startAscentIndex` at the deepest point (picked: one rule, removes the special `isCalculatedAscent` flag); (b) keep `isCalculatedAscent` and also set it for the solving and user ascent segments (rejected: two flags meaning the same thing).

## Global Constraints
- Branch `feat/unified-bailout` (already created from `master` at `513ad5ce`).
- Conventional Commits, no issue prefix (branch has no number). Each commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before changing a file, fix its existing lint issues (`npx eslint <file>`) and commit that separately as `style:`/`refactor:`.
- Open circuit results must stay identical. Only rebreather emergency ascent numbers may change.
- Single spec: `npx ng test scuba-physics --no-watch --include='**/<name>.spec.ts'` (or `planner`). Finish each task with the project's full suite for the touched project and `npm run lint`. Build the lib (`npm run build-lib`) before running planner tests after Task 1.
- User visible text only via ngx-translate; brackets and numbers need no new key.

## Review Focus
1. **Open circuit dive**: emergency ascent, TTS, reserve and max bottom time identical to before (BailoutBreathing isn't used for OC; full `test-lib` suite must pass without editing OC expectations).
2. **Plan without any segment after the deepest point except the solving segment** (simple dive): solving segment still on open circuit (Task 1 test).
3. **Problem solving duration 0**: no solving segment, the ascent still starts at the deepest point on open circuit (Task 1 test).
4. **Rebreather dive not yet calculated / failed** (`emergencyAscent` empty): bracket value must not throw, shows `0` like other not calculated values (Task 2 test).
5. **Persisted preference `showBailoutProfile = true`** on app start: chart starts without the emergency ascent overlay (Task 3 test).

---

### Task 1: Bailout from the deepest point (scuba-physics)

- [x] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/depths/PlanFactory.ts` (`emergencyAscent`)
- Modify: `projects/scuba-physics/src/lib/ccr/BreathingModel.ts` (interface, `BailoutBreathing`)
- Modify: `projects/scuba-physics/src/lib/algorithm/AlgorithmContext.ts` (`isCalculatedAscent`, `inspiredGas`)
- Modify: `projects/scuba-physics/src/lib/algorithm/BuhlmannAlgorithm.ts:200`
- Modify: every `BreathingModel` implementation still declaring the `isCalculatedAscent` parameter (grep)
- Test: `projects/scuba-physics/src/lib/depths/PlanFactory.bailout.spec.ts`, `projects/scuba-physics/src/lib/ccr/BreathingModel.spec.ts`
- Docs: `doc/rebreather.md` ("Bailout and reserve"), `doc/diveinfo.md` (TTS line)

**Interfaces:**
- Produces: `BreathingModel.inspiredGas(sourceGas: Gas, depth: number, isAscent: boolean): Gas` and `ppO2(sourceGas: Gas, depth: number, isAscent: boolean): number` (no 4th parameter). `BailoutBreathing` returns the open circuit model when `isAscent` is true.

- [x] **Step 1: Lint cleanup** of all files above; commit as `style:` if anything changed.
- [x] **Step 2: Write failing tests** in `PlanFactory.bailout.spec.ts`. Give `RecordingLoop` a `bottomSeconds` counter (one `inspiredGas` call per swum second). Replace the two tests `user defined ascent after the deepest point is breathed from the loop` and `... as ascent (e.g. eCCR deco setpoint)` with:
  - `problem solving time is breathed from the tank gas`: plan `createPlan(30, 20, tank, options)`, `options.problemSolvingDuration = 2`; expect `recordingLoop.depths.length` toBe `Segments.duration(Segments.fromCollection(plan).deepestPart())` (seconds) and `recordingLoop.ascentDepths` toEqual `[]`.
  - `user defined ascent after the deepest point is breathed from the tank gas`: plan with `segments.add(15, tank, Time.oneMinute)` + `addFlat(tank, 3 min)` as today; expect `recordingLoop.depths` not toContain `15` and `ascentDepths` toEqual `[]`.
  - `without problem solving time the ascent starts at the deepest point on tank gas`: `problemSolvingDuration = 0`, same two expectations as the first test.
  - Use a copy of `options` per test so the shared instance isn't mutated.
- [x] **Step 3: Update `BreathingModel.spec.ts` Bailout block**: delete `breathes the loop with deco setpoint after the deepest point until the calculated ascent` and `breathes the tank gas during the calculated ascent` (the 4th argument no longer exists); the remaining tests already pin "loop before ascent, tank during ascent".
- [x] **Step 4: Run** `npx ng test scuba-physics --no-watch --include='**/PlanFactory.bailout.spec.ts'` — Expected: the new tests FAIL (loop breathed for the solving / 15 m segments).
- [x] **Step 5: Implement**: in `emergencyAscent` pass `issueSegmentIndex` as `startAscentIndex` to `AlgorithmParams.forMultilevelDive`; `BailoutBreathing.modelFor(isAscent)`; remove `isCalculatedAscent` from the interface, `BailoutBreathing`, `AlgorithmContext` (field + `inspiredGas` call) and `BuhlmannAlgorithm` line 200; fix the doc comments that mention the calculated ascent.
- [x] **Step 6: Run** the spec again — Expected: PASS. Then `npm run test-lib-ci` — rebreather expectations in `consumption.{pscr,mccr,eccr}.spec.ts`, `consumptionByGas.{pscr,mccr,eccr}.spec.ts` and `BuhlmannAlgorithm.*.spec.ts` may move; update only those, and only after checking the direction matches the gas now breathed during the solving time. No OC expectation may change.
- [x] **Step 7: Docs**: `doc/rebreather.md` — the diver bails out at the end of the deepest point; the problem solving time, any user defined ascent and the generated ascent are breathed as open circuit. `doc/diveinfo.md` TTS: unchanged meaning, add that for rebreathers it is the bailout ascent.
- [x] **Step 8: Verify** `npm run lint`, `npm run build-lib`, `npm run test-ci` (planner eccr/mccr specs may need the same kind of expectation update).
- [x] **Step 9: Commit** `fix(scuba-physics): bailout ascent breathed as open circuit from the deepest point`

### Task 2: Bailout runtime in the Results tab

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/diveresults.ts`
- Modify: `projects/planner/src/app/shared/stopsFilter.service.ts:30-32` (reuse the getter)
- Modify: `projects/planner/src/app/plan/diveinfo/diveinfo.component.html` (Total dive time row)
- Test: `projects/planner/src/app/shared/diveresults.spec.ts`, `projects/planner/src/app/plan/diveinfo/diveinfo.component.spec.ts`
- Docs: `doc/diveinfo.md` (`Total dive time` line)

**Interfaces:**
- Produces: `DiveResults.emergencyAscentEnd: number` — runtime in seconds at the end of the emergency ascent (`endTime` of the last `emergencyAscent` waypoint), `0` when there is no emergency ascent.

- [x] **Step 1: Lint cleanup** of the files above; commit separately if needed.
- [x] **Step 2: Failing tests**:
  - `diveresults.spec.ts`: `emergency ascent end is end time of last emergency ascent waypoint` — `updateConsumption(...)` with two waypoints ending at 1500 s and 1800 s → `emergencyAscentEnd` toBe `1800`; `emergency ascent end is 0 when not calculated` → fresh instance toBe `0`.
  - `diveinfo.component.spec.ts`: `rebreather total dive time shows bailout runtime` (mCCR setup as in the grouped tanks test, `calculate`, `whenStable`) → `#bailout-dive-time-value` not null and its text non empty; `open circuit total dive time has no bailout runtime` → `#bailout-dive-time-value` toBeNull.
- [x] **Step 3: Run** both specs — Expected: FAIL (getter / element missing).
- [x] **Step 4: Implement** the getter (reads the consumption state signal, like `emergencyAscent`); in the template, after `#total-dive-time-value`, when `isRebreather`: ` (<strong id="bailout-dive-time-value">{{ dive.emergencyAscentEnd | duration:dive.emergencyAscentEnd }}</strong>)`; `StopsFilter` bailout total duration uses `dive.emergencyAscentEnd`.
- [x] **Step 5: Run** both specs and `stopsFilter` spec — Expected: PASS.
- [x] **Step 6: Docs** `doc/diveinfo.md`: for rebreather dives the value in brackets is the runtime of the bailout profile.
- [x] **Step 7: Verify** `npm run test-ci`, `npm run lint`.
- [x] **Step 8: Commit** `feat: bailout runtime shown in dive results`

### Task 3: Waypoints bailout tab doesn't change the chart

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.ts` (effect at lines 109-114, `showBailoutAscent`, `StopsFilter` injection if no longer used)
- Test: `projects/planner/src/app/plan/profilechart/profilechart.component.spec.ts:269`
- Docs: `doc/waypoints_table.md:20`

**Interfaces:** none.

- [x] **Step 1: Lint cleanup** of the files above; commit separately if needed.
- [x] **Step 2: Failing test**: replace `bailout profile tab switches on the emergency ascent overlay` with `bailout profile tab doesn't change the emergency ascent overlay` — mCCR, `viewSwitch.showBailoutProfile = true`, `whenStable` → `showEmergencyAscent` toBe `false`; then `switchEmergencyAscent()` → true, `viewSwitch.showBailoutProfile = false`, `whenStable` → still `true`.
- [x] **Step 3: Run** `npx ng test planner --no-watch --include='**/profilechart.component.spec.ts'` — Expected: FAIL.
- [x] **Step 4: Implement**: remove the effect and `showBailoutAscent`; drop the `StopsFilter` constructor parameter and import if unused.
- [x] **Step 5: Run** the spec — Expected: PASS.
- [x] **Step 6: Docs** `doc/waypoints_table.md`: remove "Selecting this tab also shows the emergency ascent in the dive profile chart." and say the chart toggles it with its own button.
- [x] **Step 7: Verify** `npm run test-ci`, `npm run lint`, `npm run e2e` (eccr e2e touches bailout).
- [x] **Step 8: Commit** `fix: bailout profile tab doesn't change the profile chart`
