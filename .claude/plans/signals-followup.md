# Signals Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the items deferred by the signals and OnPush migration, so that state edited in place is tracked by the service owning it instead of by global events or `markForCheck()`.

**Architecture:** Each service or wrapper that is edited in place gets one private `_version` signal, increased by every write and read by every getter, the pattern `TankBound` already uses. Components then stop subscribing to `ReloadDispatcher` events only to call `markForCheck()`. Each removal is proven by an existing or new `renderOnPush` test.

**Tech Stack:** Angular 22 zoneless, OnPush by default, signals, Vitest browser mode, `renderOnPush` (`projects/planner/src/testing/onPush.testing.ts`).

**Spec:** the deferred list of the merged signals and OnPush work (branch `refactor/signals`, merged in 0.19.1): global options version (review finding 5), public `TankBound.tank` with direct writes (review finding 6), `DepthsService` and `QuizService` without signals, redundant `markForCheck` in `diff-tabs-button`. Lint debt is out of scope.

## Global Constraints

- Branch `refactor/signals-followup`, created from `master` 0.20.0.
- Implement ONE task per request, run its verification, tick its Status, then STOP for review (CLAUDE.md).
- TDD: the failing test first. A test that already passes before the change is kept as a pin, and the Status says so.
- Production code removing a `markForCheck()` subscription is accepted only when an OnPush test of that view passes without it.
- Commit types: `refactor:` or `test:` (no release). Message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verification per task: the task's specs, `npm run test-ci`, `npm run lint` (no new errors against the baseline recorded in Task 1).
- Don't put signals into value-like classes copied and compared by tests (`WayPoint`, `Level`, `Options`). Keep the version signal in the owning service or wrapper.

## Review Focus

1. **Options edited past the service.** `options.airBreaks` and `getOptions()` return mutable objects (`diveoptions` writes `airBreaks.oxygenDuration`, `dtoSerialization` writes air breaks while loading). An edit there doesn't increase the options version. Expected: nothing shown depends on it without a following `sendOptionsChanged()`/`loadFrom()`. Task 2 adds a test that the dive options air break fields still render after reload.
2. **The units switch.** `SettingsNormalizationService` rewrites options, diver and tanks through setters after a units change. Expected: tank sizes, MOD and RMV shown in the new units without a reload. Task 3 adds a units switch test for the tank size.
3. **Selecting another dive.** Each dive has its own `OptionsService`, `TanksService` and `DepthsService`. A view reading the selected dive's service must switch to the other instance. Covered by the existing `'renders levels of the dive selected outside the component'`, which must stay green in Task 4.
4. **Simple view reset.** `setToSimple` resets depths of all dives at once without sending `depthChanged$`. Expected: tab titles of all dives follow. Task 4 adds a test.
5. **Calculators restoring their state.** Weight, SAC and gas blender load the last state before the first render. Expected: the restored values are shown. The existing calculator specs pin it, Task 3 must keep them green.

---

### Task 1: Remove the redundant refresh of the diff tab button

**Files:**
- Modify: `projects/planner/src/app/diff/tabs/profile-button/diff-tabs-button.component.ts`
- Test: `projects/planner/src/app/diff/tabs/profile-button/diff-tabs-button.component.spec.ts` (existing `'renders selected profile changed by service'`)

**Interfaces:**
- Produces: nothing new. `DiffTabsButtonComponent` no longer extends `Streamed` and has no `ChangeDetectorRef`.

- [ ] Status
- [ ] **Step 1: Record the baseline.** Run `npm run lint`, `npm run test-ci`, `npm run test-lib-ci` and write the numbers into this task's Status.
- [ ] **Step 2: Remove** the `selectionChanged$` subscription, the `ChangeDetectorRef` and `Streamed` from `DiffTabsButtonComponent`. `state` reads `profileAIndex`/`profileBIndex`, which are signals.
- [ ] **Step 3: Run** `ng test planner --no-watch --include='**/diff-tabs-button.component.spec.ts'`. Expected: PASS, including the OnPush test. If it fails, restore the subscription and note why in Status.
- [ ] **Step 4: Run** `npm run test-ci`, `npm run lint`. Expected: pass, lint at baseline.
- [ ] **Step 5: Commit** `refactor: diff tab button reads selection signals only`.

### Task 2: Options track their own changes

**Files:**
- Modify: `projects/planner/src/app/shared/options.service.ts`, `projects/planner/src/app/shared/models.ts` (`DiverOptions`), `projects/planner/src/app/shared/reloadDispatcher.ts`, `projects/planner/src/app/plan/diveoptions/diveoptions.component.ts`
- Test: `projects/planner/src/app/shared/options.service.spec.ts`, `projects/planner/src/app/plan/diveoptions/diveoptions.component.spec.ts`, `projects/planner/src/app/controls/gaslabel/gaslabel.component.spec.ts`

**Interfaces:**
- Produces:
  - `OptionsService`: `private readonly _version = signal(0)`, `private changed(): void`, `private get tracked(): Options` (reads `_version`, returns `options`). Every public getter reads through `tracked`. Every setter, `useRecreational`, `useRecommended`, `useSafety*`, `loadFrom`, `applyDiver`, `resetToSimple`, `switchAirBreaks` calls `changed()`.
  - `toxicity` is `computed(() => new GasToxicity(this.tracked))`.
  - `DiverOptions` constructor gains a third optional parameter `onChanged: () => void = () => {}`, called by each setter. `OptionsService.diverOptions` passes `() => this.changed()`, and its getters read `tracked` before returning.
  - `ReloadDispatcher.trackOptions()` and `_optionsVersion` are removed.

- [ ] Status
- [ ] **Step 1: Write the failing tests** in `options.service.spec.ts`:
  - `'renews toxicity after max ppO2 changed by diver options'`: read `service.toxicity`, set `service.diverOptions.maxPpO2 = 1.2`, expect `service.toxicity` not to be the first instance and `service.toxicity.modForGas(...)` to use 1.2.
  - `'keeps toxicity without change'`: two reads return the same instance.
  - `'renews toxicity after salinity changed'`: setter path, new instance.
- [ ] **Step 2: Run** `ng test planner --no-watch --include='**/options.service.spec.ts'`. Expected: the diver options test FAILS (the dispatcher isn't called).
- [ ] **Step 3: Implement** the interfaces above. Remove `trackOptions()`, `_optionsVersion` and its updates from `ReloadDispatcher`, keep the events.
- [ ] **Step 4: Write** the OnPush tests:
  - in `tanks-complex.component.spec.ts` `'renders MOD after diver options changed outside Angular events'`: `renderOnPush(TanksComplexComponent)` with `planTestProviders`, set `DiveSchedules.selectedOptions.diverOptions.maxPpO2 = 1.2`, `await fixture.whenStable()`, expect the MOD of the gas label to change (the component passes `toxicity` from the service, so a new instance reaches `app-gaslabel`).
  - in `diveoptions.component.spec.ts` `'renders air breaks reloaded outside the component'`: `loadFrom` options with air breaks enabled, expect the air break fields shown (Review Focus 1).
- [ ] **Step 5: Remove** the `markForCheck()` from the `diveoptions` reload handler. Run the `diveoptions` spec. Expected: `'renders gradients reloaded outside the component'` and the new test PASS. If not, restore it and note in Status which getter isn't tracked.
- [ ] **Step 6: Run** `npm run test-ci`, `npm run lint`. Expected: pass.
- [ ] **Step 7: Commit** `refactor: options track their own changes`.

### Task 3: Tank of `TankBound` is read-only

**Files:**
- Modify: `projects/planner/src/app/shared/models.ts` (`TankBound`), `projects/planner/src/app/calculators/weight/weight.component.ts`, `projects/planner/src/app/calculators/sac/sac.component.ts`, `projects/planner/src/app/calculators/gas-blender/gas-blender.component.ts`, `projects/planner/src/app/controls/gaslabel/gaslabel.component.ts`, every other `trackedTank` reader
- Test: `projects/planner/src/app/shared/models.spec.ts`, `weight.component.spec.ts`, `sac.component.spec.ts`, `gas-blender.component.spec.ts`, `projects/planner/src/app/controls/tank.size/tank.size.component.spec.ts`

**Interfaces:**
- Produces on `TankBound`:
  - constructor `(tank: Tank, units: UnitConversion)` stores `private readonly _tank`.
  - `public get tank(): Readonly<Tank>` reads `_version` (replaces `trackedTank`, which is removed).
  - new setters in metric units, each calling `changed()`: `sizeLiters: number`, `startPressureBars: number`, `consumedBars: number`.
- Consumes: Task 2 doesn't touch `TankBound`.

- [ ] Status
- [ ] **Step 1: Write the failing tests** in `models.spec.ts` (`TankBound`):
  - `'sizeLiters keeps liters'`: set `sizeLiters = 15`, expect `tank.size` 15 and `bound.size` 15 in metric.
  - `'startPressureBars keeps bars'` and `'consumedBars keeps bars'`, same pattern.
  - `'tank reads are tracked'`: `const c = computed(() => bound.tank.o2)`, read it, set `bound.o2 = 32`, expect `c()` 32.
- [ ] **Step 2: Run** the `models.spec.ts`. Expected: FAIL, the setters don't exist.
- [ ] **Step 3: Implement** the interfaces. Run `npx tsc -p projects/planner/tsconfig.app.json --noEmit` and fix every assignment to `bound.tank.*` it reports by the new setters: weight `loadState` and `inputChanged`, sac `loadState`, gas blender `loadTankState` (takes the `TankBound` instead of the `Tank` and uses `o2`, `he`, `startPressureBars`). Replace `trackedTank` by `tank`.
- [ ] **Step 4: Check** with `git grep -nE "\.tank\.(size|consumed|reserve|startPressure|o2|he|id)\s*=[^=]" projects/planner/src/app -- ':!*.spec.ts'` that no write through `.tank` of a `TankBound` remains (`GasProperties.tank` in `quiz.questions.ts` and segment/level `tank` assignments are not `TankBound` and stay). Specs writing `component.tank.tank.size` switch to `sizeLiters`.
- [ ] **Step 5: Write** `'renders tank size after units switched'` in `tank.size.component.spec.ts` (Review Focus 2): render with `renderOnPush`, switch `units.imperialUnits = true` and normalize through `SettingsNormalizationService`, expect the size in cubic feet.
- [ ] **Step 6: Run** `npm run test-ci`, `npm run lint`. Expected: pass, weight, SAC and gas blender specs green (Review Focus 5).
- [ ] **Step 7: Commit** `refactor: tank of TankBound is changed only by its setters`.

### Task 4: Depths track their own changes

**Files:**
- Modify: `projects/planner/src/app/shared/depths.service.ts`, `projects/planner/src/app/plan/plan.tabs/plan.tabs.component.ts`, `projects/planner/src/app/plan/depths-complex/depths-complex.component.ts`, `.claude/CLAUDE.md`
- Test: `projects/planner/src/app/shared/depths.service.spec.ts`, `plan.tabs.component.spec.ts`, `depths-complex.component.spec.ts`

**Interfaces:**
- Produces on `DepthsService`: `private readonly _version = signal(0)`, `private changed(): void`, `private get trackedPlan(): Plan`. `levels`, `segments`, `plannedDepth(Meters)`, `planDuration`, `notEnoughTime`, `startAscentTime`, `needsReturn`, `startAscentIndex`, `minimumSegments`, `bestNitroxMix` read through it. `changed()` is called by `updateLevels`, `apply`, `tankRemoved`, `fixDepths` (public) and `levelChanged`. `Level` stays without a signal.

- [ ] Status
- [ ] **Step 1: Write the failing tests:**
  - `depths.service.spec.ts` `'tracks planned depth'`: `const c = computed(() => service.plannedDepth)`, read, set `plannedDepth = 40`, expect `c()` 40.
  - `depths.service.spec.ts` `'tracks level edited in place'`: computed over `service.levels[1].endDepth`, set `levels[1].endDepth = 25` and call `levelChanged()`, expect 25.
  - `plan.tabs.component.spec.ts` `'renders titles of all dives reset to simple'` (Review Focus 4): two dives, the second one complex with another depth, `ViewSwitchService.isComplex = false`, expect both titles updated.
- [ ] **Step 2: Run** these specs. Expected: the computed tests FAIL. Note in Status whether the tab test already passes.
- [ ] **Step 3: Implement** the interfaces.
- [ ] **Step 4: Remove** the `merge(depthChanged$, depthsReloaded$, setToSimple$)` subscription and `ChangeDetectorRef` use other than `ngAfterViewInit` from `plan.tabs`, and the `tankChanged$` and reload `markForCheck()` from `depths-complex`. Run both specs. Expected: `'renders title of depth changed outside the component'`, `'renders gas of a tank changed in tanks'`, `'renders levels reloaded outside the component'` and `'renders levels of the dive selected outside the component'` PASS. Restore any removal whose test fails and note it.
- [ ] **Step 5: Update** the OnPush bullet in `.claude/CLAUDE.md` Conventions: replace "A component showing state edited in place by a sibling calls `markForCheck()` on the matching `ReloadDispatcher` event (see `depths-complex`)" by "State edited in place is tracked by a `_version` signal of the owning service or wrapper, increased by each write and read by each getter (see `TankBound`, `DepthsService`, `OptionsService`)", keeping any `markForCheck()` left by Step 4 as the example.
- [ ] **Step 6: Run** `npm run test-ci`, `npm run lint`, and e2e on port 4300 (`npx ng serve --port 4300`, then `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4300 npx playwright test`, stop the server). Expected: all pass.
- [ ] **Step 7: Commit** `refactor: depths track their own changes`.

### Task 5: Quiz state pinned under OnPush

**Files:**
- Modify (only if Step 2 fails): `projects/planner/src/app/shared/learn/quiz.service.ts`
- Test: `projects/planner/src/app/learn/learn.component.spec.ts`

**Interfaces:**
- Produces (only if Step 2 fails): `QuizService` keeps `_selectedTopic`, `_selectedCategory`, `_session` and `_question` in signals behind the existing getters.

- [ ] Status
- [ ] **Step 1: Write** in `learn.component.spec.ts` `'renders question selected outside Angular events'`: `renderOnPush(LearnComponent)`, call `quizService.selectByName(<second topic>, <its first category>)`, `await fixture.whenStable()`, expect the second topic's question text, and `'renders question retranslated outside Angular events'`: switch the language through `TranslateService.use`, expect the translated question.
- [ ] **Step 2: Run** the `learn.component.spec.ts`. If both PASS, keep them as pins, skip Step 3 and note it in Status (no production change).
- [ ] **Step 3: Implement** the signals only for the failing case. Run the spec. Expected: PASS.
- [ ] **Step 4: Run** `npm run test-ci`, `npm run lint`, then `npm run start-pwa` for a short manual check by the user: dive tabs titles, depth levels with tank labels, dive options reload from a shared URL, MOD after a ppO2 change, weight/SAC/gas blender restore, compare page profile selection, learn quiz.
- [ ] **Step 5: Commit** `test: pin quiz state under OnPush` (or `refactor: quiz state as signals` when Step 3 changed code).
