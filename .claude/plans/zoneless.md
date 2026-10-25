# Zoneless Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. ONE task per request, then stop for review (see CLAUDE.md Workflow). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the planner without zone.js (Angular zoneless change detection), with the same UI behavior as today, and remove `zone.js` from the project.

**Architecture:**
- **How it works:** Angular zoneless (`provideZonelessChangeDetection()`) runs change detection only when something notifies it: template/host event listeners, `markForCheck()`, signal changes, the `async` pipe, `setInput`.
- **Why few call sites change:** all 54 components use `ChangeDetectionStrategy.Eager`, so any notification refreshes the whole component tree. The work is therefore only to notify Angular wherever the UI state changes outside Angular events. That's not one change per subscription.
- **Where the notifications go:**
  - after each web worker message, centrally in the background tasks;
  - after service timers and callbacks;
  - after Plotly chart events.
- **The notifier:** non-component code notifies through a new `ViewRefresh` service, which coalesces calls into one `ApplicationRef.tick()` in a microtask. Components call their own `ChangeDetectorRef.markForCheck()`.
- **Order:** zone.js stays loaded until the last task. The notifications are harmless with zone.js, so each task can ship on its own.

**Tech Stack:** Angular 22.2 (standalone, `ChangeDetectionStrategy.Eager`), RxJS, Vitest browser mode (`@angular/build:unit-test`), Plotly 4, mdb-angular-ui-kit 11 (already zoneless compatible: uses `afterEveryRender` instead of `NgZone.onStable`), @angular/cdk overlays.

**Spec:** this document (the user asked for zoneless as recommendation 2 of the upgrade review, with no further requirements).

## Global Constraints
- Branch `refactor/zoneless` from the latest clean local `master`.
- Commits: Conventional Commits, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tasks 1–2 `refactor:` (no release). Task 3 `perf: remove zone.js` (patch release; the user-visible effect is a ~36 kB smaller polyfills bundle). Commit only when the user asks.
- No change of component change detection strategies (`Eager` stays), no conversion of component state to signals. Both are out of scope.
- No `NgZone`, `zone.js` or `provideZoneChangeDetection` references remain after Task 3.
- `ViewRefresh` is `@Injectable({ providedIn: 'root' })`. This is a deliberate exception to "register services in `SERVICES` in `app.config.ts`": it avoids adding a provider to every spec that builds `PlannerService` or `ShareDiveService`.
- Lint at most the current baseline: planner 102 errors, library 12 errors, 0 warnings. Tests: library 969, planner 809 + the new ones, `test-performance` 7.
- The user may have `ng serve` running on port 4200. Don't kill it. Run e2e against an own server: `npx ng serve --port 4300` + `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4300 npx playwright test`.

## Review Focus
1. **Refresh while change detection is running.** A synchronous `ApplicationRef.tick()` from code called during a tick (lifecycle hook, template getter) throws "ApplicationRef.tick is called recursively". `ViewRefresh.refresh()` must therefore defer to a microtask (Task 1 test "does not tick synchronously").
2. **Worker message bursts.** The computer worker streams thousands of `point` messages per calculation. Coalescing must give at most one tick per microtask checkpoint, not one per call within the same task (Task 1 test "coalesces calls in one tick").
3. **Worker failure.** When a worker reports an `error`, the failed state must reach the UI, so refresh after `failed$` subscribers ran too (Task 1 tests for both task classes).
4. **"Still running" indicator.** 500 ms after a calculation starts, `DiveResults` empties the not yet calculated parts. That happens in a timer, so without a refresh the UI would keep the stale results (Task 2 test).
5. **Third-party UI without own notifications:** mdb dropdowns, modals and collapse, the CDK help overlay, `ngx-md` help rendering, `angularx-qrcode`. These are covered only by e2e (help page, language switch) and the manual checklist in Task 3.

## File Structure
| File | Change |
|---|---|
| Create `projects/planner/src/app/shared/viewRefresh.ts` | `ViewRefresh` service: coalesced, deferred `ApplicationRef.tick()` |
| Create `projects/planner/src/app/shared/viewRefresh.spec.ts` | unit tests |
| Modify `projects/planner/src/app/workers/background-task.ts` | `afterMessage` callback in both task classes |
| Modify `projects/planner/src/app/workers/background-task.spec.ts` | tests for the callback |
| Modify `projects/planner/src/app/shared/workers.factory.ts` | inject `ViewRefresh`, pass `() => this.viewRefresh.refresh()` |
| Modify `projects/planner/src/app/shared/diveresults.ts`, `dive.schedules.ts`, `planner.service.ts` (+ specs) | "still running" timer callback |
| Modify `projects/planner/src/app/shared/ShareDiveService.ts` (+ spec) | refresh after toast changes |
| Modify `projects/planner/src/app/shared/startUp.ts` | refresh after the delayed learn welcome |
| Modify `projects/planner/src/app/plan/profilechart/profilechart.component.ts`, `diff/profilechart/diff-profilechart.component.ts` | `markForCheck()` in Plotly handlers |
| Modify `projects/planner/src/main.ts`, `angular.json`, `package.json`, `projects/planner/src/environments/environment.ts`, `.claude/CLAUDE.md` | Task 3 switch |

---

### Task 1: `ViewRefresh` and refresh after worker messages
- [x] Status (818 planner tests pass (+9), build ok, e2e 8 passed, lint at baseline. `WorkersFactory` got `@Injectable()` (needed for constructor injection), the callback is created by a private `refreshView()` method because an arrow function field violates `member-ordering`.)

**Files:** create `shared/viewRefresh.ts` and `shared/viewRefresh.spec.ts`; modify `workers/background-task.ts`, `workers/background-task.spec.ts`, `shared/workers.factory.ts`.

**Interfaces:**
- Produces:
  - `export class ViewRefresh { refresh(): void }` in `shared/viewRefresh.ts`: `@Injectable({ providedIn: 'root' })`, constructor `(private appRef: ApplicationRef)`.
  - `new BackgroundTask<TRequest, TResponse>(worker: Worker, afterMessage: () => void = () => {})`
  - `new RestartableBackgroundTask<TRequest, TResponse>(createWorker: () => Worker, afterMessage: () => void = () => {})`
  - `WorkersFactory` constructor `(private viewRefresh: ViewRefresh)`.

- [ ] **Step 1: Write the failing `ViewRefresh` tests** in `viewRefresh.spec.ts`. Get the service from TestBed and spy with `vi.spyOn(TestBed.inject(ApplicationRef), 'tick')`.
  - `'does not tick synchronously'`: `refresh()`, then `expect(tick).not.toHaveBeenCalled()`.
  - `'ticks once after microtask'`: `refresh(); await Promise.resolve();`, then `expect(tick).toHaveBeenCalledTimes(1)`.
  - `'coalesces calls in one tick'`: `refresh(); refresh(); refresh(); await Promise.resolve();`, then `toHaveBeenCalledTimes(1)`.
  - `'ticks again after previous refresh finished'`: two separate refresh + await rounds, then `toHaveBeenCalledTimes(2)`.
- [ ] **Step 2: Write the failing background task tests** in `background-task.spec.ts`, next to the existing fake worker tests.
  - For both `BackgroundTask` and `RestartableBackgroundTask`: `'calls afterMessage after subscribers received the message'`. The subscriber pushes `'received'` to an array, `afterMessage` pushes `'refreshed'`. Dispatch a `message` event on the fake worker, then expect the array to equal `['received', 'refreshed']`.
  - For both classes: `'calls afterMessage after failure was reported'`, the same with an `error` event and `failed$`.
  - `RestartableBackgroundTask`: `'does not call afterMessage for messages of cancelled worker'`.
- [ ] **Step 3: Run** `npx ng test planner --no-watch --include '**/viewRefresh.spec.ts' --include '**/background-task.spec.ts'`. Expected: the new tests fail (missing class or parameter).
- [ ] **Step 4: Implement.**
  - `ViewRefresh`: a `private scheduled = false` flag. `refresh()` returns if scheduled. Otherwise it sets the flag and calls `queueMicrotask`, which resets the flag and calls `this.appRef.tick()`.
  - Background tasks: call `afterMessage()` right after `onCalculated.next(...)` and after `onFailed.next()`, but only in the `isCurrent()` branches of the restartable task.
  - `WorkersFactory`: add a constructor with `super()` and pass `() => this.viewRefresh.refresh()` to all four tasks. `WorkersFactoryCommon` (serial, used by specs) stays unchanged.
- [ ] **Step 5: Run** the command from Step 3, then the full `npm run test-ci` and `npm run lint`. Expected: all pass, lint at the baseline.
- [ ] **Step 6: Commit:** `refactor: refresh view after web worker messages`.

### Task 2: Refresh after timers and chart events
- [x] Status (823 planner tests pass (+5), build ok, e2e 8 passed, lint at baseline. The planner test is named `'Refreshes view after still running check'`: the serial worker factory finishes the calculation synchronously, so it proves the timer wiring, not a really running calculation. `PlanUrlSerialization.spec.ts` constructs `PlannerService` by `new`, it got a no-op `ViewRefresh` stub. `ShareDiveService.spec.ts` also covers the failed copy (no toast, no refresh).)

**Interfaces:**
- Consumes: `ViewRefresh.refresh()` from Task 1.
- Produces:
  - `DiveResults.start(afterStillRunning: () => void = () => {}): void`
  - `DiveSchedules.markStart(diveId: number, afterStillRunning: () => void = () => {}): void`
  - `PlannerService`, `ShareDiveService` and `StartUp` get `ViewRefresh` as a constructor parameter.

- [ ] **Step 1: Write the failing tests.** Use `vi.useFakeTimers()` and restore it in `afterEach`.
  - `diveresults.spec.ts` `'calls after still running callback after 500 ms'`: `start(callback)`, `vi.advanceTimersByTime(499)` → not called; `advanceTimersByTime(1)` → called once, after the profile was emptied (assert `sut.profileCalculated` is `false` inside the callback).
  - `planner.service.spec.ts` `'Refreshes view when calculation still runs after 500 ms'`: spy `vi.spyOn(TestBed.inject(ViewRefresh), 'refresh')`, start a calculation with a background task that doesn't respond, advance 500 ms, expect `refresh` to have been called.
  - `ShareDiveService.spec.ts` (create it if missing, TestBed with a `ClipboardService` and `MdbModalService` from `createSpyObj`): `'Refreshes view when toast hides'`. Make the copy response successful, so `toastVisible` is `true`, then advance 5000 ms. Expect `toastVisible` to be `false` and `refresh` to have been called after it changed.
- [ ] **Step 2: Run** those spec files. Expected: the new tests fail.
- [ ] **Step 3: Implement.**
  - **`DiveResults` and callers:** `DiveResults.start` calls `afterStillRunning()` after `showStillRunning()` in its timer. `DiveSchedules.markStart` passes the callback to every `dive.diveResult.start(...)`, and `PlannerService.calculate` passes `() => this.viewRefresh.refresh()`.
  - **`ShareDiveService`:** calls `refresh()` after setting `toastVisible = true` (the clipboard response can arrive asynchronously) and in the hide timer.
  - **`StartUp.showLearnWelcome`:** calls `refresh()` after `help.openLearnWelcome()`.
  - **Chart components** (`profilechart.component.ts` and `diff-profilechart.component.ts`): in `hookChartEvents`, every Plotly handler (`plotly_hover`, `plotly_click`, `plotly_unhover`) calls `this.cd.markForCheck()` after its handler method.
  - **No change needed:**
    - `learn.component.ts` confetti timer and `help-sidebar.component.ts` `requestAnimationFrame`: DOM only, no Angular state.
    - `language.service.ts`: the `translate` pipe marks itself.
    - `delayedSchedule.service.ts`: its results come through the workers, covered by Task 1.
- [ ] **Step 4: Run** `npm run test-ci`, `npm run lint`. Expected: pass, lint at the baseline.
- [ ] **Step 5: Commit:** `refactor: refresh view after timers and chart events`.

### Task 3: Switch to zoneless and remove zone.js
- [x] Status (library 969, planner 821, performance 7, e2e 8 passed; polyfills 494 bytes (was ~36 kB); lint at baseline; a temporary spec confirmed `Zone` undefined and `NoopNgZone` in tests. Manual checklist confirmed by the user.)

**Correction of Task 1 found here:** the first zoneless e2e run failed (4 of 8, calculation results never rendered). In zoneless mode `ApplicationRef.tick()` uses the "targeted" change detection mode even for a global tick (`useGlobalCheck && !this.zonelessEnabled ? Global : Targeted`), which refreshes only views marked dirty. The `Eager` components were never dirty, so the deferred `tick()` of the original `ViewRefresh` refreshed nothing. `ViewRefresh.refresh()` now calls `markForCheck()` on `appRef.components`. A marked root is refreshed and its children are checked in the global mode, so all `Eager` descendants refresh. The Angular scheduler coalesces calls and `markForCheck()` is safe during change detection, so the microtask and the coalescing flag are gone. The 4 spy based tests were replaced by 2 tests that bootstrap a real root with a nested `Eager` child (without refresh the change stays unrendered, with refresh it renders). Review Focus 1 and 2 are handled by Angular's scheduler now. Overlay and modal views (CDK `attachView`) are separate roots and are not marked by `refresh()`; their content changes only through their own template events.

Other notes:
- `heatMapPlotter.spec.ts`: the comment of the console spy updated, zone.js no longer reports unhandled rejections there (Vitest fails the run on them instead).
- `projects/scuba-physics/package-lock.json` deleted on user request: stale (library 0.1.37, Angular 18), its only `zone.js` was the Angular 18 peer of `@angular/core`. No script reads it, `build/bump-version.ps1` changes only the library `package.json` (`npm pkg set`). The library never depended on zone.js.

- [ ] **Step 1:** `projects/planner/src/main.ts`: replace `provideZoneChangeDetection()` with `provideZonelessChangeDetection()` (both from `@angular/core`).
- [ ] **Step 2:** `angular.json` planner build `polyfills`: `["@angular/localize/init"]` (remove `"zone.js"`). Without zone.js in the polyfills, the unit-test builder omits `zone.js/testing` and TestBed runs zoneless. Remove the commented `zone.js/plugins/zone-error` import from `environments/environment.ts`.
- [ ] **Step 3:** `npm uninstall --legacy-peer-deps zone.js`. The library tests used the builder's "dynamic zone" strategy only because `zone.js` was installed; afterwards they run without zone. The library has no zone dependency.
- [ ] **Step 4: Run** `npm run test-lib-ci`, `npm run test-ci` and `npm run test-performance`. Fix specs that relied on zone.js. Expected candidates: specs that read the DOM after an async event without `fixture.detectChanges()`, and the one `fixture.whenStable()` usage. Fix a spec by calling `fixture.detectChanges()` or `await fixture.whenStable()`, never by weakening an assertion. Any spec failure that points to app code (the UI really doesn't update) gets a refresh at the source, as in Task 2.
- [ ] **Step 5: Verify the bundle and the rest:**
  - `npm run build`: the polyfills bundle shrinks from ~36 kB to ~0.5 kB.
  - `npm run lint` at the baseline.
  - e2e on port 4300: 8 passed.
  - `grep -rn "zone" --include=*.ts --include=*.json projects angular.json package.json` finds no zone.js reference.
- [x] **Step 6: Manual checklist for the user** (confirmed by the user) (`npm start`, then each must update without a further click):
  - Plan a deco dive: profile chart, dive info, consumption and stops table appear.
  - Change depth: the results recalculate and "still running" placeholders appear for long dives.
  - Hover the profile chart: the selected waypoint and the legend values follow the cursor.
  - Compare dives: the diff chart hover works.
  - Share the plan: the toast appears and hides after 5 s; the QR code modal opens.
  - mdb dropdowns (main menu, units), modals and the tank/depth collapse panels.
  - Language switch; help sidebar opens and renders markdown; learn page quiz.
- [ ] **Step 7: Update `.claude/CLAUDE.md`.** Add a Conventions line: zoneless app; state changed outside Angular events must notify via `ViewRefresh.refresh()` (services) or `markForCheck()` (components).
- [ ] **Step 8: Commit:** `perf: remove zone.js`.
