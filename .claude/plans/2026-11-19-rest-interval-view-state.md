# Rest Interval Owned by Chart Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the rest interval out of `DiveSchedules` into the planner and diff chart components, each with an independent value persisted only in its view state.

**Architecture:** `RestIntervalComponent` becomes presentational with a `model<number>()` two-way binding. The planner `ProfileChartComponent` owns its value and persists it through `SubViewStorage` (dashboard view state). The diff value is owned by `DiffComponent` (persisted in `DiffViewState` by its `saveState()`) and passed to `ProfileDifferenceChartComponent` via `[(restInterval)]`; `ProfileComparatorService.overPressures(restInterval)` takes it as a parameter.

**Tech Stack:** Angular 22 zoneless/OnPush standalone components, signal forms (`@angular/forms/signals`), Vitest browser mode.

**Spec:** `docs/superpowers/specs/2026-11-19-rest-interval-view-state-design.md`

## Global Constraints

- Rest interval is in seconds, valid range 0–24 h (existing `ValidatorGroups.restInterval`), default `0`.
- Not stored in `DiveSchedule`, `DiveSchedules`, `DiveResults`, dive DTOs or the plan URL.
- Heatmap and depth line calculation unchanged (`DiveSchedule.overPressuresWithSurfaceInterval`, `ChartPlotterFactory.withRestInterval`).
- Changing the rest interval only redraws the owning chart; it never calls `ReloadDispatcher.sendInfoCalculated`.
- New view state fields are optional (`restInterval?: number`), missing means `0`.
- Every task: tests + `npm run lint` pass, commit in Conventional Commits format with the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.
- Run a spec: `npx ng test planner --no-watch --include='**/<file>.spec.ts'`.

## Review Focus

1. Saved preferences from before this change (no `restInterval` in dashboard/diff state) load with rest interval `0` — tested in Task 2 and Task 4.
2. The periodic dashboard save (`DelayedScheduleService` → `saveMainView()`) and `DashboardStartUp.onDashboard()` must not reset a stored planner rest interval to `0` — tested in Task 2.
3. Planner and diff values are independent: changing one leaves the other view state untouched — tested in Task 4 (diff save keeps dashboard value).
4. Selecting another dive in the planner keeps the planner rest interval (value lives in the component/view state, not per dive) — covered by design; verify in Task 3 that `selectedChanged$` redraw uses the component value.
5. Invalid rest interval text must not change the bound value — tested in Task 1.

---

### Task 0: Fix existing lint issues in touched files

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/plan/rest-interval/rest-interval.component.ts`, `rest-interval.component.spec.ts`
- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.ts` (and spec, if reported)
- Modify: `projects/planner/src/app/shared/diff/profileComparatorService.spec.ts`
- Modify: `projects/planner/src/app/shared/dive.schedules.ts`
- Modify: `projects/planner/src/app/shared/subView.spec.ts`
- Any other file below reporting issues in `npx eslint`.

- [x] **Step 1:** Run `npx eslint` on all files listed in Tasks 1–5; fix every reported issue without behavior change (quotes, semicolons, member ordering, unused vars, unbound-method, `any` on Plotly chart element → `Plotly.PlotlyHTMLElement` like the diff chart).
- [x] **Step 2:** Run affected specs (rest-interval, profilechart, profileComparatorService, dives.schedule, subView) → PASS; `npx eslint <files>` → no errors.
- [x] **Step 3:** Commit `style: fix lint issues in rest interval related files`.

### Task 1: Presentational `RestIntervalComponent`

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/plan/rest-interval/rest-interval.component.ts`
- Test: `projects/planner/src/app/plan/rest-interval/rest-interval.component.spec.ts`

**Interfaces:**
- Produces: `RestIntervalComponent.restInterval: ModelSignal<number>` (seconds, default `0`), selector `app-rest-interval`, used as `<app-rest-interval [(restInterval)]="value" />`. No `DiveSchedules`/`ReloadDispatcher` injection.

- [x] **Step 1: Rewrite the spec against a host component**, providers only `ValidatorGroups`, `provideTestTranslate()`, `provideNoopAnimations()`:

```ts
@Component({ imports: [RestIntervalComponent], template: '<app-rest-interval [(restInterval)]="value" />' })
class HostComponent { public value = signal(0); }
```
Tests (same page object):
- `shows bound value formatted` — host `value.set(5400)`, `await fixture.whenStable()` → input value `'01:30'`.
- `writes valid input to bound value` — enter `'01:15'` → `host.value()` is `4500`.
- presets: 0 min → `0` (start from `value.set(1800)`), 30 min → `1800`, 1 h → `3600`, 2 h → `7200`; each also asserts input text (`'00:30'`, …).
- `accepts exactly 24 hours` → `86400`, no error.
- `does not change bound value for invalid input` — `value.set(1800)`, enter `'24:01'` → error shown, `host.value()` stays `1800`.
- `shows an error when Maskito clears unparseable input` (unchanged).
- [x] **Step 2:** Run spec → FAIL (component still uses `DiveSchedules`).
- [x] **Step 3:** Implement: `restInterval = model<number>(0)`; an `effect` syncs model → form text (`DateFormats.formatShortTime`) only when it differs from the parsed current text; the existing form `effect` writes a valid parsed value to `restInterval.set()` when it differs; preset handlers call `restInterval.set(Time.oneMinute * 30)` etc. (`Time` from `scuba-physics`).
- [x] **Step 4:** Run spec → PASS; lint.
- [x] **Step 5:** Hosts temporarily still compile (they use `<app-rest-interval />` without binding). Commit `refactor: make rest interval input a two-way bound component`.

### Task 2: Planner rest interval in `SubViewStorage`

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/views.model.ts` (`DashBoardViewState.restInterval?: number`)
- Modify: `projects/planner/src/app/shared/subViewStorage.ts`
- Test: `projects/planner/src/app/shared/subView.spec.ts`

**Interfaces:**
- Produces: `SubViewStorage.restInterval: number` getter (reads stored dashboard view state, `?? 0`) and setter (saves dashboard state `{ ...mainViewState, restInterval }` via `saveView`, i.e. persisted immediately).
- `saveMainView()` saves `{ ...this._mainViewState, restInterval: this.restInterval }` — keeps the stored value. `_mainViewState` itself never holds `restInterval`.

- [x] **Step 1: Failing tests** in `subView.spec.ts` (new `describe('Main view rest interval')`):
  - `is 0 when no dashboard state` → `sut.restInterval === 0`.
  - `is 0 for dashboard state without rest interval` — `views.loadFrom({ lastScreen: 'dashboard', states: [{ id: 'dashboard', selectedDiveIndex: 0 }] })` → `0`.
  - `loads stored value` — loaded state with `restInterval: 3600` → `3600`.
  - `setter stores into dashboard view state` — `sut.restInterval = 1800` → `views.get<DashBoardViewState>('dashboard')?.restInterval === 1800`.
  - `saveMainView keeps stored rest interval` — loaded state with `restInterval: 3600`, `sut.saveMainView()` → still `3600`.
  - `reset clears rest interval` — set `1800`, `sut.reset()` → `0`.
- [x] **Step 2:** Run → FAIL.
- [x] **Step 3:** Implement as in Interfaces.
- [x] **Step 4:** Run `subView.spec.ts`, `startUp.spec.ts` → PASS; lint.
- [x] **Step 5:** Commit `feat: keep planner rest interval in dashboard view state`.

### Task 3: Planner `ProfileChartComponent` owns its rest interval

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.ts`, `.html`
- Test: `projects/planner/src/app/plan/profilechart/profilechart.component.spec.ts` (add `ViewStates, SubViewStorage, PreferencesStore, Preferences, ApplicationSettingsService, LanguageService, MdbModalService` providers as in `diff.component.spec.ts`)

**Interfaces:**
- Consumes: Task 1 `[(restInterval)]`, Task 2 `SubViewStorage.restInterval`.
- Produces: `ProfileChartComponent.restInterval: WritableSignal<number>` (protected), initialized from `SubViewStorage.restInterval`.

- [x] **Step 1: Failing tests:**
  - `loads rest interval from dashboard view state` — before `createComponent`, `TestBed.inject(SubViewStorage).restInterval = 3600`; after `detectChanges` the `[data-testid="interval-input"]` value is `'01:00'`.
  - `saves changed rest interval into dashboard view state` — type `'00:30'` into the input → `SubViewStorage.restInterval === 1800`.
  - `heat map uses the rest interval` — heat map on, spy `DiveSchedule.prototype.overPressuresWithSurfaceInterval`; type `'00:30'` → spy last called with `1800`.
- [x] **Step 2:** Run → FAIL.
- [x] **Step 3:** Implement: `protected readonly restInterval = signal(viewStore.restInterval)`; template `<app-rest-interval [(restInterval)]="restInterval" />`; `withRestInterval(() => this.restInterval())`; `plotAllCharts` uses `this.restInterval()`; an `effect` on `restInterval()` (skip until `initialized`) does, in `untracked`, `viewStore.restInterval = value` and `plotAllCharts()`.
- [x] **Step 4:** Run profilechart spec → PASS; lint.
- [x] **Step 5:** Commit `feat: planner profile chart owns its rest interval`.

### Task 4: Diff rest interval owned by `DiffComponent`

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/views.model.ts` (`DiffViewState.restInterval?: number`)
- Modify: `projects/planner/src/app/shared/diff/profileComparatorService.ts` (+ spec)
- Modify: `projects/planner/src/app/diff/profilechart/diff-profilechart.component.ts`, `.html` (+ spec)
- Modify: `projects/planner/src/app/diff/diff.component.ts`, `.html` (+ spec)

**Interfaces:**
- Consumes: Task 1 `[(restInterval)]`.
- Produces: `ProfileComparatorService.overPressures(restInterval: number): SaturationComparison` (method, replaces getter and the `restInterval` getter); `ProfileDifferenceChartComponent.restInterval: ModelSignal<number>`; `DiffComponent.restInterval: WritableSignal<number>` (protected).

- [x] **Step 1: Failing tests:**
  - `profileComparatorService.spec.ts`: replace `schedules.restInterval = 1800` + `sut.overPressures` with `sut.overPressures(1800)`; other calls become `sut.overPressures(0)`.
  - `diff-profilechart.component.spec.ts`: `passes rest interval to heat map` — set `fixture.componentRef.setInput('restInterval', 1800)`; spy `ProfileComparatorService.overPressures`; after redraw spy called with `1800`. `typing rest interval updates the model` — enter `'00:30'` in `[data-testid="interval-input"]` → `component.restInterval() === 1800`.
  - `diff.component.spec.ts`: `defaultState` gains `restInterval: 0`; `loads rest interval from diff state` — saved state with `restInterval: 3600` → interval input shows `'01:00'`; `saves changed rest interval into diff state` — type `'00:30'` → `loadView(diff).restInterval === 1800`; `keeps dashboard rest interval` — `SubViewStorage.restInterval = 600`, then change diff value → dashboard value still `600`; `loads 0 for state without rest interval` (state saved without the field).
- [x] **Step 2:** Run the three specs → FAIL.
- [x] **Step 3:** Implement:
  - Service: `overPressures(restInterval)` passes it to `startAlignedOverPressures/endAlignedOverPressures` (become private methods with the parameter); remove `restInterval` getter.
  - Diff chart: `restInterval = model<number>(0)`; template `<app-rest-interval [(restInterval)]="restInterval" />`; `withRestInterval(() => this.restInterval())` for both traces; `plotCharts` calls `overPressures(this.restInterval())`; an `effect` on `restInterval()` redraws (`untracked`, only when `profilesCalculated` and after `ngOnInit`).
  - `DiffComponent`: `restInterval = signal(0)`; `loadState()` sets it from `state.restInterval ?? 0`; `saveState()` writes `restInterval: this.restInterval()`; an `effect` on `restInterval()` calls `saveState()` (`untracked`); template `<app-diff-profilechart [(restInterval)]="restInterval" />`.
- [x] **Step 4:** Run the three specs → PASS; lint.
- [x] **Step 5:** Commit `feat: diff profile chart rest interval saved in diff view state`.

### Task 5: Remove rest interval from `DiveSchedules`

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/dive.schedules.ts`
- Test: `projects/planner/src/app/shared/dives.schedule.spec.ts`

- [x] **Step 1:** Delete the `describe('Rest Inverval')` tests; keep `Dive Tissue Over Pressures` tests.
- [x] **Step 2:** Remove `_restInterval`, `restInterval` getter/setter and `apply*RestInterval()` methods; keep `DiveSchedule.overPressuresWithSurfaceInterval`. `grep -rn "schedules.restInterval\|RestInterval()" projects/planner/src` → no hits.
- [x] **Step 3:** Run `npm run test-ci` → all PASS; `npm run lint` → clean.
- [x] **Step 4:** Commit `refactor: remove rest interval from dive schedules`.
