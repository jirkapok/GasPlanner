# Tank consumed pressure as pressure drop (#138) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tank consumption in bars agrees with the consumption by gas in liters, e.g. the #138 dive reports "not enough gas" in both views.

**Architecture:** `Tank` converts consumed liters ↔ bars as the pressure drop from the start pressure (real gas), instead of the pressure of the consumed gas alone in an empty tank. Liters stay the primary value end-to-end: the consumption worker sends consumed and reserve liters to the UI (`ConsumedDto`), and `TankBound.assignConsumption` stores them through the volume setters.

**Tech Stack:** TypeScript, Angular workspace, `scuba-physics` library (`ng-packagr`), Vitest browser mode (Playwright Chromium).

**Spec:** this document (design approved in the conversation on 2026-11-14, see "Design").

## Design

### Root cause (#138 dive)
URL: `t=1-15-0-200-0.209-0&de=0-30-102-1,30-30-1020-1&di=20,30&o=0,9,3,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1,0,20,5`
(15 L air 200 b, 30 m, 1:42 descent + 17 min, RMV 20/30, GF 40/85, fresh water, safety stop auto, problem solving 1 min).

| | Liters (`ConsumedGas`) | Bars (`Tank`) today |
|---|---|---|
| Available | 2893 L | 200 b |
| Consumed | 1759 L | 118 b = `ceil(pressure(1759 L from empty))` = ceil(117.18) |
| Reserve | 1226 L | 82 b = ceil(81.08) |
| Result | 2985 L > 2893 L: not enough | end 82 b ≥ 82 b: enough |

Air compressibility makes the bar ↔ liter relation non linear; the consumed gas leaves from the top of the tank (200 b → 74.98 b), so the real drop is 125.02 b.

### Behavior change

| Conversion | Today | After the fix |
|---|---|---|
| `consumedVolume` setter (liters → bars) | `ceil(pressure(consumedVolume))` | `ceil(round6(start − pressure(startVolume − consumedVolume)))` |
| `consumed` setter (bars → liters) | `volume(consumed)` | `startVolume − volume(start − consumed)`, consumed clamped to 0..start first |
| `fitStoredVolumes` (start pressure / size / gas change) | keeps liters, bars from empty | keeps liters, bars by the `consumedVolume` rule |
| `reserve` / `reserveVolume` | measured from empty | unchanged (reserve is gas left at the bottom of the tank) |
| `ConsumedDto` worker → UI | `consumed`, `reserve` in bars | `consumedVolume`, `reserveVolume` in liters |
| `TankBound.assignConsumption` | bars setters | `assignConsumption(consumedVolume, reserveVolume)` via volume setters |

`round6` = `Precision.round(x, 6)`: `Compressibility.tankPressure` is precise to 0.000001 b only (`pressure(startVolume)` returns 199.9999997 for the #138 tank), so without it 0 L consumed would ceil to 1 b and round trips would ceil 100 b to 101 b.

### Approaches considered
- **Chosen:** fix both directions of the consumed conversion in `Tank` + send liters across the worker boundary. Both setters must be inverses, otherwise bars sent by the worker turn into wrong liters in the UI and `fitStoredVolumes` re-derives wrong bars on any tank edit.
- Patch only `hasReserve`: rejected, shown bars and end pressure stay wrong.
- Compare everything in liters: rejected, duplicates `ConsumedGas`.

### Non-goals
- No UI layout or text change, no new translations, no docs change (`doc/` doesn't describe tank pressure conversion).
- Reserve conversion and `ConsumptionByGas` stay as they are.

## Global Constraints
- Branch `fix/138-tank-consumed-pressure` from the latest `master` (already created).
- Commit messages: Conventional Commits with the issue prefix, e.g. `fix: #138 tank consumed bars as pressure drop from start pressure`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- TDD: failing test first. Existing expectations may only change where they assert a bar ↔ liter value that the new definition changes; recompute the value, never loosen the matcher, never delete a test.
- ESLint: 4-space indent, single quotes, semicolons, 140 chars; `npm run lint` before each commit.
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
- [ ] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/consumption/Tanks.ts` (`consumed` setter ~L271, `consumedVolume` setter ~L277, `fitStoredVolumes` ~L353)
- Test: `projects/scuba-physics/src/lib/consumption/Tanks.spec.ts`

**Interfaces:**
- Produces: unchanged public API of `Tank`; `consumed`/`consumedVolume` semantics per Design.

- [ ] **Step 1: Write the failing tests** in `Tanks.spec.ts` → `Real volumes`:

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

- [ ] **Step 2: Run** `npx ng test scuba-physics --no-watch --include='**/Tanks.spec.ts'` — Expected: the new tests FAIL (e.g. consumed 118 instead of 126).

- [ ] **Step 3: Implement** in `Tanks.ts` a private helper `consumedPressure(consumedVolume: number): number` returning `Precision.ceil(Precision.round(startPressure − toTankPressure(gas, size, volume − consumedVolume), 6))`, used by the `consumedVolume` setter and `fitStoredVolumes`; the `consumed` setter clamps the pressure to 0..startPressure and stores volume `this.volume − Tank.realVolume2(size, startPressure − pressure, gas)`. `updateConsumed` clamps stay. Update the `consumed`/`consumedVolume` doc comments to say "pressure drop from start pressure".

- [ ] **Step 4: Run** the spec again. New tests PASS. Existing tests asserting bar ↔ liter values (`Sets only valid values` → `Start pressure`/`Size`/`Consumed Volume`, `Real volumes` → `Real consumed volume`, `End volume is complement...`) may fail: recompute each expected value from the new definition (keep the matchers), and keep the `prevents minimum 0 b end pressure` / clamping expectations untouched.

- [ ] **Step 5: Run the whole library suite** `npm run test-lib-ci`. Update only value expectations changed by the new bars (expected in `consumption*.spec.ts`, max bottom time, weight); for each changed file note in the commit body why. Any failure not explained by consumed bars → stop and debug (superpowers:systematic-debugging).

- [ ] **Step 6: `npm run lint`, commit**
`fix: #138 tank consumed bars as pressure drop from start pressure`

### Task 2: #138 regression in consumption
- [ ] Status

**Files:**
- Test: `projects/scuba-physics/src/lib/consumption/consumptionByGas.spec.ts`

**Interfaces:**
- Consumes: Task 1 `Tank`; `Consumption.consumeFromTanks2`, `ConsumptionByGas.consume`, `PlanFactory.emergencyAscent`, `BuhlmannAlgorithm.decompression`.

- [ ] **Step 1: Add** `describe('Tank and gas agree (#138)')`: build the #138 dive (options per Design URL: `new Options(0.4, 0.85, 1.4, 1.6, Salinity.fresh)`, ascent speeds 9/3/3, descent 18, gas switch 2, last stop 3, maxEND 30, min auto stop 10, oxygenNarcotic, problem solving 1, no rounding, `SafetyStop.auto`; tank `new Tank(15, 200, 20.9)`; segments `add(30, tank, 102)`, `addFlat(tank, 1020)`; diver `new Diver(20, 30)`, reserves `Consumption.defaultPrimaryReserve`/`defaultStageReserve`), calculate the profile, emergency ascent, both consumptions. Assertions:

```typescript
expect(gas.hasReserve).toBe(false);
expect(tank.hasReserve).toBe(false);
expect(tank.consumed).toBe(126);
expect(tank.reserve).toBe(82);
```

- [ ] **Step 2: Run** `npx ng test scuba-physics --no-watch --include='**/consumptionByGas.spec.ts'` — PASS (Task 1 already fixed it; this pins the bug). Temporarily revert Task 1's `Tanks.ts` (`git stash` of the file) to see it FAIL with `tank.hasReserve` true, then restore.

- [ ] **Step 3: `npm run lint`, commit** `test: #138 tank and gas consumption agree`

### Task 3: Worker sends consumed liters to the UI
- [ ] Status

**Files:**
- Modify: `projects/planner/src/app/shared/serialization.model.ts` (`ConsumedDto` L169)
- Modify: `projects/planner/src/app/shared/dtoSerialization.ts` (`toConsumed` L52)
- Modify: `projects/planner/src/app/shared/models.ts` (`TankBound.assignConsumption` L331)
- Modify: `projects/planner/src/app/shared/tanks.service.ts` (`copyTanksConsumption` L116)
- Test: `projects/planner/src/app/shared/tanks.service.spec.ts`, `projects/planner/src/app/plan/tank-chart/tank-chart.component.spec.ts`

**Interfaces:**
- Produces: `interface ConsumedDto { id: number; consumedVolume: number; reserveVolume: number; }` (liters, not rounded); `TankBound.assignConsumption(consumedVolume: number, reserveVolume: number): void` (liters).

- [ ] **Step 1: Write the failing test** in `tanks.service.spec.ts` → `Copy consumption`: rewrite the DTO literals to liters and add

```typescript
it('keeps consumed liters sent by the worker', () => {
    service.copyTanksConsumption([{ id: 1, consumedVolume: 1000, reserveVolume: 500 }]);
    expect(service.tanks[0].tank.consumedVolume).toBe(1000);
    expect(service.tanks[0].tank.reserveVolume).toBe(500);
});
```
Existing tests there assert bars: change their DTO values to the liters of the same bars on that tank (`new Tank(size, bars, 21).volume` is the reserve liters; consumed liters per Task 1 rule) or assert `consumedVolume`/`reserveVolume` instead.

- [ ] **Step 2: Run** `npm run build-lib`, then `npx ng test planner --no-watch --include='**/tanks.service.spec.ts'` — FAIL (type error / wrong fields).

- [ ] **Step 3: Implement** the Interfaces: `toConsumed` writes `tank.consumedVolume`/`tank.reserveVolume`; `copyTanksConsumption` passes them; `assignConsumption` sets `_tank.consumedVolume` then `_tank.reserveVolume`. Replace the `ConsumedDto` comment "Using pressure instead of volumes, to prevent precision loss" with "Liters, the primary value of the consumption calculation, bars are derived by Tank".

- [ ] **Step 4: Update** `tank-chart.component.spec.ts` calls `assignConsumption(bars, bars)` to liters (or set `tank.tank.consumed`/`tank.tank.reserve` directly where the test is about bars), keeping its assertions.

- [ ] **Step 5: Run** `npm run test-ci` — all planner tests PASS. Value changes only where consumed bars changed (e.g. planner/consumption specs); explain them in the commit body.

- [ ] **Step 6: `npm run lint`, commit** `fix: #138 consumption worker sends tank consumption in liters`

### Task 4: Final verification
- [ ] Status

- [ ] **Step 1:** `npm run test-lib-ci`, `npm run build-lib`, `npm run test-ci`, `npm run lint` — all PASS.
- [ ] **Step 2:** `npm run e2e` (stop any dev server on 4200 first) — PASS.
- [ ] **Step 3:** Manual check: `npm start`, open `/?t=1-15-0-200-0.209-0&de=0-30-102-1,30-30-1020-1&di=20,30&o=0,9,3,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1,0,20,5&ao=1,0`; consumption tab shows not enough gas both in tank (bars) and gas (liters) view, tank consumed 126 b, reserve 82 b.
- [ ] **Step 4:** Whole-branch review per CLAUDE.md (superpowers:requesting-code-review), fix Critical/Important findings test-first, then stop for the user's review.
