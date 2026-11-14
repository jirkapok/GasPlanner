# Tank consumed pressure as pressure drop (#138) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tank consumption in bars agrees with the consumption by gas in liters, e.g. the #138 dive reports "not enough gas" in both views.

**Architecture:** `Tank` converts consumed liters ↔ bars as the pressure drop from the start pressure (real gas), instead of the pressure of the consumed gas alone in an empty tank. Liters stay the primary value end-to-end: the consumption worker sends consumed and reserve liters to the UI (`ConsumedDto`), and `TankBound.assignConsumption` stores them through the volume setters.

**Tech Stack:** TypeScript, Angular workspace, `scuba-physics` library (`ng-packagr`), Vitest browser mode (Playwright Chromium).

**Spec:** this document (design approved in the conversation on 2026-11-14, see "Design").

**State:** all tasks done, final review fixes applied, waiting for the user's review. Not pushed.

## Design

### Root cause (#138 dive)
URL: `t=1-15-0-200-0.209-0&de=0-30-102-1,30-30-1020-1&di=20,30&o=0,9,3,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1,0,20,5`
(15 L air 200 b, 30 m, 1:42 descent + 17 min, RMV 20/30, GF 40/85, fresh water, safety stop auto, problem solving 1 min).

| | Liters (`ConsumedGas`) | Bars (`Tank`) before | Bars (`Tank`) after |
|---|---|---|---|
| Available | 2893 L | 200 b | 200 b |
| Consumed | 1759 L | 118 b = `ceil(pressure(1759 L from empty))` = ceil(117.18) | 126 b = ceil(200 − 74.98) |
| Reserve | 1226 L | 82 b = ceil(81.08) | 82 b |
| Result | 2985 L > 2893 L: not enough | end 82 b ≥ 82 b: enough | end 74 b < 82 b: not enough |

Air compressibility makes the bar ↔ liter relation non linear; the consumed gas leaves from the top of the tank (200 b → 74.98 b), so the real drop is 125.02 b.

### Behavior change

| Conversion | Before | After |
|---|---|---|
| `consumedVolume` setter (liters → bars) | `ceil(pressure(consumedVolume))` | `max(ceil(round4(start − pressure(startVolume − consumedVolume))), 0)`, returns 0 straight away for `consumedVolume <= 0` |
| `consumed` setter (bars → liters) | `volume(consumed)` | `startVolume − volume(start − consumed)`, consumed clamped to 0..start first |
| `fitStoredVolumes` (start pressure / size / gas change) | keeps liters, bars from empty | keeps liters, bars by the `consumedVolume` rule |
| `assignStandardGas` | changes gas only, start volume stays stale | refreshes stored volumes (`fitStoredVolumes`), like the `o2`/`he` setters |
| `loadFrom` | copies reserve in bars (liters rebuilt from rounded bars) | copies reserve bars and liters as they are |
| `reserve` / `reserveVolume` | measured from empty | unchanged (reserve is gas left at the bottom of the tank) |
| `ConsumedDto` worker → UI | `consumed`, `reserve` in bars | `consumedVolume`, `reserveVolume` in liters |
| `TankBound.assignConsumption` | bars setters | `assignConsumption(consumedVolume, reserveVolume)` via volume setters |
| Weight calculator `loadState` | restores consumed bars only | restores start pressure (reserve + consumed) first, same as editing |

`round4` = `Precision.round(x, 4)`: `Compressibility.tankPressure` is precise to about 0.000001 b only (`pressure(startVolume)` returns 199.9999997 for the #138 tank), so without it nothing consumed would ceil to 1 b and round trips would ceil 100 b to 101 b. The plan first said `round6`, which still left 1 b in the custom reserve specs.

### Approaches considered
- **Chosen:** fix both directions of the consumed conversion in `Tank` + send liters across the worker boundary. Both setters must be inverses, otherwise bars sent by the worker turn into wrong liters in the UI and `fitStoredVolumes` re-derives wrong bars on any tank edit.
- Patch only `hasReserve`: rejected, shown bars and end pressure stay wrong.
- Compare everything in liters: rejected, duplicates `ConsumedGas`.

### Non-goals
- No UI layout or text change, no new translations.
- Docs: only the `doc/weight.md` example value is corrected (it didn't match the calculator before this branch either).
- Reserve conversion and `ConsumptionByGas` stay as they are.

## Global Constraints
- Branch `fix/138-tank-consumed-pressure` from the latest `master` (already created).
- Commit messages: Conventional Commits with the issue prefix, e.g. `fix: #138 tank consumed bars as pressure drop from start pressure`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- TDD: failing test first. Existing expectations may only change where they assert a bar ↔ liter value that the new definition changes; recompute the value, never loosen the matcher, never delete a test.
- ESLint: 4-space indent, single quotes, semicolons, 140 chars; `npm run lint` before each commit. `npm run lint` already fails on `master` (13 library, 100 planner errors in untouched files): the branch must not add any (compare error counts with `master`).
- After changing `scuba-physics`, run `npm run build-lib` before planner tests.
- Single spec: `npx ng test scuba-physics --no-watch --include='**/Tanks.spec.ts'` (swap project/name for planner).

## Review Focus
1. **Nothing consumed** (`consumedVolume = 0` on a full tank) must give exactly 0 b consumed and end pressure = start pressure, not 1 b from floating noise (Task 1 test "zero consumed volume is zero bars").
2. **Round trip** bars → liters → bars must give the same whole bars (e.g. 100 b on 15 L / 200 b air), since the UI now rebuilds bars from the worker's liters (Task 1 test "consumed bars round trip").
3. **Over-consumption** (liters above the tank volume, bars above start pressure, negative values) stays clamped to 0..start / 0..volume (existing "Sets only valid values" tests keep passing, Task 1).
4. **Start pressure lowered below consumed** or size shrunk keeps end pressure ≥ 0 and consumed ≤ start (existing `Start pressure` / `Size` tests, values recomputed, Task 1).
5. **Tank changed while the worker calculates** (added/removed tank) still copies consumption by id only (existing `Copy consumption` tests on the new DTO, Task 3).

---

### Task 1: `Tank` consumed conversion as pressure drop
- [x] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/consumption/Tanks.ts` (`consumed` setter, `consumedVolume` setter, `fitStoredVolumes`, new private `consumedPressure`, `assignStandardGas`)
- Test: `projects/scuba-physics/src/lib/consumption/Tanks.spec.ts`
- Modify (expected values only): `consumption.spec.ts`, `consumption.customReserve.spec.ts`, `consumptionByMix.spec.ts`; `consumption.eccr.spec.ts` sets diluent helium via `Tank.he`

**Interfaces:**
- Produces: unchanged public API of `Tank`; `consumed`/`consumedVolume` semantics per Design.

- [x] **Step 1: Write the failing tests** in `Tanks.spec.ts` → `Real volumes`:

```typescript
it('End volume equals volume of end pressure', () => {
    const sut = Tank.createDefault(); // 15 L, 200 b, air
    sut.startPressure = 150;
    sut.consumed = 100;
    const endTank = new Tank(15, 50, 21);
    expect(sut.endVolume).toBeCloseTo(endTank.volume, 3);
});

it('Consumed volume is pressure drop from start pressure', () => {
    const sut = new Tank(15, 200, 20.9);
    sut.consumedVolume = 1758.7324649999996; // #138 dive
    expect(sut.consumed).toBe(126);
    expect(sut.endPressure).toBe(74);
});

it('zero consumed volume is zero bars', () => {
    const sut = new Tank(15, 200, 20.9);
    sut.consumedVolume = 0;
    expect(sut.consumed).toBe(0);
    expect(sut.endPressure).toBe(200);
});

it('consumed bars round trip', () => {
    const sut = Tank.createDefault();
    sut.consumed = 100;
    const volume = sut.consumedVolume;
    sut.consumedVolume = volume;
    expect(sut.consumed).toBe(100);
    expect(sut.endVolume).toBeCloseTo(new Tank(15, 100, 21).volume, 6);
});
```

- [x] **Step 2: Run** `npx ng test scuba-physics --no-watch --include='**/Tanks.spec.ts'`. Result: 3 new tests FAIL (consumed 118 instead of 126, round trip 101). "zero consumed volume is zero bars" passed already (old code gives 0 too), kept as a guard for the rounding noise of the new code.

- [x] **Step 3: Implement** in `Tanks.ts` a private helper `consumedPressure(consumedVolume: number): number` returning `max(Precision.ceil(Precision.round(startPressure − toTankPressure(gas, size, volume − consumedVolume), 4)), 0)`, used by the `consumedVolume` setter and `fitStoredVolumes`; the `consumed` setter clamps the pressure to 0..startPressure and stores volume `this.volume − Tank.realVolume2(size, startPressure − pressure, gas)`. `updateConsumed` clamps stay. Doc comment of `consumed` says "pressure drop from the start pressure".

- [x] **Step 4: Run** the spec again. New tests PASS. Recomputed existing values (matchers kept): `Start pressure` → `preserves consumed volume` end 103 / consumed 47, `Size` → `preserves consumed volume` end 103 / consumed 97, `Consumed Volume` → 1500 L = 108 b, `Real consumed volume` 923.849 L, `End volume is complement...` 1468.531 / 756.857 L.

- [x] **Step 5: Run the whole library suite** `npm run test-lib-ci`. Findings beyond the expected value changes:
  - eCCR diluent consumed 60.3 L instead of 24 L: the spec changed `diluent.gas.fHe` directly, leaving a stale start volume (36 L phantom consumption). Spec now uses `diluent.he = 45`.
  - `assignStandardGas` left a stale start volume (also used by the UI gas dropdown). New test `Assign standard gas` → `Updates volume to the new gas` (RED: 2893 vs 2924.3 L), fixed by calling `fitStoredVolumes()`.
  - Expected values updated in `consumption.spec.ts`, `consumption.customReserve.spec.ts` (tank consumed up to the 25 b reserve now ends exactly at 25 b: 175 instead of 173), `consumptionByMix.spec.ts` (EAN32 total 2924.3 L, consumed liters of bars lower). Max bottom times shorter (27→26, 51→49, 177→173 min). Bar arithmetic comments in `customReserve` rewritten.
  - Result: 1036/1036 PASS.

- [x] **Step 6: Lint (no new errors vs `master`), commit**
`fix: #138 tank consumed bars as pressure drop from start pressure`

### Task 2: #138 regression in consumption
- [x] Status

**Files:**
- Test: `projects/scuba-physics/src/lib/consumption/consumptionByGas.spec.ts`

**Interfaces:**
- Consumes: Task 1 `Tank`; `Consumption.consumeFromTanks2`, `ConsumptionByGas.consume`, `PlanFactory.emergencyAscent`, `BuhlmannAlgorithm.decompression`.

- [x] **Step 1: Add** `describe('Tank and gas consumption agree (#138)')`: build the #138 dive (options per Design URL: `new Options(0.4, 0.85, 1.4, 1.6, Salinity.fresh)`, ascent speeds 9/3/3, descent 18, gas switch 2, last stop 3, maxEND 30, min auto stop 10, oxygenNarcotic, problem solving 1, no rounding, `SafetyStop.auto`; tank `new Tank(15, 200, 20.9)`; segments `add(30, tank, 102)`, `addFlat(tank, 1020)`; diver `new Diver(20, 30)`, reserves `Consumption.defaultPrimaryReserve`/`defaultStageReserve`), calculate the profile, emergency ascent, both consumptions. Assertions:

```typescript
expect(gas.hasReserve).toBe(false);
expect(tank.hasReserve).toBe(false);
expect(tank.consumed).toBe(126);
expect(tank.reserve).toBe(82);
```

- [x] **Step 2: Run** `npx ng test scuba-physics --no-watch --include='**/consumptionByGas.spec.ts'` — PASS. With the `master` version of `Tanks.ts` it FAILS (`tank.hasReserve` true, consumed 118), restored afterwards.

- [x] **Step 3: Commit** `test: #138 tank and gas consumption agree`

### Task 3: Worker sends consumed liters to the UI
- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/serialization.model.ts` (`ConsumedDto`)
- Modify: `projects/planner/src/app/shared/dtoSerialization.ts` (`toConsumed`)
- Modify: `projects/planner/src/app/shared/models.ts` (`TankBound.assignConsumption`)
- Modify: `projects/planner/src/app/shared/tanks.service.ts` (`copyTanksConsumption`)
- Test: `tanks.service.spec.ts`, `tank-chart.component.spec.ts`
- Modify (expected values only): `planner.service.spec.ts`, `preferencesStore.spec.ts`, `weight.component.spec.ts`, `gases-comparison.service.spec.ts`

**Interfaces:**
- Produces: `interface ConsumedDto { id: number; consumedVolume: number; reserveVolume: number; }` (liters, not rounded); `TankBound.assignConsumption(consumedVolume: number, reserveVolume: number): void` (liters).

- [x] **Step 1: Write the failing test** in `tanks.service.spec.ts` → `Copy consumption`: DTO literals in liters, asserting `consumedVolume`/`reserveVolume`, plus

```typescript
it('keeps consumed liters sent by the worker', () => {
    service.copyTanksConsumption([{ id: 1, consumedVolume: 1000, reserveVolume: 500 }]);
    const tank = service.tanks[0].tank;
    const reference = new Tank(tank.size, tank.startPressure, tank.o2);
    reference.consumedVolume = 1000;

    expect(tank.consumedVolume).toBe(1000);
    expect(tank.reserveVolume).toBe(500);
    expect(tank.consumed).toBe(reference.consumed);
});
```

- [x] **Step 2: Run** `npm run build-lib`, then `npx ng test planner --no-watch --include='**/tanks.service.spec.ts'` — FAIL (TS2353 `consumedVolume` not in `ConsumedDto`).

- [x] **Step 3: Implement** the Interfaces: `toConsumed` writes `tank.consumedVolume`/`tank.reserveVolume`; `copyTanksConsumption` passes them; `assignConsumption` sets `_tank.consumedVolume` then `_tank.reserveVolume`. `ConsumedDto` comment: "Liters, the primary value of the consumption calculation, bars are derived by the Tank."

- [x] **Step 4: Update** `tank-chart.component.spec.ts`: local helper `assignBars(target, consumed, reserve)` converts bars to liters through a library `Tank` and calls `assignConsumption`, keeping the change notification and all assertions.

- [x] **Step 5: Run** `npm run test-ci` — 1075/1075 PASS after updating values: default 30 m dive max time 17 min / 117 b remaining (was 18 / 125), preferences store keeps the worker liters (consumed 109 / 24 b), weight 3.4 / 7.6 kg (was 3.5 / 7.8), gas comparison 48.938 cuft (was 53.226).

- [x] **Step 6: Lint (no new errors vs `master`), commit** `fix: #138 consumption worker sends tank consumption in liters`

### Task 4: Final verification
- [x] Status

- [x] **Step 1:** `npm run test-lib-ci` (1036/1036), `npm run build-lib`, `npm run test-ci` (1075/1075) PASS; `npm run lint` error counts equal to `master`.
- [x] **Step 2:** `npm run e2e` — 9/9 PASS.
- [x] **Step 3:** Manual check of the #138 URL in the browser: Consumed tab shows tank 74/200 b with rock bottom 82 b (red), in liters reserve 1226 L + consumed 1759 L > available 2893 L, issue "Not enough gas to realize the dive".
- [x] **Step 4:** Whole-branch review per CLAUDE.md (superpowers:requesting-code-review) — verdict "With fixes", one Important finding, fixed in Task 5.

### Task 5: Review fix — weight calculator reload
- [x] Status

**Files:**
- Modify: `projects/planner/src/app/calculators/weight/weight.component.ts` (private `assignConsumed(consumedBars)` used by `inputChanged` and `loadState`)
- Test: `projects/planner/src/app/calculators/weight/weight.component.spec.ts`

- [x] **Step 1: Failing test** `Restores the same weight after reload`: consume 100 b, recreate the component, expect start pressure 130 b and the same weight. RED: start pressure 200 (default) after reload.
- [x] **Step 2: Implement** `assignConsumed`: start pressure = reserve + consumed, then consumed bars; `loadState` calls it too. GREEN, planner suite 1076/1076, lint unchanged.
- [x] **Step 3: Commit** `fix: #138 weight calculator restores start pressure with consumed gas`

### Task 6: Review follow-ups requested by the user
- [x] Status

- [x] **Step 1:** `Tank.loadFrom` copies reserve bars and liters as they are (`updateReserve`). Test `Load From` → `Copies precise reserve volume` RED (665.81 vs 664.38 L) → GREEN. Commit `fix: #138 tank copy keeps precise reserve volume`.
- [x] **Step 2:** `consumedPressure` returns 0 straight away for `consumedVolume <= 0` (skips the compressibility search). Refactor covered by "zero consumed volume is zero bars". Commit `refactor: #138 skip pressure search when nothing consumed`.
- [x] **Step 3:** `consumption.spec.ts` comments note the ideal gas arithmetic (72 b, 60 b) and that real gas from the full tank needs more bars. Commit `test: #138 consumption spec comments note ideal gas arithmetic`.
- [x] **Step 4:** `doc/weight.md` example 2.7 kg (5.9 lb) for 150 b from 15 L, matching the calculator (2.67 kg). Commit `docs: #138 weight example matches the calculator`.
- [x] **Step 5:** `npm run test-lib-ci` 1040/1040, `npm run build-lib`, `npm run test-ci` 1076/1076 PASS, library lint unchanged.

## Deferred (not in scope, from the final review)
- Bars and liters can still differ by up to 1 b right at the limit (ceil rounding of consumed and reserve), always on the safe side.
- Changing `tank.gas` directly (outside `Tank`) leaves a stale start volume, which now shows up as phantom consumed bars. Production paths are safe.
- `TanksService.calculateTurnPressure` halves consumed bars, which is slightly late for real gas (existed before, improved by the fix).
- Start pressures above about 700 b, where the compressibility search doesn't converge, are now reached on every tank refresh. UI caps pressure at 350 b.
- `npm run lint` errors already on `master`.
