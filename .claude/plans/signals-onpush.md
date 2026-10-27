# Signals and OnPush Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. ONE task per request, then stop for review (see CLAUDE.md Workflow). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the UI state that changes outside Angular events in signals, so that `ViewRefresh` can be deleted, then switch all components to `ChangeDetectionStrategy.OnPush` and enforce it by a lint rule.

**Architecture:**
- **Why `ViewRefresh` exists:** the app runs zoneless and all 56 components are `Eager`. Worker results, timers and the clipboard callback mutate plain service fields, so `ViewRefresh.refresh()` marks the root components and the whole tree is re-rendered.
- **Signals replace it:** a signal read in a template marks exactly that view dirty when written and schedules change detection. State keeps its public getters (`get noDecoTime() { return this._diveInfo().noDecoTime; }`), so templates and callers don't change.
- **Observables stay for events:** worker `calculated$`/`failed$`, `ReloadDispatcher`, clipboard `copyResponse$`. Their subscribers write signals.
- **Zoneless targeted mode (lesson from the zoneless plan):** a signal write refreshes only the view reading it and that view's `Eager` descendants, not its siblings. So **every displayed value written outside Angular events must be signal backed**, otherwise it renders stale. `ViewRefresh` stays as a safety net until Task 5 removes it.
- **OnPush readiness per group:** each component group task also makes its components safe for OnPush and proves it by tests rendering the component with an OnPush override. Task 10 only flips the strategy for all components and adds the lint rule.

**Tech Stack:** Angular 22.2 zoneless (standalone components, `ChangeDetectionStrategy.Eager` today), signals (`signal`, `computed`), RxJS, `@angular/core/rxjs-interop`, Reactive Forms, Vitest browser mode (`@angular/build:unit-test`), angular-eslint, mdb-angular-ui-kit, @angular/cdk overlay.

**Spec:** this conversation. The user asked to remove `viewRefresh.ts` by moving state to signals, with the components migrated in groups and the switch to OnPush plus a lint rule as the final step.

## Global Constraints
- Branch `refactor/signals` from the latest clean local `master`.
- Commits: Conventional Commits ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tasks 1–9 use `refactor:` (no release). Task 10 uses `perf: switch components to OnPush change detection` (patch release). Commit only when the user asks.
- Paths below are relative to `projects/planner/src/app/` unless they start with `projects/`, `.claude/` or the repo root files.
- Signals are private writable fields named with a leading underscore (`private readonly _toastVisible = signal(false)`). They are exposed through the existing getters or a public read-only accessor. Templates don't call `.set()`.
- Values derived from several signals use `computed()` only when the getter is expensive or allocates. Cheap getters stay as getters reading the signals.
- Don't put signals into `scuba-physics`; the library stays framework agnostic. Signal backed wrappers live in `planner` (`TankBound`, `DiveResults`, services).
- Replace arrays and records, don't mutate them in place, whenever they are stored in a signal (the default equality check is `Object.is`).
- No new NgModules. Keep the component rules of CLAUDE.md: components only format, wire forms and delegate.
- Lint: record the baseline at the start of Task 1 (`npm run lint`; currently the library shows 12 errors, the planner count is printed above it). Never exceed it. Tests: record the planner and library test counts at the start of Task 1, and never lose tests except the deleted `viewRefresh.spec.ts` (2 tests).
- The user may have `ng serve` running on port 4200. Don't kill it. Run e2e against your own server: `npx ng serve --port 4300` + `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4300 npx playwright test`.
- Run a single spec: `npx ng test planner --no-watch --include='**/<name>.spec.ts'`.

## Review Focus
1. **Sibling components after a worker result.** Under targeted change detection, a value that is not signal backed renders stale, even though a neighbour component refreshed. This affects tank consumption bars, gas charts and the diff tables. Covered by the "renders … changed outside Angular events" tests in Tasks 3 and 4.
2. **Programmatic form reset under OnPush.** A `ReloadDispatcher` handler patches a form after a dive switch or a URL load. The OnPush child control keeps a stale `is-invalid` class or validation message, because `markForCheck()` marks only ancestors. Covered by Task 6 Step 1 (`refreshOnFormEvents`) and the per-control tests.
3. **Cross-component edits under OnPush.** Editing a tank's O2 in `tanks-complex` must update the gas dropdown and labels in `depths-complex`, a sibling. Selecting another dive in `plan.tabs` must update every plan card. Covered by Task 7 tests.
4. **Signal written during change detection.** A getter that writes a signal while a template is evaluated loops or throws NG0100 ("expression changed"). No setter may be called from a getter or template expression. Covered by running the full suite in every task and by the e2e tests in Tasks 5 and 10.
5. **Overlay and modal roots.** The help sidebar (CDK overlay), the QR modal and MDB dropdowns are separate root views; marking app roots never reached them. Covered by Task 1 (learn welcome) and Task 9 tests, and by the manual checklist in Task 10.

## Shared test helper

Create `projects/planner/src/testing/onPush.testing.ts` in Task 1 (per CLAUDE.md, shared helpers live in `*.testing.ts`):

```ts
/** Renders the component with OnPush change detection and automatic change detection, as in the running app. */
export async function renderOnPush<T>(component: Type<T>, inputs: Record<string, unknown> = {}): Promise<ComponentFixture<T>>
```

It calls `TestBed.overrideComponent(component, { set: { changeDetection: ChangeDetectionStrategy.OnPush } })`, creates the fixture, applies `inputs` by `fixture.componentRef.setInput`, calls `fixture.autoDetectChanges()` and awaits `fixture.whenStable()`. The caller configures TestBed providers before calling it.

**Test pattern** used in every group: render with `renderOnPush`, change the state through the service method that the worker, timer or dispatcher would call (never through a template event), `await fixture.whenStable()`, then assert the DOM. Without a signal (or `markForCheck`) such a test fails, because nothing notifies Angular. Name these tests `'renders <what> changed outside Angular events'`.

## File Structure
| File | Change |
|---|---|
| Create `projects/planner/src/testing/onPush.testing.ts` | `renderOnPush` helper |
| Create `shared/formRefresh.ts` (+ spec) | `refreshOnFormEvents` helper (Task 6) |
| Modify `shared/ShareDiveService.ts`, `plan/dashboard/*`, `shared/startUp.ts`, `shared/learn/help.service.ts` (+ specs) | Task 1 |
| Modify `shared/diveresults.ts`, `shared/dive.schedules.ts`, `shared/planner.service.ts` (+ specs) | Task 2 |
| Modify `shared/models.ts` (`TankBound`), `shared/tanks.service.ts`, `plan/diveinfo`, `plan/tank-chart`, `plan/gas-chart`, `plan/dive-issues`, `plan/waypoints`, `plan/profilechart`, `controls/calculating` (+ specs) | Task 3 |
| Modify `shared/diff/profileComparatorService.ts`, `diff/**` (+ specs) | Task 4 |
| Delete `shared/viewRefresh.ts`, `shared/viewRefresh.spec.ts`; modify `workers/background-task.ts`, `shared/workers.factory.ts`, `.claude/CLAUDE.md` | Task 5 |
| Modify `controls/**` | Task 6 |
| Modify `plan/**` input components, `shared/dive.schedules.ts`, `shared/tanks.service.ts`, `shared/depths.service.ts` | Task 7 |
| Modify `calculators/**` | Task 8 |
| Modify the app shell components, `shared/learn/quiz.service.ts` | Task 9 |
| Modify all `*.component.ts`, `eslint.config.mjs`, `.claude/CLAUDE.md` | Task 10 |

---

### Task 1: Toast and learn welcome as signals, test helper
- [x] Status (baseline before the task: lint planner 102 / library 12 errors, planner 821 tests, library 969 tests. After: planner 822 tests pass (+1 learn welcome; the 3 ShareDiveService tests were rewritten), lint at baseline. The learn welcome test passed already before the change: attaching the CDK overlay portal view notifies the zoneless scheduler, so `StartUp` just dropped `refresh()` and `HelpService` needed no signal. The tests fake only `setTimeout`/`clearTimeout`, so the Angular scheduler keeps real animation frames and `whenStable()` resolves. `renderOnPush` must be called before any `TestBed.inject`, since `overrideComponent` fails after the test module is instantiated. `startUp.spec.ts` needs `provideLocationMocks()`, because the overlay subscribes to `Location`. `ShareDiveService.spec.ts` uses a minimal host component, because `DashboardComponent` has no spec and many dependencies.)

**Files:**
- Create `projects/planner/src/testing/onPush.testing.ts`.
- Modify `shared/ShareDiveService.ts`, `shared/ShareDiveService.spec.ts`, `plan/dashboard/dashboard.component.ts`, `shared/startUp.ts`.
- Test the learn welcome in the `StartUp` spec (create `shared/startUp.spec.ts` if missing).

**Interfaces:**
- Produces:
  - `renderOnPush<T>(component: Type<T>, inputs?: Record<string, unknown>): Promise<ComponentFixture<T>>`.
  - `ShareDiveService.toastVisible: boolean`: a getter reading `private readonly _toastVisible = signal(false)`.
  - `ShareDiveService` and `StartUp` no longer inject `ViewRefresh`.

- [ ] **Step 1: Record the baseline.** Run `npm run lint`, `npm run test-ci` and `npm run test-lib-ci`, and write the numbers into this task's Status line.
- [ ] **Step 2: Write the failing tests.**
  - `ShareDiveService.spec.ts`:
    - `'renders toast shown by clipboard response outside Angular events'`: render the dashboard, or a minimal host component reading `toastVisible`, with `renderOnPush`. Emit a successful copy response on the faked `ClipboardService.copyResponse$`, `await whenStable()`, and expect the toast element to be present.
    - The same test for the hide timer: `vi.useFakeTimers()`, advance 5000 ms, and expect the toast to be gone.
    - Remove the `refresh` spy assertions.
  - `'opens learn welcome sidebar after three minutes'`: fake timers, `quizWelcomeEnabled` returning `true`, advance `3 * 60 * 1000`, `await appRef.whenStable()`. Expect `document.querySelector('app-help-sidebar')` to show the welcome document content.
- [ ] **Step 3: Run** both spec files. Expected: the toast tests fail. The learn welcome test may already pass, because attaching the CDK portal view notifies the scheduler. Note the result in Status.
- [ ] **Step 4: Implement.**
  - `toastVisible` becomes a signal: writes go through `_toastVisible.set(...)`, and the `refresh()` calls are removed.
  - `StartUp`: remove `refresh()` if the Step 3 learn welcome test passes without it.
  - If the test failed, `HelpService` keeps `_document` in a signal and `HelpSidebarComponent` reads it, so the test passes.
  - `dashboard.component.ts` keeps its `toastVisible` getter.
- [ ] **Step 5: Run** `npm run test-ci` and `npm run lint`. Expected: all pass, lint at the baseline.
- [ ] **Step 6: Commit** `refactor: toast and learn welcome state as signals`.

### Task 2: `DiveResults` state as signals
- [x] Status (planner 824 tests pass (+3 render tests, −1 callback test), planner lint 98 errors (was 102: the 4 member-ordering errors of `diveresults.ts` are fixed by moving `showStillRunning` to the private methods). The empty states are module-level factory functions (`emptyProfile`, `emptyDiveInfo`, `emptyConsumption`), so they don't affect member ordering. Emptying the consumption keeps the previous `emergencyAscent`, as before (it was never part of `updateConsumptionInternal`). The planner test was replaced by `'Keeps finished results after still running check'`. The serial worker finishes synchronously, so it proves the timer doesn't empty finished results.)

**Files:** modify `shared/diveresults.ts`, `shared/diveresults.spec.ts`, `shared/dive.schedules.ts`, `shared/dives.schedule.spec.ts`, `shared/planner.service.ts`, `shared/planner.service.spec.ts`.

**Interfaces:**
- Produces:
  - Inside `diveresults.ts` (not exported), the immutable records `ProfileState { wayPoints, finalTissues, profile }`, `DiveInfoState` (all fields set by `updateDiveInfo`, plus the derived `maxCeiling`) and `ConsumptionState` (all fields set by `updateConsumption`, including `emergencyAscent`). They are stored in `private readonly _profileState`, `_diveInfoState` and `_consumptionState` signals.
  - `CalculationState` keeps `_calculating` and `_calculated` in signals.
  - `_calculationFailed` becomes a signal.
  - All public getters of `DiveResults` keep their names and types.
  - `DiveResults.start(): void` (callback parameter removed).
  - `DiveSchedules.markStart(diveId: number): void` (callback parameter removed).
  - `PlannerService` still injects `ViewRefresh`, for the workers only (Task 5 removes it).

- [ ] **Step 1: Write the failing tests** in `diveresults.spec.ts`. Use a tiny test host component (`template: '{{ results.noDecoTime }} {{ results.running }}'`) rendered with `renderOnPush`, with a `DiveResults` instance as input.
  - `'renders dive info changed outside Angular events'`: `updateDiveInfo(...)` with `noDecoTime` 42, then expect the text to contain `42`.
  - `'renders still running state after 500 ms'`: fake timers, `start()`, `vi.advanceTimersByTime(500)`, `whenStable()`. Expect the emptied profile to be reflected, i.e. `calculated` renders `false`.
  - `'renders failed state'`: `endFailed()`, then expect `failed` to render `true`.
  - Delete the `afterStillRunning` callback test and update `dives.schedule.spec.ts` and `planner.service.spec.ts` (the `'Refreshes view …'` test is removed, a still running test asserts the `DiveResults` state instead).
- [ ] **Step 2: Run** `diveresults.spec.ts`. Expected: the new tests fail.
- [ ] **Step 3: Implement.**
  - The `update*` and `empty*` methods each build a new record and `set` it once.
  - Remove the `afterStillRunning` chain from `DiveResults.start`, `DiveSchedules.markStart` and `PlannerService.calculate`.
- [ ] **Step 4: Run** `npm run test-ci` and `npm run lint`. Expected: pass, lint at the baseline.
- [ ] **Step 5: Commit** `refactor: dive results state as signals`.

### Task 3: Group "plan results" components
- [x] Status (planner 833 tests in 98 files pass (+9), planner lint 98 errors. Red before the change: the tank chart under OnPush (compile error, then values) and the way point highlighted from the profile chart. The other new tests (diveinfo, dive-issues, profilechart + calculating) already passed, thanks to Task 2's `DiveResults` signals. The gas chart is covered by the diveinfo test, because it only takes the `ConsumedGas` input from a new array.

Deviations from this task's text:
- **Units:** the `TankBound` consumption getters (`consumed`, `reserve`, `endPressure`) are in UI pressure units, like the existing `startPressure`. `tank-chart` no longer converts units, and its `aria-value*` attributes are now in UI units too.
- **Live values:** the getters read the `_consumption` signal only to track the change, and return the live `Tank` values.
- **Way point highlight:** a signal in `WayPoint` broke `toEqual` of copied way points (signals compare by reference). So `SelectedWaypoint` keeps the selected point in a signal, and the table asks `isSelected(point)`.
- **`renderOnPush` fix:** JIT compiling an overridden component that extends `Streamed` (`@Injectable` with `ngOnDestroy`) defined getter-only `ɵfac`/`ɵdir` on `Streamed` (`addDirectiveDefToUndecoratedParents`). Spec files share modules, so other `Streamed` subclasses failed to load at random ("Cannot set property ɵfac … which has only a getter"). The helper now restores the parents' definitions, pinned by `testing/onPush.testing.spec.ts`.)

**Components:** `plan/diveinfo`, `plan/tank-chart`, `plan/gas-chart`, `plan/dive-issues`, `plan/waypoints`, `plan/profilechart`, `controls/calculating`.

**Files:** modify `shared/models.ts` (`TankBound`), `shared/tanks.service.ts` and the components above (+ specs).

**Interfaces:**
- Consumes: the `DiveResults` getters from Task 2.
- Produces:
  - `TankBound.assignConsumption(consumed: number, reserve: number): void`. It writes `tank.consumed` and `tank.reserve`, and sets `private readonly _consumption = signal<{ consumed: number; reserve: number }>`.
  - New `TankBound` getters, each reading `_consumption()` before delegating to `tank`: `consumed`, `reserve`, `endPressure`, `percentsReserve`, `percentsRemaining`, `hasReserve`, `name`.
  - `TanksService.copyTanksConsumption` calls `assignConsumption` for each tank.
  - `TankChartComponent` changes its `@Input() tank` type to `TankBound`, and `diveinfo.component.ts` `tanks` returns `TankBound[]` (`schedules.selectedTanks.tanks`).

- [ ] **Step 1: Write the failing tests.** Use `renderOnPush` in each component's spec.
  - `tank-chart.component.spec.ts` `'renders consumption changed outside Angular events'`: input a `TankBound`, call `assignConsumption(100, 50)`, and expect the end pressure text to update. Adjust the existing unit conversion tests to the `TankBound` input.
  - `diveinfo.component.spec.ts`: `'renders no deco time changed outside Angular events'` and `'renders tank chart after consumption finished outside Angular events'` (call `diveResult.updateConsumption` and `copyTanksConsumption`).
  - `gas-chart`, `dive-issues`, `waypoints` and `calculating`: one test each, updating the `DiveResults` part they display.
  - `profilechart`: `'redraws chart after profile updated outside Angular events'`. It asserts the plot was called again; its existing dispatcher subscription plus `markForCheck()` may already cover it.
- [ ] **Step 2: Run** these spec files. Expected: the tank chart test fails; others fail where the component state is held in plain fields.
- [ ] **Step 3: Implement.**
  - Add the `TankBound` consumption signal and switch `tank-chart` to `TankBound`.
  - Component fields set in dispatcher handlers (e.g. `diveinfo` `checkIssuesTab` and the selected tab) become signals, or are followed by `this.cd.markForCheck()` when they drive MDB tab APIs.
- [ ] **Step 4: Run** `npm run test-ci` and `npm run lint`. Expected: pass.
- [ ] **Step 5: Commit** `refactor: plan results components ready for OnPush`.

### Task 4: Group "diff" components
- [x] Status (planner 842 tests in 98 files pass (+9), planner lint 98 errors. Red before the change: profiles swapped by the service in diff waypoints, the results table and gas consumed; the selected profile in the tab button; the way point highlighted from the diff profile chart. `profileComparatorService.spec` `'Replaces difference array after info calculated'` already passed, because `updateWayPoints` always started with a new array; it now builds the array locally and sets it once. The two calculated dives are prepared by the shared `projects/planner/src/testing/diff.testing.ts` (`diffTestProviders`, `compareTwoCalculatedDives`, `swapComparedProfiles`). Same pattern as Task 3: `SelectedDiffWaypoint` keeps the selected row in a signal, and `diff-waypoints` asks `isSelected(row)` instead of reading `ComparedWaypoint.selected`. Profile A/B consumption (`ConsumptionByMix.combine(tankData)`) reads the `Tank`s directly. That's fine, because a recalculation always also changes the `DiveResults` signals read by `showConsumption`.)

**Components:** `diff/diff`, `diff/tabs`, `diff/tabs/profile-button`, `diff/diveresults`, `diff/diveresults/table`, `diff/gasconsumed/diff-gas-consumed`, `diff/gasconsumed/.../tank-chart`, `diff/profilechart`, `diff/waypoints`.

**Files:** modify `shared/diff/profileComparatorService.ts` (+ spec) and the components above (+ specs).

**Interfaces:**
- Produces: `ProfileComparatorService` keeps `_profileAIndex`, `_profileBIndex`, `_alignByEnd` and `_wayPoints` in signals. All public getters, setters and `selectionChanged$` stay as they are. `updateWayPoints` builds a new array and sets it once (no `unshift` on the stored array).

- [ ] **Step 1: Write the failing tests.**
  - `profileComparatorService.spec.ts` `'replaces difference array after info calculated'`: keep a reference to `difference` before, emit `infoCalculated`, then expect `difference` not to be the same object.
  - `diff-waypoints.component.spec.ts` `'renders difference changed outside Angular events'` (`renderOnPush`, results updated and `infoCalculated` emitted).
  - `diff-diveresults-table` and `diff-gas-consumed`: one `renderOnPush` test each, for results updated outside Angular events.
  - `diff-tabs-button` `'renders selected profile changed by service'`: call the service's profile A/B selection method directly, not through a click.
- [ ] **Step 2: Run** these specs. Expected: fail.
- [ ] **Step 3: Implement** the signals in `ProfileComparatorService`. Components keep their getters.
- [ ] **Step 4: Run** `npm run test-ci` and `npm run lint`. Expected: pass.
- [ ] **Step 5: Commit** `refactor: diff components ready for OnPush`.

### Task 5: Remove `ViewRefresh`
- [x] Status (planner 838 tests in 97 files pass (−2 `viewRefresh.spec`, −5 `afterMessage` tests, +3 new `BackgroundTask` tests for posting, message and error reporting, because the class had no other tests). Library 969 pass. Lint planner 98 / library 12. e2e 8 passed against `ng serve --port 4300`. `workers.factory.ts` is restored to its pre-zoneless version (`git checkout d8bbeab4^`, no `@Injectable`, no constructor); only the zoneless commit had touched it. No `ViewRefresh`/`afterMessage` reference remains. The CLAUDE.md zoneless convention now describes signals, `markForCheck()` only for third-party callbacks, replacing arrays/records, no signals in copied value-like classes, and testing with `renderOnPush`.)

**Files:**
- Delete `shared/viewRefresh.ts` and `shared/viewRefresh.spec.ts`.
- Modify `workers/background-task.ts`, `workers/background-task.spec.ts`, `shared/workers.factory.ts`, `shared/planner.service.ts`, `shared/planner.service.spec.ts`, `shared/PlanUrlSerialization.spec.ts`, `.claude/CLAUDE.md`.

**Interfaces:**
- Produces:
  - `new BackgroundTask<TRequest, TResponse>(worker: Worker)`.
  - `new RestartableBackgroundTask<TRequest, TResponse>(createWorker: () => Worker)`.
  - `WorkersFactory` has no constructor parameters.
  - `PlannerService` has no `ViewRefresh` parameter.

- [ ] **Step 1:** Delete the `afterMessage` tests in `background-task.spec.ts`, and the `ViewRefresh` spy and stub in `planner.service.spec.ts` and `PlanUrlSerialization.spec.ts`.
- [ ] **Step 2:** Remove the `afterMessage` parameter and its calls in both task classes, `refreshView()` and the constructor in `WorkersFactory`, and `ViewRefresh` from `PlannerService`. Delete both `viewRefresh` files. Check that no reference remains: `grep -rn "ViewRefresh\|viewRefresh" projects` returns nothing.
  - `ComputerProfileService` needs no change: its state is exposed by `BehaviorSubject`s with no UI consumer yet. A future component reads them via `toSignal()`.
- [ ] **Step 3:** In `.claude/CLAUDE.md` Conventions, replace the zoneless bullet's "services call `ViewRefresh.refresh()` (`shared/viewRefresh.ts`, marks the root components for check)" with: services keep the UI state that changes outside Angular events in signals (exposed through getters), and components call `ChangeDetectorRef.markForCheck()` only for third-party callbacks. Remove "Worker messages already refresh the view in `BackgroundTask`".
- [ ] **Step 4: Run** `npm run test-ci`, `npm run test-lib-ci`, `npm run lint` and e2e on port 4300. Expected: all pass. The e2e tests prove worker results render in the real app.
- [ ] **Step 5: Commit** `refactor: remove ViewRefresh`.

### Task 6: Group "controls" (shared form controls)
- [ ] Status

**Components:** `card-header`, `controls/altitude`, `controls/gaslabel`, `controls/gradients`, `controls/oxygen-dropdown`, `controls/oxygen`, `controls/pp-o2`, `controls/salinity`, `controls/tank.size`.

**Files:** create `shared/formRefresh.ts` and `shared/formRefresh.spec.ts`; modify the components above (+ specs).

**Interfaces:**
- Produces: `export function refreshOnFormEvents(form: AbstractControl, cd: ChangeDetectorRef, destroyRef: DestroyRef): void` in `shared/formRefresh.ts`. It subscribes to `form.events` with `takeUntilDestroyed(destroyRef)` and calls `cd.markForCheck()`. Controls that take a `FormGroup` input call it in `ngOnInit`.

- [ ] **Step 1: Write the failing tests.**
  - `formRefresh.spec.ts`: `'marks view for check on value change'` and `'stops after destroy'`.
  - Each control receiving a `FormGroup`: `'renders invalid state after parent patched form outside Angular events'`. Use `renderOnPush` with the group as input, call `form.patchValue(<out of range>)`, and expect the `is-invalid` class and the message element.
  - `gaslabel` `'renders gas changed outside Angular events'`, with a `TankBound` or `Tank` input whose O2 is changed in place. If it fails, `gaslabel` takes primitive inputs (`o2`, `he`) from the parent, or the parent passes a new object. Decide in Step 3 and note it in Status.
- [ ] **Step 2: Run** these specs. Expected: fail.
- [ ] **Step 3: Implement** `refreshOnFormEvents` and the wiring in each control, plus the `gaslabel` fix.
- [ ] **Step 4: Run** `npm run test-ci` and `npm run lint`. Expected: pass.
- [ ] **Step 5: Commit** `refactor: form controls ready for OnPush`.

### Task 7: Group "plan inputs"
- [ ] Status

**Components:** `plan/dashboard`, `plan/plan.tabs`, `plan/tanks-simple`, `plan/tanks-complex`, `plan/depths-simple`, `plan/depths-complex`, `plan/depth`, `plan/diveoptions`, `plan/diver`, `plan/mccr-options`, `plan/pscr-options`, `plan/surface-interval`.

**Files:** modify `shared/dive.schedules.ts`, `shared/tanks.service.ts`, `shared/depths.service.ts` (+ specs) and the components above (+ specs).

**Interfaces:**
- Consumes: `refreshOnFormEvents` (Task 6).
- Produces:
  - `DiveSchedules` keeps the dive list and the selected index in signals. `dives`, `selected` and `length` keep their names and types.
  - `TanksService._tanks` and `DepthsService._levels` become signals of arrays, replaced on add, remove and `resetToSimple`.
  - In-place edits of `Tank`/`Level` properties from `scuba-physics` stay unsignalled. A component showing state edited by a sibling subscribes to the matching `ReloadDispatcher` event (`tankChanged$`, `depthChanged$`, `optionsChanged$`, `selectedChanged$`) and calls `this.cd.markForCheck()`.

- [ ] **Step 1: Write the failing tests.** Use `renderOnPush`, changing state through the services or dispatcher only.
  - `depths-complex` `'renders gas of a tank changed in tanks'`: change the tank O2 through `TanksService` and emit `tankChanged`, then expect the gas dropdown label to update.
  - `tanks-complex` and `depths-complex`: `'renders tanks of the dive selected outside the component'` (`schedules.select(1)` + dispatcher event).
  - `diveoptions`, `diver`, `mccr-options`, `pscr-options` and `surface-interval`: `'renders values reloaded from URL'`. Call `PlanUrlSerialization`/`DiveSchedules` loading and emit the reload event, then expect the input values and no stale `is-invalid` class.
  - `plan.tabs` `'renders added dive tab'` and `'renders removed dive tab'` via the service.
- [ ] **Step 2: Run** these specs. Expected: fail.
- [ ] **Step 3: Implement** the service signals, the dispatcher-driven `markForCheck()` calls where tests require them, and `refreshOnFormEvents` for forms reset by reload handlers.
- [ ] **Step 4: Run** `npm run test-ci`, `npm run lint` and e2e on port 4300. Expected: pass.
- [ ] **Step 5: Commit** `refactor: plan input components ready for OnPush`.

### Task 8: Group "calculators"
- [ ] Status

**Components:** `calculators/altitude-calc`, `calculators/gas-blender`, `calculators/gas.props`, `calculators/ndl-limits`, `calculators/nitrox`, `calculators/redundancies`, `calculators/sac`, `calculators/weight`.

**Files:** the components above (+ specs) and their view-model services only where a test requires it.

- [ ] **Step 1: Write the failing tests.** For each calculator, render with `renderOnPush`:
  - `'renders result after input changed'`: type into an input by dispatching an `input` event, then expect the result text.
  - `'renders results after units switched'`: switch `UnitConversion.imperialUnits` before rendering, then expect the unit labels.

  These cover the template event path. They are expected to pass already for most calculators, and they fix the behavior before the Task 10 switch. Where a calculator updates in `valueChanges` subscriptions (e.g. `sac`, which already uses `ChangeDetectorRef`), add `'renders result after form patched in code'`.
- [ ] **Step 2: Run** these specs. Note in Status which ones fail.
- [ ] **Step 3: Implement** fixes for the failing ones only: signals in the calculator view-models, or `refreshOnFormEvents`.
- [ ] **Step 4: Run** `npm run test-ci` and `npm run lint`. Expected: pass.
- [ ] **Step 5: Commit** `refactor: calculators ready for OnPush`.

### Task 9: Group "app shell and help"
- [ ] Status

**Components:** `app.component`, `mainmenu`, `footer`, `about`, `appinfo`, `app-settings`, `help`, `help-sidebar`, `language-dropdown`, `learn`, `qr-code-modal`.

**Files:** the components above (+ specs), `shared/learn/quiz.service.ts` (+ spec).

**Interfaces:**
- Produces:
  - `MainMenuComponent.inPlanner`: a getter over a signal set by the router events subscription.
  - `QuizService` keeps `_question`, `_session`, `_selectedTopic` and `_selectedCategory` in signals; the getters stay.

- [ ] **Step 1: Write the failing tests.** Use `renderOnPush`.
  - `mainmenu` `'renders planner state after navigation'`: navigate with the testing router, then expect the planner-only menu items.
  - `learn` `'renders question retranslated after language change'`: emit `onLangChange`.
  - `help` `'renders document loaded asynchronously'`: `ngx-md` load finishes after the render.
  - `qr-code-modal` `'renders QR code of current URL'`.
  - `app-settings` `'renders saved settings after reset'` (it already uses `ChangeDetectorRef`).
- [ ] **Step 2: Run** these specs. Expected: `mainmenu` and `learn` fail. Note the others.
- [ ] **Step 3: Implement** the signals in `mainmenu` and `QuizService`, plus fixes for any other failing test.
- [ ] **Step 4: Run** `npm run test-ci` and `npm run lint`. Expected: pass.
- [ ] **Step 5: Commit** `refactor: app shell components ready for OnPush`.

### Task 10: Switch to OnPush and enforce it by lint
- [ ] Status

**Files:** all 56 `*.component.ts` under `projects/planner/src/app`, the `ChangeDetectionStrategy.Eager` test hosts in specs, `eslint.config.mjs`, `.claude/CLAUDE.md`.

- [ ] **Step 1: Add the lint rule** `'@angular-eslint/prefer-on-push-component-change-detection': 'error'` to the `rules` of the `**/*.ts` block in `eslint.config.mjs`. Run `npm run lint`. Expected: one new error per component (56, plus spec test hosts), proving the rule is active.
- [ ] **Step 2: Switch:** replace `ChangeDetectionStrategy.Eager` by `ChangeDetectionStrategy.OnPush` in every component, including spec test hosts. Keep it explicit (the rule requires the property even though OnPush is the Angular 22 default). Check with `grep -rn "ChangeDetectionStrategy.Eager" projects`, which should find nothing.
- [ ] **Step 3: Run** `npm run test-ci`, `npm run test-lib-ci`, `npm run lint` (back at the baseline) and e2e on port 4300. Expected: all pass. A failing test points to a component missed in Tasks 3–9. Fix it there with the same patterns (signal, `markForCheck` on a dispatcher event, `refreshOnFormEvents`) and add a `renderOnPush` test for it.
- [ ] **Step 4: Manual checklist** with `npm run start-pwa` (port 9090), confirmed by the user:
  - The calculation result, tank bars and the still-running spinner update.
  - Dive tabs: add, select and remove.
  - Edit a tank's O2, and check the depth gas dropdown follows.
  - A shared URL loads all cards.
  - The units and language switch.
  - The help sidebar and learn quiz work.
  - The QR modal and the share toast work.
  - The diff page loads with both profiles.
  - Every calculator updates on input.
- [ ] **Step 5:** In `.claude/CLAUDE.md` Conventions, add: "All components use `ChangeDetectionStrategy.OnPush` (enforced by `@angular-eslint/prefer-on-push-component-change-detection`). Displayed state changed outside the component's own template events must be a signal, or the component calls `markForCheck()` on the matching `ReloadDispatcher` event; forms reset in code use `refreshOnFormEvents`. Test it with `renderOnPush` (`projects/planner/src/testing/onPush.testing.ts`)."
- [ ] **Step 6: Commit** `perf: switch components to OnPush change detection`.
