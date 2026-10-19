# Dive Computer Ascent Speed and Tissues Loading (#106) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every second of the dive computer data (`RunTimePoint`) carries the current ascent speed and the leading tissue loading, and the computer events contain the high ascent speed warning.

**Architecture:** `ascentSpeed` is sampled in `ComputerProfile` from the segment speed. `tissuesLoading` is sampled in `ComputerProfile` from the tissues history already created with the profile statistics (`BuhlmannAlgorithm.decompressionStatistics(...).tissues`, one sample per second at the same times as the ceilings), so the algorithm isn't modified and nothing is calculated again. The planner already gets this history from the dive info worker (`DiveInfoResultDto.tissues`); it only has to keep it in `DiveResults` and send it to the computer worker. The high ascent speed warning reuses the algorithm's existing `EventType.highAscentSpeed` event (depth dependent limits from `AscentSpeeds`), converted in `ComputerStop.toComputerEvent`.

**Tech Stack:** TypeScript, Angular workspace (`ng-packagr` library `scuba-physics`, `planner` app), Jasmine + Karma (ChromeHeadless).

**Spec:** this document, agreed in chat:
- `ascentSpeed` - meters per second, positive number, for every second of an ascending segment. 0 for flat (hover/stop), descending and zero duration segments. A second at a segment boundary takes the speed of the segment it is sampled from (the same segment as its depth).
- `tissuesLoading` - percents 0-100 of the leading tissue loading: `max over tissues(gradientFactor(surfacePressure)) / gfHigh * 100`, clamped to 0-100. **100 % = no decompression limit reached, decompression starts**; it is 100 whenever the sampled ceiling is below the surface (during decompression), because the interpolated gradient factors may already show a ceiling while the surface gradient is still below gfHigh. Uses total inert gas pressure (N2 + He). Surface pressure from the dive altitude (`DepthConverterFactory(options).create().surfacePressure`). Not rounded (the UI rounds).
- Tissues loading is taken from the tissues history created by the profile statistics. **The algorithm (`projects/scuba-physics/src/lib/algorithm/*`) is not modified**, only its existing public API is used (`Tissues.createLoaded`, `Tissues.gradientFactor`).
- `ComputerEventType.highAscentSpeed` - one event at the start of every too fast segment, depth = segment start depth, exactly as the algorithm emits `EventType.highAscentSpeed`. Ignores the planner's ignored-issues list, like other computer events.
- Out of scope: UI display, GF99, SurfGF, "@+5", "Δ+5", any new speed rule.

## Global Constraints
- Branch: create `feat/106-computer-ascent-speed-tissues-loading` from the latest clean `master` before Task 1 (the uncommitted `computers/computers.md` change travels with it and is committed in Task 4).
- Commit messages: Conventional Commits with the issue prefix, e.g. `feat: #106 computer ascent speed`. Each commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- ESLint: 4-space indent, single quotes, semicolons, 140-char lines. Run `npm run lint` before finishing each task.
- No changes in `projects/scuba-physics/src/lib/algorithm/*`.
- Pure computation lives in `scuba-physics`; the planner only keeps and transfers the tissues history. The point DTO is `RunTimePointDto extends Omit<RunTimePoint, 'nextStop'>`, so the new point fields travel automatically.
- No existing spec expectation may be changed; only fixtures building `RunTimePoint`/`ComputerProfileSource`/`CalculatedDive`/`ComputerRequestDto` literals get the new fields.
- One task per request, then stop for review (CLAUDE.md workflow).
- Single-spec command pattern: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/computer/ComputerProfile.spec.ts'` (swap `--project planner` for app specs).
- After a `scuba-physics` change used by `planner` specs, run `npm run build-lib` first.

## Review Focus
1. **Zero duration segment** (gas switch inserted by the algorithm) must give `ascentSpeed` 0, never `NaN`/`Infinity` (Task 1 test "Zero duration segment has no ascent speed").
2. **Repetitive dive** with short surface interval starts with `tissuesLoading` above 0 at run time 0 (Task 4 test "Repetitive dive starts loaded").
3. **Dive at altitude** must use the altitude surface pressure, so 100 % still matches the moment the NDL reaches 0 (Task 3 test "Reaches 100 when no decompression limit ends at altitude").
4. **Tissues history shorter than the points or empty** (fractional last second, dive info not delivered) must repeat the last sample or give 0, never throw (Task 4 tests "Point without tissues sample repeats the last one", "No tissues history means no loading").
5. **Calculated ascent at configured speeds** must not raise the high ascent speed warning (Task 2 test "Calculated ascent has no high ascent speed warning").

## File Structure
| File | Responsibility |
|---|---|
| Modify `projects/scuba-physics/src/lib/computer/ComputerData.ts` | `RunTimePoint.ascentSpeed`, `RunTimePoint.tissuesLoading`, `ComputerEventType.highAscentSpeed` |
| Modify `projects/scuba-physics/src/lib/computer/ComputerProfile.ts` | sample `ascentSpeed` and `tissuesLoading`; `ComputerProfileSource.tissues`, `surfacePressure`, `gfHigh` |
| Modify `projects/scuba-physics/src/lib/computer/ComputerStop.ts` | convert `EventType.highAscentSpeed` |
| Create `projects/scuba-physics/src/lib/computer/TissuesLoading.ts` | percents of the leading tissue loading from one tissues sample |
| Modify `projects/scuba-physics/src/lib/computer/DiveComputer.ts` | `CalculatedDive.tissues`, passes surface pressure and gfHigh |
| Modify `projects/planner/src/app/shared/diveresults.ts`, `planner.service.ts` | keep the tissues history of the dive info |
| Modify `projects/planner/src/app/shared/serialization.model.ts`, `computer/computer-profile.service.ts`, `workers/computer.tasks.ts` | send the tissues history to the computer worker |
| Modify `computers/computers.md` | move Asc and N2 from TODO to implemented |

---

### Task 1: Ascent speed in sampled points

- [x] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/computer/ComputerData.ts` (`RunTimePoint`)
- Modify: `projects/scuba-physics/src/lib/computer/ComputerProfile.ts` (`TimedSegment`, `ComputerProfileContext`, `sample`)
- Modify: `projects/planner/src/app/shared/computer/computer-profile.service.spec.ts:69` (fixture gets `ascentSpeed: 0`)
- Test: `projects/scuba-physics/src/lib/computer/ComputerProfile.spec.ts`

**Interfaces:**
- Produces: `RunTimePoint.ascentSpeed: number` - doc comment: "current ascent speed in meters per second, positive number. 0 for flat, descending or zero duration segment."

- [x] **Step 1: Create the branch** `git checkout -b feat/106-computer-ascent-speed-tissues-loading` from up to date `master`.

- [x] **Step 2: Write the failing tests** in a new `describe('Ascent speed', ...)` of `ComputerProfile.spec.ts`, profile `new Segment(0, 20, air, 120)`, `new Segment(20, 20, air, 60)`, `new Segment(20, 20, air, 0)`, `new Segment(20, 5, air, 90)`, `new Segment(5, 5, air, 60)`:
  - "Ascent speed is zero during descent": `profile[60].ascentSpeed` equals `0`.
  - "Ascent speed is zero at flat segment": `profile[150].ascentSpeed` equals `0`.
  - "Ascent speed of ascending segment in meters per second": `profile[200].ascentSpeed` close to `15 / 90` (6 decimals).
  - "Zero duration segment has no ascent speed": sample `[new Segment(0, 10, air, 60), new Segment(10, 10, air, 0)]`, every point has finite `ascentSpeed` and `profile[60].ascentSpeed` equals `0`.
  - "Ascent speed is zero after the ascent": `profile[300].ascentSpeed` equals `0`.

- [x] **Step 3: Run the spec, verify the new tests fail** (`ascentSpeed` undefined / compile error).

- [x] **Step 4: Implement**
  - `RunTimePoint.ascentSpeed` in `ComputerData.ts`.
  - `TimedSegment.ascentSpeed: number` getter: `-segment.speed` for `duration > 0 && speed < 0`, otherwise `0` (`Segment.speed` is meters per second, negative for ascent).
  - `ComputerProfileContext.ascentSpeed` getter returning the current segment's value; `sample` writes it into every point.
  - Add `ascentSpeed: 0` to the planner fixture at `computer-profile.service.spec.ts:69`.

- [x] **Step 5: Run** `npm run test-lib-ci`, `npm run build-lib`, `npm run test-ci`, `npm run lint` - all pass.

- [x] **Step 6: Commit** `feat: #106 computer ascent speed`

---

### Task 2: High ascent speed computer event

- [x] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/computer/ComputerData.ts` (`ComputerEventType`)
- Modify: `projects/scuba-physics/src/lib/computer/ComputerStop.ts` (`toComputerEvent`)
- Test: `projects/scuba-physics/src/lib/computer/ComputerStop.spec.ts`, `projects/scuba-physics/src/lib/computer/DiveComputer.spec.ts`

**Interfaces:**
- Produces: `ComputerEventType.highAscentSpeed = 6` (doc comment "ascent speed higher than the maximum for the depth"). Event shape is plain `ComputerEvent` `{ type, runTime, depth }`.

- [x] **Step 1: Write the failing tests**
  - `ComputerStop.spec.ts`, "Algorithm events": "Copies high ascent speed": `eventsOf([EventsFactory.createHighAscentSpeed(120, 20)])` equals `[{ type: ComputerEventType.highAscentSpeed, runTime: 120, depth: 20 }]`.
  - `DiveComputer.spec.ts`: "Too fast ascent creates high ascent speed warning": dive `segments.add(30, air, Time.oneMinute * 2); segments.addFlat(air, Time.oneMinute * 10); segments.add(10, air, Time.oneMinute / 2);` (40 m/min), `DiveComputer.calculate(calculateDive(dive)).events` contains an event with `type === ComputerEventType.highAscentSpeed`, `runTime === Time.oneMinute * 12` and `depth === 30`.
  - `DiveComputer.spec.ts`: "Calculated ascent has no high ascent speed warning": `DiveComputer.calculate(calculatedDecoDive).events` has no `highAscentSpeed` event.

- [x] **Step 2: Run both specs, verify the new tests fail.**

- [x] **Step 3: Implement** the enum member and the `case EventType.highAscentSpeed` in `ComputerStop.toComputerEvent`, same shape as `highPpO2`.

- [x] **Step 4: Run** `npm run test-lib-ci`, `npm run lint` - all pass.

- [x] **Step 5: Commit** `feat: #106 computer high ascent speed warning`

---

### Task 3: Tissues loading of one tissues sample

- [x] Status

**Files:**
- Create: `projects/scuba-physics/src/lib/computer/TissuesLoading.ts`
- Test: `projects/scuba-physics/src/lib/computer/TissuesLoading.spec.ts` (new)

**Interfaces:**
- Produces: `TissuesLoading.percents(tissues: LoadedTissues, ceiling: number, surfacePressure: number, gfHigh: number): number` - `100` when `ceiling > 0`, otherwise `Math.min(100, Tissues.createLoaded(tissues).gradientFactor(surfacePressure) / gfHigh * 100)` (`gradientFactor` is already never negative). `ceiling` in meters, `surfacePressure` in bars, `gfHigh` 0-1. Doc comment states 100 % = no decompression limit reached. Not exported from `public-api.ts` (internal to the computer).

- [x] **Step 1: Write the failing tests.** Statistics of a 30 m / 40 min air dive (options gfLow 0.4 / gfHigh 0.85, created the same way as in `DiveComputer.spec.ts`): `statistics = algorithm.decompressionStatistics(calculatedDive)`; tissues history `statistics.tissues` and `statistics.ceilings` share their index; `i = statistics.ceilings.findIndex(c => c.depth > 0)`; `surface = new DepthConverterFactory(options).create().surfacePressure`.
  - "Tissues saturated at surface are not loaded": `percents(Tissues.createLoadedAt(0), 0, surface, 0.85)` equals `0`.
  - "Ceiling below surface is fully loaded": `percents(Tissues.createLoadedAt(0), 3, surface, 0.85)` equals `100`.
  - "Reaches 100 when no decompression limit ends": `percents(statistics.tissues[i - 1], 0, surface, 0.85)` close to `100` (0 decimals) and < `100`; `percents(statistics.tissues[i], statistics.ceilings[i].depth, surface, 0.85)` equals `100`.
  - "Reaches 100 when no decompression limit ends at altitude": the same with `options.altitude = 2000` and its surface pressure.
  - "Loading grows at the bottom": loading of sample at 10 min < loading at 20 min (ceiling 0).
  - "Lower gradient factor high means higher loading": the same tissues at 10 min, `gfHigh` 0.7 gives more than 0.85.

- [x] **Step 2: Run the spec, verify the tests fail** (class doesn't exist).

- [x] **Step 3: Implement** `TissuesLoading.percents` as specified in Interfaces.

- [x] **Step 4: Run** `npm run test-lib-ci`, `npm run lint` - all pass; `git diff --stat master` shows no file in `lib/algorithm`.

- [x] **Step 5: Commit** `feat: #106 leading tissues loading from tissues sample`

---

### Task 4: Tissues loading in dive computer points

- [x] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/computer/ComputerData.ts` (`RunTimePoint`)
- Modify: `projects/scuba-physics/src/lib/computer/ComputerProfile.ts` (`ComputerProfileSource`, context, `sample`)
- Modify: `projects/scuba-physics/src/lib/computer/DiveComputer.ts` (`CalculatedDive`, `start`)
- Modify: `projects/planner/src/app/shared/diveresults.ts` (`updateDiveInfo`, new `tissues` getter)
- Modify: `projects/planner/src/app/shared/planner.service.ts:164-181`
- Modify: `projects/planner/src/app/shared/serialization.model.ts` (`ComputerRequestDto`)
- Modify: `projects/planner/src/app/shared/computer/computer-profile.service.ts:145-151`
- Modify: `projects/planner/src/app/workers/computer.tasks.ts:12-17`
- Modify: `computers/computers.md`
- Test: `ComputerProfile.spec.ts` (helper `sample` gets `tissues: LoadedTissues[] = []`, surface pressure `1`, gfHigh `0.85`), `DiveComputer.spec.ts` (`calculateDive` adds `tissues: statistics.tissues`), planner `computer.tasks.spec.ts` (`createRequest` adds `tissues: diveInfo.tissues`), `computer-profile.service.spec.ts`, fixtures `computer-profile.service.spec.ts:69` (`tissuesLoading: 0`)

**Interfaces:**
- Consumes: `TissuesLoading.percents` (Task 3).
- Produces: `RunTimePoint.tissuesLoading: number` - doc comment "leading tissue loading in percents 0-100 relative to the surface M-value reduced by gradient factor high, 100 = no decompression limit reached".
- Produces: `ComputerProfileSource.tissues: LoadedTissues[]` ("tissues history of the profile, sampled every second at the same times as the ceilings"), `surfacePressure: number` (bars), `gfHigh: number`.
- Produces: `CalculatedDive.tissues: LoadedTissues[]` ("tissues history, see BuhlmannAlgorithm.decompressionStatistics").
- Produces: `DiveResults.tissues: LoadedTissues[]` getter; `updateDiveInfo(..., algorithmEvents: Event[], tissues: LoadedTissues[] = [])` - optional last parameter, so existing spec callers stay unchanged.
- Produces: `ComputerRequestDto.tissues: LoadedTissueDto[][]` ("already calculated tissues history of the profile").

- [x] **Step 1: Write the failing tests**
  - `ComputerProfile.spec.ts`: "Tissues loading uses the tissues sample of the ceiling": `simpleDive`, ceilings `ceilingsFrom` 120 zeros, tissues where sample index 49 is loaded (take it from a statistics run or build with `Tissues.create(1)` + `load`) - `profile[50].tissuesLoading` equals `TissuesLoading.percents(tissues[49], 0, 1, 0.85)`.
  - `ComputerProfile.spec.ts`: "Point before first tissues sample uses the first one": `profile[0].tissuesLoading` equals the loading of `tissues[0]`.
  - `ComputerProfile.spec.ts`: "Point without tissues sample repeats the last one": 3 samples for `simpleDive`, `profile[100].tissuesLoading` equals the loading of `tissues[2]`.
  - `ComputerProfile.spec.ts`: "No tissues history means no loading": every point `0`.
  - `DiveComputer.spec.ts`: "Tissues loading is 100 when no decompression limit ends": `DiveComputer.calculate(calculatedDecoDive).profile`, the first point with `ndl === 0` has `tissuesLoading` `100`, the point before is close to `100` (0 decimals); first point `0`.
  - `DiveComputer.spec.ts`: "Repetitive dive starts loaded": second dive after 30 min surface interval (`RestingParameters` with first dive's final tissues), `profile[0].tissuesLoading` > `0`.
  - `computer.tasks.spec.ts`: "Points contain ascent speed and tissues loading": some point has `ascentSpeed > 0`, some point has `tissuesLoading === 100`.
  - `computer-profile.service.spec.ts`: "Request contains tissues history of the dive": after dive info with tissues history of 2 samples, `worker.lastRequest.tissues.length` equals `2`.

- [x] **Step 2: Run the specs, verify the new tests fail.**

- [x] **Step 3: Implement**
  - Library: new fields; `ComputerProfileContext` keeps the current tissues sample at the same index as the ceiling (`tissues[ceilingIndex - 1]`, `tissues[0]` before the first ceiling sample, last sample when the history is shorter); `sample` writes `TissuesLoading.percents(currentTissues, context.ceiling, surfacePressure, gfHigh)`, `0` for empty history. `DiveComputer.start` passes `calculated.tissues`, `new DepthConverterFactory(options).create().surfacePressure` and `options.gfHigh`.
  - Planner: `planner.service.ts` passes `DtoSerialization.toTissuesHistory(diveInfoResult.tissues)` to `updateDiveInfo`; `computer-profile.service.ts` sends `tissues: DtoSerialization.fromTissuesHistory(results.tissues)`; `computer.tasks.ts` passes `tissues: DtoSerialization.toTissuesHistory(task.tissues)`.
  - `computers/computers.md`: add `* Asc - current ascent speed` and `* Tissues - loading of the leading tissue, 100 % = NDL reached` to the list, remove both from "TODO to implement".

- [x] **Step 4: Run** `npm run test-lib-ci`, `npm run build-lib`, `npm run test-ci`, `npm run lint` - all pass; check `DiveComputer.performance.spec.ts` still within its limit; `git diff --stat master` shows no file in `lib/algorithm`.

- [x] **Step 5: Commit** `feat: #106 computer tissues loading`
