# Rest Interval Tissues in Web Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate the heatmap rest interval tissues in a restartable web worker instead of the main thread.

**Architecture:** A pure `PlanningTasks.restIntervalTissues` runs in a new `restInterval.worker.ts` behind `WorkersFactory.createRestIntervalWorker()` (restartable, synchronous fallback in `WorkersFactoryCommon`). A plain helper `RestIntervalTissues` per heatmap publishes the dive tissues immediately and appends the worker result (option A) into a signal. Planner chart owns one helper, diff chart two; `ProfileComparatorService` keeps only the alignment logic.

**Tech Stack:** Angular 22 zoneless/OnPush, RxJS, Web Workers, Vitest browser mode.

**Spec:** `docs/superpowers/specs/2026-11-20-rest-interval-worker-design.md`

## Global Constraints

- Results never stored in `DiveResults`; heatmap content and depth line unchanged.
- No calculation while the heatmap is hidden.
- New request cancels the running one; outdated results never drawn.
- Run a spec: `npx ng test planner --no-watch --include='**/<file>.spec.ts'`; `npx eslint <files>` clean; Conventional Commits with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Changing the rest interval quickly (e.g. 2 h then 0) — the late 2 h result must not overwrite the 0 heatmap — Task 2 test.
2. Dive recalculated while the worker runs — heatmap shows the new dive part only, then its own rest part — Task 2 (cancel on calculate).
3. Worker failure leaves dive tissues shown — Task 2 test.
4. Diff end aligned with one profile still waiting for the worker — padding uses current lengths, redraw fixes it on result — Task 4 (effect redraw on both signals).
5. Heatmap hidden → no worker request — Task 3 test.

---

### Task 1: Worker task, DTOs and factory

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/serialization.model.ts`, `workers/planning.tasks.ts`, `shared/serial.workers.factory.ts`, `shared/workers.factory.ts`
- Create: `projects/planner/src/app/workers/restInterval.worker.ts`
- Test: `projects/planner/src/app/workers/planning.tasks.spec.ts` (new)

**Interfaces:**
- Produces: `RestIntervalRequestDto { tissues: LoadedTissueDto[]; altitude: number; restInterval: number }`, `RestIntervalResultDto { tissueOverPressures: TissueOverPressures[] }`, `PlanningTasks.restIntervalTissues(task: RestIntervalRequestDto): RestIntervalResultDto`, `WorkersFactoryCommon.createRestIntervalWorker(): IRestartableTask<RestIntervalRequestDto, RestIntervalResultDto>`.

- [x] **Step 1: Failing tests** in `planning.tasks.spec.ts`: `restIntervalTissues` with `DtoSerialization.fromTissues(ProfileTissues.createAtSurface(0))`-like loaded tissues (use `Tissues.createLoadedAt(0)` loaded after a dive is not needed: surface tissues are enough for length): `returns one sample per second of rest interval` (restInterval 600 → length 600); `returns no samples for zero rest interval` → `[]`. In the same file `WorkersFactoryCommon rest interval worker emits calculated result` (subscribe `calculated$`, `calculate(request)` → result length 60).
- [x] **Step 2:** Run → FAIL (missing members).
- [x] **Step 3:** Implement DTOs, `restIntervalTissues` (`new SurfaceIntervalParameters(DtoSerialization.toTissues(task.tissues), task.altitude, task.restInterval)` + `applySurfaceIntervalStatistics`), worker file (pattern of `diveInfo.worker.ts`), factory methods (`RestartableBackgroundTask` with `new Worker(new URL('../workers/restInterval.worker', import.meta.url))`; fallback like `createComputerWorker` with `tryAction`-style error reporting and no-op `cancel`).
- [x] **Step 4:** Run → PASS; lint.
- [x] **Step 5:** Commit `feat: rest interval tissues background task`.

### Task 2: `RestIntervalTissues` helper

- [x] Status

**Files:**
- Create: `projects/planner/src/app/shared/restIntervalTissues.ts`
- Test: `projects/planner/src/app/shared/restIntervalTissues.spec.ts`

**Interfaces:**
- Consumes: Task 1 task interface.
- Produces: `class RestIntervalTissues { constructor(task: IRestartableTask<RestIntervalRequestDto, RestIntervalResultDto>); readonly overPressures: Signal<TissueOverPressures[]>; calculate(dive: DiveResults, altitude: number, restInterval: number): void }`.

- [x] **Step 1: Failing tests** with a fake task (`Subject`s, records `calculate`/`cancel` calls) and `DiveResults` given dive info (`updateDiveInfo(..., tissueOverPressures = [row], ...)`) and a surfaced profile:
  - `is empty while dive info is not calculated` → `[]`, no request.
  - `shows dive tissues immediately` → `[row]` before result.
  - `appends rest interval tissues when calculated` → after fake emits `[r1, r2]` → `[row, r1, r2]`.
  - `does not request for zero rest interval` / `does not request when dive does not end on surface` → dive tissues only, no request.
  - `cancels running calculation on new request` → `cancel` called before each `calculate`.
  - `ignores result of outdated request` — calculate(1800), calculate(0), fake emits → stays `[row]`.
  - `keeps dive tissues when calculation fails` — `failed$` emits → `[row]`.
- [x] **Step 2:** Run → FAIL.
- [x] **Step 3:** Implement: `signal<TissueOverPressures[]>([])`; `pending` request counter (incremented per calculate; result applied only when it matches the latest requested one, and only if a request is pending); `cancel()` then `calculate` on the task; on result `set([...diveTissues, ...result.tissueOverPressures])`.
- [x] **Step 4:** Run → PASS; lint.
- [x] **Step 5:** Commit `feat: rest interval tissues published in two steps`.

### Task 3: Planner chart uses the background task

- [x] Status

**Files:**
- Modify: `plan/profilechart/profilechart.component.ts` (+ spec), `shared/dive.schedules.ts`, `shared/dives.schedule.spec.ts`

**Interfaces:**
- Consumes: Task 2 `RestIntervalTissues`; `WorkersFactoryCommon` injected (already provided in specs).

- [x] **Step 1: Tests:** in profilechart spec replace `DiveSchedule.prototype.overPressuresWithSurfaceInterval` spies with `vi.spyOn(RestIntervalTissues.prototype, 'calculate')`, expecting last call `(dive, altitude, 1800)` → `toHaveBeenLastCalledWith(expect.anything(), expect.any(Number), 1800)`; hidden heatmap test → `calculate` not called. Add `plots heat map with rest interval tissues` — heat map on, dive with dive info, rest 600 → heatmap plot data `z` length (from `#heatmapplot` element `data[0].z`) greater than dive tissues length. Remove `Dive Tissue Over Pressures` describe from `dives.schedule.spec.ts`.
- [x] **Step 2:** Run → FAIL.
- [x] **Step 3:** Implement: component creates `new RestIntervalTissues(workers.createRestIntervalWorker())`; `plotAllCharts` (heatmap shown) calls `calculate(this.dive, this.schedules.selected.optionsService.altitude, this.restInterval())`; effect on `overPressures()` → `plotHeatMap` (untracked, only when initialized and shown); `switchHeatMap` keeps calling `plotAllCharts`. Remove `DiveSchedule.overPressuresWithSurfaceInterval` and unused imports.
- [x] **Step 4:** Run profilechart + dives.schedule specs → PASS; lint.
- [x] **Step 5:** Commit `perf: planner heatmap rest interval calculated in background`.

### Task 4: Diff chart uses the background task

- [x] Status

**Files:**
- Modify: `shared/diff/profileComparatorService.ts` (+ spec), `diff/profilechart/diff-profilechart.component.ts` (+ spec)

**Interfaces:**
- Produces: `ProfileComparatorService.restIntervals(rest: number): { profileA: number; profileB: number }`, `ProfileComparatorService.alignOverPressures(profileA: TissueOverPressures[], profileB: TissueOverPressures[]): SaturationComparison`; removes `overPressures(rest)`.

- [x] **Step 1: Tests:** comparator spec replaces `overPressures` tests: `restIntervals` start aligned A longer (700/500, rest 600 → A 600, B 800), B longer, equal; end aligned → both 600. `alignOverPressures` start aligned returns inputs unchanged; end aligned pads shorter at start with `null` rows to equal length (A longer and B longer). Diff chart spec: `passes rest interval to heat map` → spy `RestIntervalTissues.prototype.calculate`, last calls contain `1800`.
- [x] **Step 2:** Run → FAIL.
- [x] **Step 3:** Implement: service methods (start: shorter gets `rest + |durationDiff|`; end: pad with `createEmptyPressures`); chart owns `tissuesA`, `tissuesB`; `plotCharts` (heatmap shown) calls both `calculate(profileXResults, profileX.optionsService.altitude, rests.profileX)`; effect on both signals plots both heatmaps from `alignOverPressures` (untracked, initialized and shown).
- [x] **Step 4:** Run diff specs + `npm run test-ci` → PASS; `npm run lint` (only pre-existing unrelated errors).
- [x] **Step 5:** Commit `perf: diff heatmap rest interval calculated in background`.

### Task 5: Remove design and plan

- [ ] Status

- [ ] **Step 1:** After the final review fixes, `git rm` the spec and this plan; commit `chore: rest interval worker design and plan removed`.
