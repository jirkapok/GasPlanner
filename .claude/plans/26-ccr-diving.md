# CCR / Rebreather Support (#26) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Dugong plan pSCR, mCCR and eCCR dives (loop deco, O2 toxicity, loop/bailout gas consumption, CCR results UI), delivered in 5 isolated stages. This document has the **detailed, executable plan for Stage 1**. Stages 2–5 are kept as a roadmap and get their own detailed plan when each starts, because they build on Stage 1 code that doesn't exist yet.

**Architecture:** Stage 1 adds a `BreathingModel` interface in `scuba-physics/src/lib/ccr`. Every place that today reads `segment.gas` as "what the diver breathes" asks the injected model instead: tissue loading, gas switching/air breaks, CNS/OTU, density/END events and plan consumption. The emergency (bailout) ascent is always calculated as open circuit (`OpenCircuitBreathing`); superseded in Stage 2 by `BailoutBreathing` (Task 2.7). `OpenCircuitBreathing` is the default and reproduces today's numbers exactly. CCR physics formulas (`Rebreathers.ts`, `LoopGas.ts`) and `RebreatherOptions` are added but not wired to any UI.

**Tech Stack:** TypeScript, Angular workspace (`ng-packagr` library `scuba-physics`), Jasmine + Karma (ChromeHeadless).

**Spec:** this document. The "Roadmap" section at the bottom is the agreed design for stages 2–5.

## Global Constraints
- Branch: Stage 1 runs on the existing `feat/26-ccr_diving` (it holds the POC). Every later stage starts in a new branch from the latest clean `master`.
- Commit messages: Conventional Commits with the issue prefix, e.g. `refactor(scuba-physics): #26 inject breathing model into algorithm`. Each commit message ends with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- ESLint: 4-space indent, **single quotes**, semicolons, 140-char lines. Run `npm run lint` before finishing.
- `CircuitType` member names: `oc`, `pscr`, `mccr`, `eccr` (camelCase, required by the `naming-convention` lint rule).
- Generic rebreather formulas live in `ccr/Rebreathers.ts`, never in a file called `RebreatherFormulas`.
- OC results must stay **bit-for-bit identical**. No existing spec may be edited to make it pass.
- Pure computation belongs in `scuba-physics`. No planner (`projects/planner`) changes in Stage 1, except that it must keep compiling (`npm run test-ci`).
- Library tests only (unit tests); no component tests in Stage 1.
- Single-spec command pattern: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/ccr/Rebreathers.spec.ts'`.

## Review Focus
1. **OC identity after refactoring:** a dive planned without any breathing model returns exactly the same stops, CNS, OTU, density and consumption as before. The whole existing `npm run test-lib-ci` suite must pass unchanged (Task 8, Step 7).
2. **Shallow setpoint higher than ambient pressure** (e.g. SP 1.3 at the surface): the loop must become 100 % O2, never fO2 > 1 or a `Gas` constructor exception (Task 3 test "clamps to pure oxygen at shallow depth").
3. **Floating-point O2 + He just above 1.0** in a computed loop gas must not throw `O2 + He can't exceed 100 %` (Task 3 test "never exceeds 100 % for hypoxic trimix diluent").
4. **pSCR supply too small for metabolic O2** (shallow, low RMV): the loop must clamp to fO2 = 0, not go negative or divide by zero (Task 3 tests "hypoxic at surface" and "supply equal to metabolic consumption").
5. **Explicitly passed `OpenCircuitBreathing`** must behave exactly like passing no model in every injection point: algorithm, statistics, NDL, consumption, max bottom time, CNS/OTU/daily, density and events (each task's "explicit open circuit ... same as without model" tests). Branches that only a rebreather model can reach (no gas switching, no air breaks, a loop gas different from the source gas) are pinned by the Stage 2 and Stage 3 specs.

> **Superseded by Task 2.8:** the breathing model is now a mandatory parameter everywhere, so "no model" no longer exists. The optional `breathing?` signatures and the "explicit open circuit ... same as without model" specs below describe Stage 1 as it was implemented; OC identity is now proven by the existing specs passing `OpenCircuitBreathing` explicitly with unchanged expected values. The Stage 1 `*.breathing.spec.ts` files were dissolved into the regular specs (Task 2.8 "Specs").

## File Structure (Stage 1)
| File | Responsibility |
|---|---|
| Create `projects/scuba-physics/src/lib/ccr/Rebreathers.ts` | Pure generic rebreather formulas (supply/O2/diluent rates). Replaces POC `ccrConsumption.ts`. |
| Create `projects/scuba-physics/src/lib/ccr/RebreatherOptions.ts` | `CircuitType` enum + `RebreatherOptions` (defaults, `loadFrom`). |
| Create `projects/scuba-physics/src/lib/ccr/LoopGas.ts` | Loop gas fractions for constant ppO2 (eCCR/mCCR) and pSCR steady state. Replaces POC `ccrGases.ts`. |
| Create `projects/scuba-physics/src/lib/ccr/BreathingModel.ts` | `BreathingModel` interface, `OpenCircuitBreathing`. |
| Delete `projects/scuba-physics/src/lib/ccr/ccrGases.ts`, `ccrConsumption.ts` | POC replaced. |
| Modify `algorithm/Options.ts` | Holds `rebreather: RebreatherOptions`. |
| Modify `algorithm/BuhlmannAlgorithmParameters.ts`, `AlgorithmContext.ts`, `BuhlmannAlgorithm.ts` | Breathing model injection, `isAscent`, gas switch/air break guards. |
| Modify `consumption/consumptionCommon.ts`, `consumption/consumption.ts` | Plan consumption via the model; the emergency ascent and the reserve are always OC. |
| Modify `calculators/cnsCalculator.ts`, `OtuCalculator.ts`, `cnsDailyCalculator.ts` | ppO2 from the model, `calculateByPpO2`. |
| Modify `gases/GasDensity.ts`, `algorithm/ProfileEvents.ts` | Density/END from the inspired gas. |
| Modify `src/public-api.ts` | Export the new `ccr` files. |

All paths below are relative to `projects/scuba-physics/src/lib/` unless they start with `projects/`.

---

## Stage 1: Preparation (detailed plan)
- [x] Status

### Task 1: Generic rebreather formulas (`Rebreathers.ts`)
- [x] Status

**Files:**
- Create: `ccr/Rebreathers.ts`
- Create: `ccr/Rebreathers.spec.ts`
- Delete: `ccr/ccrConsumption.ts`

**Interfaces:**
- Produces: `Rebreathers.pscrSupplyRate(ambientPressure: number, rmv: number, injectionRatio: number): number`, `Rebreathers.mccrO2Rate(o2Flow: number, metabolicO2: number): number`, `Rebreathers.eccrO2Rate(metabolicO2: number, o2Loss: number): number`, `Rebreathers.diluentForDescent(loopVolume: number, startPressure: number, endPressure: number): number`. All rates are in surface-equivalent L/min and pressures in bar.

- [x] **Step 1: Write the failing test**

```ts
// ccr/Rebreathers.spec.ts
import { Rebreathers } from './Rebreathers';

describe('Rebreathers', () => {
    describe('pSCR supply rate', () => {
        it('scales with ambient pressure', () => {
            expect(Rebreathers.pscrSupplyRate(4, 20, 8)).toBeCloseTo(10, 6);
        });

        it('is lower at surface', () => {
            expect(Rebreathers.pscrSupplyRate(1, 20, 8)).toBeCloseTo(2.5, 6);
        });

        it('throws for not positive injection ratio', () => {
            expect(() => Rebreathers.pscrSupplyRate(1, 20, 0)).toThrowError('Injection ratio needs to be positive number.');
        });
    });

    describe('mCCR O2 rate', () => {
        it('uses metabolic rate when needle valve flow is lower', () => {
            expect(Rebreathers.mccrO2Rate(0.8, 1.0)).toBeCloseTo(1.0, 6);
        });

        it('uses needle valve flow when higher than metabolic rate', () => {
            expect(Rebreathers.mccrO2Rate(1.5, 1.0)).toBeCloseTo(1.5, 6);
        });
    });

    describe('eCCR O2 rate', () => {
        it('adds losses to metabolic rate', () => {
            expect(Rebreathers.eccrO2Rate(1.0, 0.1)).toBeCloseTo(1.1, 6);
        });
    });

    describe('Diluent for descent', () => {
        it('fills loop volume by pressure difference', () => {
            expect(Rebreathers.diluentForDescent(6, 1, 7)).toBeCloseTo(36, 6);
        });

        it('is zero for ascent', () => {
            expect(Rebreathers.diluentForDescent(6, 7, 1)).toBeCloseTo(0, 6);
        });
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/ccr/Rebreathers.spec.ts'`
Expected: compilation FAIL, `Cannot find module './Rebreathers'`.

- [x] **Step 3: Write the implementation and delete the POC file**

```ts
// ccr/Rebreathers.ts
/**
 * Generic rebreather formulas shared by all rebreather types.
 * All rates are surface equivalent liters per minute, pressures are absolute in bars.
 */
export class Rebreathers {
    /**
     * Fresh gas added to a passive semi-closed rebreather loop.
     * @param ambientPressure absolute pressure in bars
     * @param rmv diver respiratory minute volume in liters/minute
     * @param injectionRatio ratio of breathed to dumped volume, e.g. 8 means 1/8 of each breath is dumped
     */
    public static pscrSupplyRate(ambientPressure: number, rmv: number, injectionRatio: number): number {
        if (injectionRatio <= 0) {
            throw new Error('Injection ratio needs to be positive number.');
        }

        return rmv * ambientPressure / injectionRatio;
    }

    /**
     * Oxygen used by manual CCR. Diver adds manually the missing oxygen,
     * when the needle valve flow is lower than the metabolic consumption.
     */
    public static mccrO2Rate(o2Flow: number, metabolicO2: number): number {
        return Math.max(o2Flow, metabolicO2);
    }

    /**
     * Oxygen used by electronic CCR including losses (mask clearing, leaks).
     * @param o2Loss fraction 0-1 of the metabolic consumption lost
     */
    public static eccrO2Rate(metabolicO2: number, o2Loss: number): number {
        return metabolicO2 * (1 + o2Loss);
    }

    /**
     * Diluent added to keep the loop volume during descent.
     * @param loopVolume loop volume in liters
     * @param startPressure absolute pressure in bars at start of the segment
     * @param endPressure absolute pressure in bars at end of the segment
     */
    public static diluentForDescent(loopVolume: number, startPressure: number, endPressure: number): number {
        const difference = endPressure - startPressure;
        return difference > 0 ? loopVolume * difference : 0;
    }
}
```

Then delete `projects/scuba-physics/src/lib/ccr/ccrConsumption.ts`.

- [x] **Step 4: Run the test and confirm it passes**

Run the Step 2 command. Expected: 8 specs, 0 failures.

- [x] **Step 5: Commit**

```bash
git add projects/scuba-physics/src/lib/ccr/Rebreathers.ts projects/scuba-physics/src/lib/ccr/Rebreathers.spec.ts
git rm projects/scuba-physics/src/lib/ccr/ccrConsumption.ts
git commit -m "feat(scuba-physics): #26 generic rebreather formulas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: `CircuitType` and `RebreatherOptions` in `Options`
- [x] Status

**Files:**
- Create: `ccr/RebreatherOptions.ts`
- Create: `ccr/RebreatherOptions.spec.ts`
- Modify: `algorithm/Options.ts` (fields after `_airBreaks` L148, getter after L188-190, `loadFrom` L221)

**Interfaces:**
- Produces: `enum CircuitType { oc = 1, pscr = 2, mccr = 3, eccr = 4 }` (it starts at 1 because `Options.loadFrom` treats 0 as "missing", see `safetyStop`). `class RebreatherOptions { circuit: CircuitType; metabolicO2: number; loopVolume: number; loadFrom(source: RebreatherOptions): void }`. `RebreatherDefaults.metabolicO2 = 1.0`, `RebreatherDefaults.loopVolume = 6`. `Options.rebreather: RebreatherOptions` (getter).

- [x] **Step 1: Write the failing test**

```ts
// ccr/RebreatherOptions.spec.ts
import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { Options } from '../algorithm/Options';

describe('Rebreather options', () => {
    it('defaults to open circuit', () => {
        const sut = new RebreatherOptions();
        expect(sut.circuit).toBe(CircuitType.oc);
        expect(sut.metabolicO2).toBeCloseTo(1.0, 6);
        expect(sut.loopVolume).toBeCloseTo(6, 6);
    });

    it('loads all values', () => {
        const sut = new RebreatherOptions();
        const source = new RebreatherOptions(CircuitType.eccr, 1.5, 4);
        sut.loadFrom(source);
        expect(sut).toEqual(source);
    });

    it('options load rebreather values', () => {
        const sut = new Options();
        const source = new Options();
        source.rebreather.circuit = CircuitType.pscr;
        source.rebreather.metabolicO2 = 1.2;
        sut.loadFrom(source);
        expect(sut.rebreather.circuit).toBe(CircuitType.pscr);
        expect(sut.rebreather.metabolicO2).toBeCloseTo(1.2, 6);
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/ccr/RebreatherOptions.spec.ts'`
Expected: FAIL, `Cannot find module './RebreatherOptions'`.

- [x] **Step 3: Write the implementation**

```ts
// ccr/RebreatherOptions.ts
/** Breathing apparatus used during the dive. Values start from 1, because 0 is considered as not defined. */
export enum CircuitType {
    /** Open circuit */
    oc = 1,
    /** Passive semi-closed rebreather */
    pscr = 2,
    /** Manual closed circuit rebreather */
    mccr = 3,
    /** Electronic closed circuit rebreather */
    eccr = 4
}

export class RebreatherDefaults {
    /** Liters/minute surface equivalent */
    public static readonly metabolicO2 = 1.0;
    /** Liters */
    public static readonly loopVolume = 6;
}

/** Rebreather configuration, rebreather type specific values are added by each rebreather type. */
export class RebreatherOptions {
    constructor(
        public circuit: CircuitType = CircuitType.oc,
        /** Oxygen consumed by the diver in liters/minute surface equivalent, range 0.5-3 */
        public metabolicO2: number = RebreatherDefaults.metabolicO2,
        /** Breathing loop volume in liters */
        public loopVolume: number = RebreatherDefaults.loopVolume
    ) { }

    public loadFrom(source: RebreatherOptions): void {
        this.circuit = source.circuit || this.circuit;
        this.metabolicO2 = source.metabolicO2 || this.metabolicO2;
        this.loopVolume = source.loopVolume || this.loopVolume;
    }
}
```

In `algorithm/Options.ts`:
- add `import { RebreatherOptions } from '../ccr/RebreatherOptions';`
- after `private readonly _airBreaks = new AirBreakOptions();` add `private readonly _rebreather = new RebreatherOptions();`
- after the `airBreaks` getter add:

```ts
    public get rebreather(): RebreatherOptions {
        return this._rebreather;
    }
```

- at the end of `loadFrom`, after `this.airBreaks.loadFrom(other.airBreaks);`, add `this.rebreather.loadFrom(other.rebreather);`

- [x] **Step 4: Run the new spec and the existing Options spec**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/{ccr/RebreatherOptions,algorithm/Options}.spec.ts'`
Expected: all pass (the existing `expect(sut).toEqual(modified)` still passes because both sides have default rebreather options).

- [x] **Step 5: Commit**

```bash
git add projects/scuba-physics/src/lib/ccr/RebreatherOptions.ts projects/scuba-physics/src/lib/ccr/RebreatherOptions.spec.ts projects/scuba-physics/src/lib/algorithm/Options.ts
git commit -m "feat(scuba-physics): #26 rebreather options" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Loop gas fractions (`LoopGas.ts`)
- [x] Status

**Files:**
- Create: `ccr/LoopGas.ts`
- Create: `ccr/LoopGas.spec.ts`
- Delete: `ccr/ccrGases.ts`

**Interfaces:**
- Produces: `LoopGas.constantPpO2(ambientPressure: number, diluent: Gas, setPoint: number): Gas` and `LoopGas.pscrSteadyState(ambientPressure: number, supply: Gas, rmv: number, injectionRatio: number, metabolicO2: number): Gas`. Fractions are relative to **ambient** pressure, which is slightly conservative for tissue loading (more inert gas than the lung-pressure variant). The diluent/supply He:N2 ratio is preserved.

- [x] **Step 1: Write the failing test**

```ts
// ccr/LoopGas.spec.ts
import { LoopGas } from './LoopGas';
import { Gas } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';

describe('Loop gas', () => {
    describe('Constant ppO2', () => {
        it('air diluent at 30 m with setpoint 1.3', () => {
            const loop = LoopGas.constantPpO2(4, StandardGases.air, 1.3);
            expect(loop.fO2).toBeCloseTo(0.325, 6);
            expect(loop.fHe).toBeCloseTo(0, 6);
        });

        it('preserves diluent helium ratio', () => {
            const diluent = new Gas(0.18, 0.45);
            const loop = LoopGas.constantPpO2(7, diluent, 1.3);
            expect(loop.fO2).toBeCloseTo(0.185714, 5);
            expect(loop.fHe).toBeCloseTo(0.446864, 5);
            expect(loop.fHe / loop.fN2).toBeCloseTo(0.45 / 0.37, 5);
        });

        it('uses diluent, when diluent ppO2 is higher than setpoint', () => {
            const diluent = new Gas(0.18, 0.45);
            const loop = LoopGas.constantPpO2(9, diluent, 1.3);
            expect(loop.fO2).toBeCloseTo(0.18, 6);
            expect(loop.fHe).toBeCloseTo(0.45, 6);
        });

        it('clamps to pure oxygen at shallow depth', () => {
            const loop = LoopGas.constantPpO2(1, StandardGases.air, 1.3);
            expect(loop.fO2).toBeCloseTo(1, 6);
            expect(loop.fHe).toBeCloseTo(0, 6);
        });

        it('never exceeds 100 % for hypoxic trimix diluent', () => {
            const diluent = new Gas(0.1, 0.7);
            expect(() => LoopGas.constantPpO2(13, diluent, 1.3)).not.toThrow();
        });
    });

    describe('pSCR steady state', () => {
        it('EAN32 at 30 m', () => {
            const loop = LoopGas.pscrSteadyState(4, StandardGases.ean32, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0.244444, 5);
        });

        it('is richer deeper', () => {
            const loop = LoopGas.pscrSteadyState(7, StandardGases.ean32, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0.278788, 5);
        });

        it('hypoxic at surface', () => {
            const loop = LoopGas.pscrSteadyState(1, StandardGases.ean32, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0, 6);
        });

        it('supply equal to metabolic consumption', () => {
            const loop = LoopGas.pscrSteadyState(1, StandardGases.ean32, 8, 8, 1);
            expect(loop.fO2).toBeCloseTo(0, 6);
        });

        it('preserves supply helium ratio', () => {
            const supply = new Gas(0.35, 0.25);
            const loop = LoopGas.pscrSteadyState(4, supply, 20, 8, 1);
            expect(loop.fO2).toBeCloseTo(0.277778, 5);
            expect(loop.fHe).toBeCloseTo(0.277778, 5);
        });
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/ccr/LoopGas.spec.ts'`
Expected: FAIL, `Cannot find module './LoopGas'`.

- [x] **Step 3: Write the implementation and delete the POC file**

```ts
// ccr/LoopGas.ts
import { Gas } from '../gases/Gases';
import { Rebreathers } from './Rebreathers';

/**
 * Calculates content of the rebreather breathing loop.
 * Fractions are relative to ambient pressure, inert gases keep the diluent (supply) helium/nitrogen ratio.
 */
export class LoopGas {
    /**
     * Loop held at constant oxygen partial pressure (eCCR, mCCR).
     * The ppO2 can't be lower than diluent ppO2 (diluent flush) and higher than ambient pressure (pure oxygen).
     * @param ambientPressure absolute pressure in bars
     * @param diluent diluent gas
     * @param setPoint required oxygen partial pressure in bars
     */
    public static constantPpO2(ambientPressure: number, diluent: Gas, setPoint: number): Gas {
        const diluentPpO2 = diluent.fO2 * ambientPressure;
        const ppO2 = Math.min(Math.max(setPoint, diluentPpO2), ambientPressure);
        const fO2 = ppO2 / ambientPressure;
        return LoopGas.withInertRatio(fO2, diluent);
    }

    /**
     * Steady state of passive semi-closed rebreather.
     * fO2 = (fO2 supply * V - VO2) / (V - VO2), where V is supply rate.
     * @param ambientPressure absolute pressure in bars
     * @param supply supply gas
     * @param rmv diver respiratory minute volume in liters/minute
     * @param injectionRatio ratio of breathed to dumped volume
     * @param metabolicO2 oxygen consumed by the diver in liters/minute
     */
    public static pscrSteadyState(ambientPressure: number, supply: Gas, rmv: number, injectionRatio: number, metabolicO2: number): Gas {
        const supplyRate = Rebreathers.pscrSupplyRate(ambientPressure, rmv, injectionRatio);
        const remaining = supplyRate - metabolicO2;
        let fO2 = remaining > 0 ? (supply.fO2 * supplyRate - metabolicO2) / remaining : 0;
        fO2 = Math.min(Math.max(fO2, 0), supply.fO2);
        return LoopGas.withInertRatio(fO2, supply);
    }

    private static withInertRatio(fO2: number, source: Gas): Gas {
        const sourceInert = 1 - source.fO2;
        const inert = 1 - fO2;
        const fHe = sourceInert > 0 ? inert * source.fHe / sourceInert : 0;
        // prevent rounding errors exceeding 100 %
        return new Gas(fO2, Math.min(fHe, 1 - fO2));
    }
}
```

Then delete `projects/scuba-physics/src/lib/ccr/ccrGases.ts`.

- [x] **Step 4: Run the test and confirm it passes**

Run the Step 2 command. Expected: 10 specs, 0 failures.

- [x] **Step 5: Commit**

```bash
git add projects/scuba-physics/src/lib/ccr/LoopGas.ts projects/scuba-physics/src/lib/ccr/LoopGas.spec.ts
git rm projects/scuba-physics/src/lib/ccr/ccrGases.ts
git commit -m "feat(scuba-physics): #26 rebreather loop gas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: `BreathingModel` and `OpenCircuitBreathing`
- [x] Status

**Files:**
- Create: `ccr/BreathingModel.ts`
- Create: `ccr/BreathingModel.spec.ts`

**Interfaces:**
- Produces:

```ts
export interface BreathingModel {
    /** True, if the algorithm may switch to better deco gas during ascent */
    readonly usesGasSwitching: boolean;
    /** True, if air breaks may be applied when breathing oxygen */
    readonly usesAirBreaks: boolean;
    /** Gas really breathed by the diver at depth (meters), when the source gas (tank/diluent) is assigned */
    inspiredGas(sourceGas: Gas, depth: number, isAscent: boolean): Gas;
    /** Oxygen partial pressure in bars breathed at depth (meters) */
    ppO2(sourceGas: Gas, depth: number, isAscent: boolean): number;
    /** Liters consumed from the segment source tank, rmvPerSecond in liters/second */
    consumedLiters(segment: Segment, rmvPerSecond: number): number;
}
```

  `new OpenCircuitBreathing(depthConverter: DepthConverter)`, which is also used for every emergency (bailout) ascent. No test doubles: every Stage 1 spec uses `OpenCircuitBreathing` passed explicitly, and checks that it gives the same results as passing no model.

- [x] **Step 1: Write the failing test**

```ts
// ccr/BreathingModel.spec.ts
import { OpenCircuitBreathing } from './BreathingModel';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';

describe('Breathing model', () => {
    const depthConverter = DepthConverter.simple();

    describe('Open circuit', () => {
        const sut = new OpenCircuitBreathing(depthConverter);

        it('breathes the source gas', () => {
            const gas = StandardGases.ean32.copy();
            expect(sut.inspiredGas(gas, 30, false)).toBe(gas);
            expect(sut.inspiredGas(gas, 30, true)).toBe(gas);
        });

        it('ppO2 does not depend on ascent', () => {
            expect(sut.ppO2(StandardGases.ean32, 30, true)).toBeCloseTo(sut.ppO2(StandardGases.ean32, 30, false), 6);
        });

        it('ppO2 by depth', () => {
            expect(sut.ppO2(StandardGases.ean32, 30, false)).toBeCloseTo(1.28, 6);
        });

        it('consumes rmv at depth', () => {
            const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute);
            const rmvPerSecond = Time.toMinutes(20);
            expect(sut.consumedLiters(segment, rmvPerSecond)).toBeCloseTo(80, 6);
        });

        it('allows gas switching and air breaks', () => {
            expect(sut.usesGasSwitching).toBeTrue();
            expect(sut.usesAirBreaks).toBeTrue();
        });
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/ccr/BreathingModel.spec.ts'`
Expected: FAIL, `Cannot find module './BreathingModel'`.

- [x] **Step 3: Write the implementation**

```ts
// ccr/BreathingModel.ts
import { Gas } from '../gases/Gases';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Precision } from '../common/precision';

/**
 * Defines what the diver really breathes from the assigned gas source (tank or diluent).
 * Allows the algorithm, toxicity and consumption to work the same way for open circuit and rebreathers.
 */
export interface BreathingModel {
    /** True, if the algorithm may switch to better deco gas during ascent */
    readonly usesGasSwitching: boolean;
    /** True, if air breaks may be applied when breathing oxygen */
    readonly usesAirBreaks: boolean;
    /**
     * Gas really breathed by the diver.
     * @param sourceGas gas assigned to the segment (tank gas, diluent or supply gas)
     * @param depth in meters
     * @param isAscent true, if the segment is part of the calculated ascent
     */
    inspiredGas(sourceGas: Gas, depth: number, isAscent: boolean): Gas;
    /**
     * Oxygen partial pressure in bars breathed by the diver.
     * @param sourceGas gas assigned to the segment
     * @param depth in meters
     * @param isAscent true, if the segment is part of the calculated ascent
     */
    ppO2(sourceGas: Gas, depth: number, isAscent: boolean): number;
    /**
     * Liters consumed from the segment source tank.
     * @param rmvPerSecond liters/second
     */
    consumedLiters(segment: Segment, rmvPerSecond: number): number;
}

/** Diver breathes directly from the tank. */
export class OpenCircuitBreathing implements BreathingModel {
    public readonly usesGasSwitching = true;
    public readonly usesAirBreaks = true;

    constructor(private depthConverter: DepthConverter) { }

    public inspiredGas(sourceGas: Gas): Gas {
        return sourceGas;
    }

    public ppO2(sourceGas: Gas, depth: number): number {
        return sourceGas.fO2 * this.depthConverter.toBar(depth);
    }

    public consumedLiters(segment: Segment, rmvPerSecond: number): number {
        const averagePressure = this.depthConverter.toBar(segment.averageDepth);
        const duration = Precision.roundTwoDecimals(segment.duration);
        const consumed = duration * averagePressure * rmvPerSecond;
        return consumed;
    }
}
```

The `OpenCircuitBreathing.consumedLiters` body is copied verbatim from `SegmentsConsumption.consumedBySegment` (`consumption/consumptionCommon.ts:125-130`). Keep it identical; Task 7 makes that method delegate here.

- [x] **Step 4: Run the test and confirm it passes**

Run the Step 2 command. Expected: 5 specs, 0 failures.

- [x] **Step 5: Commit**

```bash
git add projects/scuba-physics/src/lib/ccr/BreathingModel.ts projects/scuba-physics/src/lib/ccr/BreathingModel.spec.ts
git commit -m "feat(scuba-physics): #26 breathing model abstraction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Inject the breathing model into the Bühlmann algorithm
- [x] Status

**Files:**
- Modify: `algorithm/BuhlmannAlgorithmParameters.ts` (class `AlgorithmParams` L52-121)
- Modify: `algorithm/AlgorithmContext.ts` (constructor L45-67, creators L69-98, `shouldAddAirBreaks` L125-127, new members)
- Modify: `algorithm/BuhlmannAlgorithm.ts` (L25-28, L36-41, L95-139, L152-187, L189-197, L328-333, L357-367)
- Create: `algorithm/BuhlmannAlgorithm.breathing.spec.ts`

**Interfaces:**
- Consumes: `BreathingModel`, `OpenCircuitBreathing` (Task 4).
- Note: the `usesGasSwitching = false` / `usesAirBreaks = false` branches and a loop gas that differs from the source gas can't be exercised with open circuit only. They are covered by the Stage 2 (`PscrBreathing`) and Stage 3 (`MccrBreathing`) algorithm specs.
- Produces:
  - `AlgorithmParams.forSimpleDive(depth, gas, options, surface?, breathing?: BreathingModel)` and `AlgorithmParams.forMultilevelDive(segments, gases, options, surface?, breathing?: BreathingModel)`. Getter `AlgorithmParams.breathing: BreathingModel | undefined`. Undefined means open circuit.
  - `AlgorithmContext.isAscent: boolean`, `AlgorithmContext.inspiredGas(segment: Segment): Gas`, `AlgorithmContext.usesGasSwitching: boolean`.

- [x] **Step 1: Write the failing test**

```ts
// algorithm/BuhlmannAlgorithm.breathing.spec.ts
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.spec';
import { Options } from './Options';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Gas, Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';

describe('Buhlmann Algorithm - Breathing model', () => {
    const algorithm = new BuhlmannAlgorithm();
    let options: Options;

    beforeEach(() => {
        options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    });

    const createParams = (depth: number, minutes: number, gases: Gas[], breathing?: BreathingModel): AlgorithmParams => {
        const segments = new Segments();
        segments.add(depth, gases[0], Time.oneMinute * 2);
        segments.addFlat(gases[0], Time.oneMinute * (minutes - 2));
        const available = new Gases();
        gases.forEach(g => available.add(g));
        return AlgorithmParams.forMultilevelDive(segments, available, options, undefined, breathing);
    };

    const planDuration = (depth: number, minutes: number, gases: Gas[], breathing?: BreathingModel): number => {
        const profile = algorithm.decompression(createParams(depth, minutes, gases, breathing));
        return Segments.duration(profile.segments);
    };

    const openCircuit = (): OpenCircuitBreathing => new OpenCircuitBreathing(new DepthConverterFactory(options).create());

    it('explicit open circuit gives same profile as without model', () => {
        const gases = [StandardGases.air];
        expect(planDuration(30, 25, gases, openCircuit())).toBe(planDuration(30, 25, gases));
    });

    it('explicit open circuit switches deco gases the same way', () => {
        const gases = [StandardGases.air, StandardGases.ean50];
        const withModel = algorithm.decompression(createParams(40, 30, gases, openCircuit())).segments;
        const withoutModel = algorithm.decompression(createParams(40, 30, gases)).segments;
        expect(withModel.length).toBe(withoutModel.length);
        withModel.forEach((segment, index) => {
            expect(segment.gas.compositionEquals(withoutModel[index].gas)).toBeTrue();
            expect(segment.duration).toBe(withoutModel[index].duration);
        });
    });

    it('explicit open circuit applies air breaks the same way', () => {
        const gases = [new Gas(0.18, 0.45), StandardGases.ean50, StandardGases.oxygen];
        options.airBreaks.enabled = true;
        expect(planDuration(60, 40, gases, openCircuit())).toBe(planDuration(60, 40, gases));
    });

    it('explicit open circuit gives same no decompression limit', () => {
        const withModel = algorithm.noDecoLimit(AlgorithmParams.forSimpleDive(30, StandardGases.air, options, undefined, openCircuit()));
        const withoutModel = algorithm.noDecoLimit(AlgorithmParams.forSimpleDive(30, StandardGases.air, options));
        expect(withModel).toBe(withoutModel);
    });

    it('explicit open circuit gives same statistics', () => {
        const gases = [StandardGases.air];
        const withModel = algorithm.decompressionStatistics(createParams(40, 20, gases, openCircuit()));
        const withoutModel = algorithm.decompressionStatistics(createParams(40, 20, gases));
        expect(withModel.ceilings).toEqual(withoutModel.ceilings);
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/algorithm/BuhlmannAlgorithm.breathing.spec.ts'`
Expected: compilation FAIL, `Expected 3-4 arguments, but got 5` on `forMultilevelDive`/`forSimpleDive`.

- [x] **Step 3: Extend `AlgorithmParams`**

In `algorithm/BuhlmannAlgorithmParameters.ts` add `import { BreathingModel } from '../ccr/BreathingModel';` and change the class to:

```ts
    private constructor(
        private _segments: Segments,
        private _gases: Gases,
        private _options: Options,
        /** If no valid tissues are provided from previous dive,
         * then first dive default tissues are created, ignoring surface interval.
         **/
        surface?: RestingParameters,
        private _breathing?: BreathingModel
    ) {
        this._surface = this.resolveSurfaceParameters(surface);
    }

    /** Breathing model used during the dive, undefined for open circuit */
    public get breathing(): BreathingModel | undefined {
        return this._breathing;
    }
```

Add a trailing `breathing?: BreathingModel` parameter to both factories (document it as `@param breathing Optional breathing model, open circuit if not provided.`) and pass it through: `return new AlgorithmParams(segments, gases, options, surface, breathing);`.

- [x] **Step 4: Extend `AlgorithmContext`**

In `algorithm/AlgorithmContext.ts`:
- `import { BreathingModel } from '../ccr/BreathingModel';`
- add a public field under `runTime`:

```ts
    /** True after user defined segments were swum, i.e. the algorithm generates the ascent */
    public isAscent = false;
```

- constructor: add parameter `public readonly breathing: BreathingModel,` right after `public depthConverter: DepthConverter,`.
- `createWithoutStatistics`, `createForCeilings`, `createForFullStatistics`: add a parameter `breathing: BreathingModel` after `depthConverter: DepthConverter` and pass it to `new AlgorithmContext(gases, segments, options, depthConverter, breathing, currentTissues)`.
- add:

```ts
    public get usesGasSwitching(): boolean {
        return this.breathing.usesGasSwitching;
    }

    /** Gas loaded into tissues for the segment */
    public inspiredGas(segment: Segment): Gas {
        return this.breathing.inspiredGas(segment.gas, segment.startDepth, this.isAscent);
    }
```

- replace the `shouldAddAirBreaks` body with:

```ts
        return this.breathing.usesAirBreaks && this.isBreathingOxygen && this.options.airBreaks.enabled;
```

- [x] **Step 5: Use the model in `BuhlmannAlgorithm`**

In `algorithm/BuhlmannAlgorithm.ts`:
- `import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';`
- `CreateAlgorithmContext` type: add `breathing: BreathingModel` after `depthConverter: DepthConverter`.
- add a private helper:

```ts
    private breathingFor(algorithmParams: AlgorithmParams, depthConverter: DepthConverter): BreathingModel {
        return algorithmParams.breathing ?? new OpenCircuitBreathing(depthConverter);
    }
```

- `noDecoLimit`:

```ts
    public noDecoLimit(algorithmParams: AlgorithmParams): number {
        const { segments, gases, options, surfaceInterval } = algorithmParams;
        const depthConverter = new DepthConverterFactory(options).create();
        const breathing = this.breathingFor(algorithmParams, depthConverter);
        const rested = this.applySurfaceInterval(surfaceInterval);
        const context = AlgorithmContext.createForCeilings(gases, segments, options, depthConverter, breathing, rested.finalTissues);
        return this.swimNoDecoLimit(segments, gases, context);
    }
```

- `decompressionStatistics`: after `depthConverter` add `const breathing = this.breathingFor(algorithmParams, depthConverter);` and pass `breathing` to `createForFullStatistics(gases, newSegments, options, depthConverter, breathing, rested.finalTissues)`.
- `decompression`: same for `createWithoutStatistics`. After `context.markAverageDepth();` add `context.isAscent = true;`.
- `applySurfaceIntervalInternal`: after `const depthConverter = ...` add `const breathing = new OpenCircuitBreathing(depthConverter); // at surface always breathing air` and call `createContext(gases, segments, options, depthConverter, breathing, previousTissues)`.
- `tryGasSwitch`: insert at the beginning:

```ts
        if (!context.usesGasSwitching) {
            return;
        }
```

- `swimPart`: replace `context.loadTissues(loadSegment, segment.gas);` with `context.loadTissues(loadSegment, context.inspiredGas(segment));`
- `predictNoDecoLimit`: after `const hoverLoad = ...` add `const gas = context.inspiredGas(hover);` and change the loop line to `change = context.loadTissues(hoverLoad, gas);`

- [x] **Step 6: Run the new spec and the whole algorithm folder**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/algorithm/*.spec.ts'`
Expected: all pass, including all pre-existing algorithm specs (OC identity).

- [x] **Step 7: Commit**

```bash
git add projects/scuba-physics/src/lib/algorithm
git commit -m "refactor(scuba-physics): #26 inject breathing model into algorithm" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Inject the breathing model into consumption (emergency ascent stays open circuit)
- [x] Status

**Files:**
- Modify: `consumption/consumptionCommon.ts` (`SegmentsConsumption` L86-131)
- Modify: `consumption/consumption.ts` (L26-40, L53-97, L140-144, L153-158)
- Create: `consumption/consumption.breathing.spec.ts`

**Interfaces:**
- Consumes: `BreathingModel`, `OpenCircuitBreathing` (Task 4); `AlgorithmParams.forMultilevelDive(..., breathing?)` (Task 5). `PlanFactory.emergencyAscent` is **not** changed: it calls the algorithm without a breathing model, so the emergency (bailout) ascent is always `OpenCircuitBreathing` on the tank gases.
- Produces: `new SegmentsConsumption(depthConverter: DepthConverter, breathing?: BreathingModel)` and `new Consumption(depthConverter: DepthConverter, breathing?: BreathingModel)`. Plan segments are consumed via `breathing.consumedLiters`. The reserve (emergency ascent) is always consumed as open circuit.

- [x] **Step 1: Write the failing test**

```ts
// consumption/consumption.breathing.spec.ts
import { Consumption } from './consumption';
import { ConsumptionOptions } from './consumptionCommon';
import { Diver } from './Diver';
import { Tank, Tanks } from './Tanks';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { OptionExtensions } from '../algorithm/Options.spec';
import { PlanFactory } from '../depths/PlanFactory';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { Time } from '../physics/Time';

describe('Consumption - Breathing model', () => {
    const depthConverter = DepthConverter.simple();
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };

    const createProfile = (tank: Tank): Segment[] => {
        const plan = PlanFactory.createPlan(30, 20, tank, options);
        const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases([tank]), options);
        return new BuhlmannAlgorithm().decompression(parameters).segments;
    };

    it('consumes plan segments by breathing model liters', () => {
        const tank = new Tank(15, 200, 21);
        const profile = createProfile(tank);
        const emergencyAscent = PlanFactory.emergencyAscent(profile, options, [tank]);
        const model = new OpenCircuitBreathing(depthConverter);
        const rmvPerSecond = Time.toMinutes(consumptionOptions.diver.rmv);
        const expected = profile.reduce((sum, segment) => sum + model.consumedLiters(segment, rmvPerSecond), 0);

        new Consumption(depthConverter, model).consumeFromTanks2(profile, emergencyAscent, [tank], consumptionOptions);

        expect(tank.consumedVolume).toBeCloseTo(expected, 6);
    });

    it('explicit open circuit consumes the same as without model', () => {
        const defaultTank = new Tank(15, 200, 21);
        const modelTank = new Tank(15, 200, 21);
        const profile = createProfile(defaultTank);
        const model = new OpenCircuitBreathing(depthConverter);

        new Consumption(depthConverter).consumeFromTanks(profile, options, [defaultTank], consumptionOptions);
        new Consumption(depthConverter, model).consumeFromTanks(profile, options, [modelTank], consumptionOptions);

        expect(modelTank.consumedVolume).toBeCloseTo(defaultTank.consumedVolume, 6);
        expect(modelTank.reserveVolume).toBeCloseTo(defaultTank.reserveVolume, 6);
    });

    it('explicit open circuit gives the same maximum bottom time', () => {
        const plan = PlanFactory.createPlan(30, 20, new Tank(15, 200, 21), options);
        const defaultTime = new Consumption(depthConverter)
            .calculateMaxBottomTime(plan, [new Tank(15, 200, 21)], consumptionOptions, options);
        const modelTime = new Consumption(depthConverter, new OpenCircuitBreathing(depthConverter))
            .calculateMaxBottomTime(plan, [new Tank(15, 200, 21)], consumptionOptions, options);
        expect(modelTime).toBe(defaultTime);
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/consumption/consumption.breathing.spec.ts'`
Expected: compilation FAIL, `Expected 1 arguments, but got 2` on `new Consumption(...)`.

- [x] **Step 3: `SegmentsConsumption` delegates to the model**

In `consumption/consumptionCommon.ts` add `import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';`, remove the now unused `Precision` import, and replace the constructor and `consumedBySegment`:

```ts
export class SegmentsConsumption {
    private readonly breathing: BreathingModel;

    constructor(depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }
```

```ts
    /**
     * Returns consumption in Liters of the segment source tank
     * @param rmvPerSecond Liter/second
     */
    public consumedBySegment(segment: Segment, rmvPerSecond: number): number {
        return this.breathing.consumedLiters(segment, rmvPerSecond);
    }
```

- [x] **Step 4: `Consumption` uses plan and reserve calculators**

In `consumption/consumption.ts` add `import { BreathingModel } from '../ccr/BreathingModel';` and replace the field and constructor:

```ts
    /** Emergency ascent is always breathed as open circuit */
    private reserveConsumption: SegmentsConsumption;
    private planConsumption: SegmentsConsumption;

    /**
     * @param breathing Optional breathing model of the dive, open circuit if not provided.
     */
    constructor(depthConverter: DepthConverter, private readonly breathing?: BreathingModel) {
        this.reserveConsumption = new SegmentsConsumption(depthConverter);
        this.planConsumption = new SegmentsConsumption(depthConverter, breathing);
    }
```

- `calculateDecompression`: add the trailing parameter `breathing?: BreathingModel` and pass it: `AlgorithmParams.forMultilevelDive(segmentsCopy, gases, options, surfaceInterval, breathing)`.
- `consumeFromProfile`: call `Consumption.calculateDecompression(testSegments, tanks, options, surfaceInterval, this.breathing)`.
- `consumeFromTanks`: leave `PlanFactory.emergencyAscent(segments, options, tanks, surfaceInterval)` unchanged. Add a comment: `// emergency (bailout) ascent is always open circuit`.
- `consumeFromTanks2`: replace `this.segmentsConsumption` with `this.planConsumption` in the three plan lines (`consumedBySegmentRmv` and both `toBeConsumedYet` calls).
- `updateReserve`: replace `this.segmentsConsumption` with `this.reserveConsumption`.

- [x] **Step 5: Run the new spec and all consumption specs**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/consumption/*.spec.ts'`
Expected: all pass (existing specs prove the OC identity).

- [x] **Step 6: Commit**

```bash
git add projects/scuba-physics/src/lib/consumption
git commit -m "refactor(scuba-physics): #26 inject breathing model into consumption" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: Toxicity by the breathing model (CNS, OTU, daily CNS)
- [x] Status

**Files:**
- Modify: `calculators/cnsCalculator.ts`, `calculators/OtuCalculator.ts`, `calculators/cnsDailyCalculator.ts`
- Create: `calculators/toxicity.breathing.spec.ts`

**Interfaces:**
- Consumes: `BreathingModel`, `OpenCircuitBreathing`.
- Produces:
  - `new CnsCalculator(depthConverter, breathing?)`, `CnsCalculator.calculateForProfile(profile: Segment[], startAscentIndex = Number.POSITIVE_INFINITY)`, `CnsCalculator.calculateForRepetitiveDive(profile, previousCns, surfaceInterval, startAscentIndex = Number.POSITIVE_INFINITY)`, `CnsCalculator.calculateByPpO2(ppO2: number, duration: number): number`.
  - `new OtuCalculator(depthConverter, breathing?)`, `OtuCalculator.calculateForProfile(profile, startAscentIndex = Number.POSITIVE_INFINITY)`, `OtuCalculator.calculateByPpO2(duration: number, pO2Start: number, pO2End: number): number`.
  - `new CnsDailyCalculator(depthConverter, breathing?)`, `CnsDailyCalculator.exposuresForProfile(profile, startAscentIndex = Number.POSITIVE_INFINITY)`, `CnsDailyCalculator.calculateByPpO2(ppO2: number, duration: number): number`, `CnsDive.startAscentIndex?: number`.
  - Segments with index ≥ `startAscentIndex` are evaluated with `isAscent = true`.

- [x] **Step 1: Write the failing test**

```ts
// calculators/toxicity.breathing.spec.ts
import { CnsCalculator } from './cnsCalculator';
import { OtuCalculator } from './OtuCalculator';
import { CnsDailyCalculator } from './cnsDailyCalculator';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';

describe('Toxicity - Breathing model', () => {
    const depthConverter = DepthConverter.simple();
    const openCircuit = new OpenCircuitBreathing(depthConverter);
    // EAN32: bottom ppO2 1.28 at 30 m, ascent average 15 m => ppO2 0.8
    const profile = [
        new Segment(30, 30, StandardGases.ean32, Time.oneMinute * 20),
        new Segment(30, 0, StandardGases.ean32, Time.oneMinute * 10)
    ];

    it('CNS uses breathed ppO2', () => {
        const sut = new CnsCalculator(depthConverter, openCircuit);
        const expected = sut.calculateByPpO2(1.28, Time.oneMinute * 20) + sut.calculateByPpO2(0.8, Time.oneMinute * 10);
        expect(sut.calculateForProfile(profile, 1)).toBeCloseTo(expected, 6);
    });

    it('CNS with explicit open circuit equals CNS without model', () => {
        const withModel = new CnsCalculator(depthConverter, openCircuit).calculateForProfile(profile, 1);
        const withoutModel = new CnsCalculator(depthConverter).calculateForProfile(profile);
        expect(withModel).toBeCloseTo(withoutModel, 10);
    });

    it('CNS by ppO2 equals CNS by fO2 for open circuit', () => {
        const sut = new CnsCalculator(depthConverter);
        expect(sut.calculateByPpO2(1.28, 600)).toBeCloseTo(sut.calculate(0.32, 30, 30, 600), 6);
    });

    it('OTU uses breathed ppO2', () => {
        const sut = new OtuCalculator(depthConverter, openCircuit);
        const expected = sut.calculateByPpO2(Time.oneMinute * 20, 1.28, 1.28) + sut.calculateByPpO2(Time.oneMinute * 10, 1.28, 0.32);
        expect(sut.calculateForProfile(profile, 1)).toBeCloseTo(expected, 6);
    });

    it('OTU by ppO2 equals OTU by fO2 for open circuit', () => {
        const sut = new OtuCalculator(depthConverter);
        expect(sut.calculateByPpO2(600, 1.28, 0.64)).toBeCloseTo(sut.calculate(600, 0.32, 30, 10), 6);
    });

    it('Daily CNS uses breathed ppO2', () => {
        const sut = new CnsDailyCalculator(depthConverter, openCircuit);
        const exposures = sut.exposuresForProfile(profile, 1);
        expect(exposures[0].cns).toBeCloseTo(sut.calculateByPpO2(1.28, Time.oneMinute * 20), 6);
        expect(exposures[1].cns).toBeCloseTo(sut.calculateByPpO2(0.8, Time.oneMinute * 10), 6);
    });

    it('Daily CNS with explicit open circuit equals daily CNS without model', () => {
        const withModel = new CnsDailyCalculator(depthConverter, openCircuit).exposuresForProfile(profile, 1);
        const withoutModel = new CnsDailyCalculator(depthConverter).exposuresForProfile(profile);
        expect(withModel).toEqual(withoutModel);
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/calculators/toxicity.breathing.spec.ts'`
Expected: compilation FAIL, `Expected 1 arguments, but got 2`.

- [x] **Step 3: `CnsCalculator`**

Add `import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';` and change it as follows. Keep `halfTime`, `limit`, `residual` and `exponentByPpO2` as they are.

```ts
    private readonly minimumPpO2 = 0.5;
    private readonly breathing: BreathingModel;

    constructor(private depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }

    /**
     * Calculates total CNS % for provided profile
     * @param startAscentIndex index of first segment of calculated ascent, Infinity if not known
     */
    public calculateForProfile(profile: Segment[], startAscentIndex: number = Number.POSITIVE_INFINITY): number {
        let total = 0;

        profile.forEach((segment, index) => {
            const avgDepth = (segment.startDepth + segment.endDepth) / 2;
            const ppO2 = this.breathing.ppO2(segment.gas, avgDepth, index >= startAscentIndex);
            total += this.calculateByPpO2(ppO2, segment.duration);
        });

        return total;
    }

    public calculateForRepetitiveDive(profile: Segment[], previousCns: number, surfaceInterval: number,
        startAscentIndex: number = Number.POSITIVE_INFINITY): number {
        const residual = CnsCalculator.residual(previousCns, surfaceInterval);
        return residual + this.calculateForProfile(profile, startAscentIndex);
    }

    public calculate(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        const avgDepth = (startDepth + endDepth) / 2;
        const aap = this.depthConverter.toBar(avgDepth);
        const ppO2 = fO2 * aap;
        return this.calculateByPpO2(ppO2, duration);
    }

    /**
     * Calculates CNS in % for constant oxygen partial pressure
     * @param ppO2 oxygen partial pressure in bars
     * @param duration duration in seconds
     */
    public calculateByPpO2(ppO2: number, duration: number): number {
        if(ppO2 <= this.minimumPpO2) {
            return 0;
        }

        // https://thetheoreticaldiver.org/wordpress/index.php/2019/08/15/calculating-oxygen-cns-toxicity/
        const exponent = this.exponentByPpO2(ppO2);
        const rate =  Math.exp(exponent);
        const cns = duration * rate;
        return cns * 100;
    }
```

Keep the existing JSDoc on `calculateForRepetitiveDive` and `calculate`, and add `@param startAscentIndex` where it is new.

- [x] **Step 4: `OtuCalculator`**

Add the same import and change:

```ts
    private readonly minPressure = 0.5;
    private readonly breathing: BreathingModel;

    constructor(private depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }

    /**
     * Calculates total OTU units for provided profile
     * @param startAscentIndex index of first segment of calculated ascent, Infinity if not known
     */
    public calculateForProfile(profile: Segment[], startAscentIndex: number = Number.POSITIVE_INFINITY): number {
        let total = 0;

        profile.forEach((segment, index) => {
            const isAscent = index >= startAscentIndex;
            const pO2Start = this.breathing.ppO2(segment.gas, segment.startDepth, isAscent);
            const pO2End = this.breathing.ppO2(segment.gas, segment.endDepth, isAscent);
            total += this.calculateByPpO2(segment.duration, pO2Start, pO2End);
        });

        return total;
    }

    public calculate(duration: number, pO2: number, startDepth: number, endDepth: number): number {
        const startAAP = this.depthConverter.toBar(startDepth);
        const endAAP = this.depthConverter.toBar(endDepth);
        return this.calculateByPpO2(duration, startAAP * pO2, endAAP * pO2);
    }

    /**
     * Ascent or descent profile at a constant rate of oxygen partial pressure change
     * @param duration - time in seconds
     * @param pO2Start - oxygen partial pressure in bars at start of the segment
     * @param pO2End - oxygen partial pressure in bars at end of the segment
     */
    public calculateByPpO2(duration: number, pO2Start: number, pO2End: number): number {
        let durationMinutes = Time.toMinutes(duration);

        if ((pO2Start <= this.minPressure) && (pO2End <= this.minPressure)) {
            return 0;
        }
        // ... rest of the current `calculate` body from "// only part of the segment bellow limit" to the return, unchanged
    }
```

`pO2Start`/`pO2End` are reassigned inside the moved body, so declare them as parameters and reassign them as today (no `const`).

- [x] **Step 5: `CnsDailyCalculator`**

Add the same import. Add `startAscentIndex?: number;` (doc: `/** Index of first segment of calculated ascent, Infinity if not known */`) to `CnsDive`, then change:

```ts
    private readonly singleExposure: CnsCalculator;
    private readonly breathing: BreathingModel;

    constructor(private depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
        this.singleExposure = new CnsCalculator(depthConverter, this.breathing);
    }
```

In `calculateForDives` use `this.exposuresForProfile(dive.profile, dive.startAscentIndex)`.

```ts
    /** Creates exposure for each segment of the profile */
    public exposuresForProfile(profile: Segment[], startAscentIndex: number = Number.POSITIVE_INFINITY): CnsExposure[] {
        return profile.map((segment, index) => {
            const avgDepth = (segment.startDepth + segment.endDepth) / 2;
            const ppO2 = this.breathing.ppO2(segment.gas, avgDepth, index >= startAscentIndex);
            return {
                duration: segment.duration,
                cns: this.calculateByPpO2(ppO2, segment.duration)
            };
        });
    }

    public calculate(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        const avgDepth = (startDepth + endDepth) / 2;
        const ppO2 = fO2 * this.depthConverter.toBar(avgDepth);
        return this.calculateByPpO2(ppO2, duration);
    }

    /**
     * Calculates part of the daily CNS limit in % for constant oxygen partial pressure
     * @param ppO2 oxygen partial pressure in bars
     * @param duration duration in seconds
     */
    public calculateByPpO2(ppO2: number, duration: number): number {
        if (ppO2 <= CnsDailyCalculator.minimumPpO2) {
            return 0;
        }

        // NOAA doesn't define daily limit above 1.6 bar, the single exposure limit is more conservative
        if (ppO2 > CnsDailyCalculator.maximumPpO2) {
            return this.singleExposure.calculateByPpO2(ppO2, duration);
        }

        const limit = Time.toSeconds(CnsDailyCalculator.limitByPpO2(ppO2));
        return duration / limit * 100;
    }
```

- [x] **Step 6: Run the new spec and all calculator specs**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/calculators/*.spec.ts'`
Expected: all pass (existing CNS/OTU/daily specs prove the OC identity).

- [x] **Step 7: Commit**

```bash
git add projects/scuba-physics/src/lib/calculators
git commit -m "refactor(scuba-physics): #26 oxygen toxicity by breathing model" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 8: Density and profile events by inspired gas, public API, full verification
- [x] Status

**Files:**
- Modify: `gases/GasDensity.ts` (`DensityAtDepth` L63-106)
- Modify: `algorithm/ProfileEvents.ts` (`EventsContext` L48-166, `EventOptions` L168-186, `addDensityExceeded` L397-427)
- Modify: `projects/scuba-physics/src/public-api.ts`
- Create: `algorithm/ProfileEvents.breathing.spec.ts`

**Interfaces:**
- Consumes: `BreathingModel`, `OpenCircuitBreathing`.
- Produces: `new DensityAtDepth(depthConverter, breathing?)`, `DensityAtDepth.forProfile(profile, startAscentIndex = Number.POSITIVE_INFINITY)`, `EventOptions.breathing?: BreathingModel`. Public API exports `ccr/BreathingModel`, `ccr/LoopGas`, `ccr/RebreatherOptions`, `ccr/Rebreathers`.

- [x] **Step 1: Write the failing test**

```ts
// algorithm/ProfileEvents.breathing.spec.ts
import { EventOptions, ProfileEvents } from './ProfileEvents';
import { EventType } from './CalculatedProfile';
import { OptionExtensions } from './Options.spec';
import { Segments } from '../depths/Segments';
import { Gas } from '../gases/Gases';
import { DensityAtDepth } from '../gases/GasDensity';
import { DepthConverter, DepthConverterFactory } from '../physics/depth-converter';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';

describe('Profile events - Breathing model', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options.maxEND = 30;
    const openCircuit = new OpenCircuitBreathing(new DepthConverterFactory(options).create());

    const eventTypes = (gas: Gas, maxDensity: number, breathing?: BreathingModel): EventType[] => {
        const segments = new Segments();
        segments.add(60, gas, Time.oneMinute * 3);
        segments.addFlat(gas, Time.oneMinute * 10);
        const eventOptions: EventOptions = {
            maxDensity: maxDensity,
            startAscentIndex: 2,
            profile: segments.items,
            ceilings: [],
            profileOptions: options,
            breathing: breathing
        };
        return ProfileEvents.fromProfile(eventOptions).items.map(e => e.type);
    };

    describe('Narcotic depth', () => {
        it('trimix does not exceed narcotic depth with explicit open circuit', () => {
            expect(eventTypes(new Gas(0.18, 0.45), 50, openCircuit)).not.toContain(EventType.maxEndExceeded);
        });

        it('air exceeds narcotic depth with explicit open circuit', () => {
            expect(eventTypes(StandardGases.air, 50, openCircuit)).toContain(EventType.maxEndExceeded);
        });

        it('explicit open circuit generates the same events as without model', () => {
            expect(eventTypes(StandardGases.air, 50, openCircuit)).toEqual(eventTypes(StandardGases.air, 50));
        });
    });

    describe('Density', () => {
        it('explicit open circuit generates the same density events as without model', () => {
            const withModel = eventTypes(StandardGases.air, 5.7, openCircuit);
            expect(withModel).toContain(EventType.highGasDensity);
            expect(withModel).toEqual(eventTypes(StandardGases.air, 5.7));
        });

        it('highest density with explicit open circuit equals density without model', () => {
            const depthConverter = DepthConverter.simple();
            const profile = new Segments();
            profile.add(30, StandardGases.ean32, Time.oneMinute * 2);

            const withModel = new DensityAtDepth(depthConverter, new OpenCircuitBreathing(depthConverter)).forProfile(profile.items);
            const withoutModel = new DensityAtDepth(depthConverter).forProfile(profile.items);
            expect(withModel.density).toBeCloseTo(withoutModel.density, 10);
            expect(withModel.depth).toBe(withoutModel.depth);
        });
    });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx ng test --project scuba-physics --browsers=ChromeHeadless --no-watch --include='**/algorithm/ProfileEvents.breathing.spec.ts'`
Expected: compilation FAIL, `'breathing' does not exist in type 'EventOptions'`.

- [x] **Step 3: `DensityAtDepth`**

In `gases/GasDensity.ts` add `import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';` and change `DensityAtDepth` (keep `atDepth` and `fromAtaDensity` unchanged):

```ts
export class DensityAtDepth {
    private density = new GasDensity();
    private readonly breathing: BreathingModel;

    constructor(private depthConverter: DepthConverter, breathing?: BreathingModel) {
        this.breathing = breathing ?? new OpenCircuitBreathing(depthConverter);
    }

    /**
     * Finds highest density of all profile segments.
     * @param profile not null collection of segments representing expected profile
     * @param startAscentIndex index of first segment of calculated ascent, Infinity if not known
     * @returns Highest density found
     */
    public forProfile(profile: Segment[], startAscentIndex: number = Number.POSITIVE_INFINITY): HighestDensity {
        const result = HighestDensity.createDefault();

        profile.forEach((s, index) => {
            const isAscent = index >= startAscentIndex;
            this.applyHigher(result, s.gas, s.startDepth, isAscent);
            this.applyHigher(result, s.gas, s.endDepth, isAscent);
        });

        return result;
    }

    private applyHigher(result: HighestDensity, sourceGas: Gas, depth: number, isAscent: boolean): void {
        const gas = this.breathing.inspiredGas(sourceGas, depth, isAscent);
        const density = this.atDepth(gas, depth);
        result.applyHigher(gas, depth, density);
    }
```

- [x] **Step 4: `ProfileEvents`**

In `algorithm/ProfileEvents.ts` add `import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';` and `Gas` to the existing gases import if it isn't there.
- `EventOptions`: add

```ts
    /** Breathing model used to create the profile, open circuit if not provided */
    breathing?: BreathingModel;
```

- `EventsContext`: add the field `private breathing: BreathingModel;`. In the constructor, after `this.exactDepths = ...`, add `this.breathing = eventOptions.breathing ?? new OpenCircuitBreathing(this.exactDepths);`. Add:

```ts
    /** Gas breathed by the diver at depth in meters for current segment */
    public inspiredGasAt(depth: number): Gas {
        return this.breathing.inspiredGas(this.current.gas, depth, !this.isBeforeDecoAscent);
    }
```

- `gasEnd`: replace `const gas = this.current.gas;` with `const gas = this.inspiredGasAt(this.simpleDepths.fromBar(depth));`
- `addDensityExceeded`: replace `const currentGas = current.gas;` and the two density lines with:

```ts
        const startDensity = context.densityAtDepth.atDepth(context.inspiredGasAt(startDepth), startDepth);
        const endDensity = context.densityAtDepth.atDepth(context.inspiredGasAt(endDepth), endDepth);
```

  The events keep reporting `current.gas` (the source gas), which is what the user assigned.

- [x] **Step 5: Public API**

In `projects/scuba-physics/src/public-api.ts`, after `export * from './lib/algorithm/BuhlmannAlgorithmParameters';`, add:

```ts
export * from './lib/ccr/BreathingModel';
export * from './lib/ccr/LoopGas';
export * from './lib/ccr/RebreatherOptions';
export * from './lib/ccr/Rebreathers';
```

- [x] **Step 6: Run the new spec**

Run the Step 2 command. Expected: 5 specs, 0 failures.

- [x] **Step 7: Full verification (OC identity, lint, build, planner)**

Run each command and confirm its output before claiming success:

```bash
npm run test-lib-ci
npm run lint
npm run build-lib
npm run test-ci
```

Expected: every scuba-physics spec passes with **no existing spec modified** (`git diff master --stat -- '*.spec.ts'` lists only new `*.spec.ts` files); lint is clean; the library builds; planner specs pass (the planner still compiles against the changed optional signatures).

- [x] **Step 8: Commit**

```bash
git add projects/scuba-physics/src
git commit -m "feat(scuba-physics): #26 density and events by inspired gas, export breathing model" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Roadmap: stages 2–5 (detailed plans are written when each stage starts)
- [ ] Status

### Decisions (confirmed)
- [ ] Status

- One tank list as in OC: tanks are assigned to depth levels as today, and the same list defines the bailout gases. The rebreather type dropdown sits in the tanks card header (complex view). Rebreather options go in a second tab of the tanks card.
- Bailout = rock-bottom **reserve from an emergency ascent**: the user-defined part (including the deepest point) is breathed from the loop, only the generated ascent from open-circuit bailout gases (`BailoutBreathing`, Task 2.7). No separate bailout schedule UI in stages 2–4; the bailout profile is shown in Stage 5.
- mCCR deco/toxicity = manually held **setpoint**. O2 use = needle-valve flow.

### Shared rule for stages 2–5
- [ ] Status

Each stage starts from the latest master and is a full vertical slice:
1. **Lib**: `XxxBreathing implements BreathingModel` (from Stage 1), a `BreathingModelFactory` case (the factory is created in Stage 2), specs (`BuhlmannAlgorithm.<type>.spec.ts`, `consumption.<type>.spec.ts`).
2. **Planner state**:
   - `OptionsService` getters/setters (unit-converted)
   - DTO fields
   - URL `r` group fields
   - `PlanValidation` + `SettingsNormalizationService` ranges
   - worker wiring that passes the breathing model and `startAscentIndex` to the algorithm, `Consumption`, CNS/OTU/daily, density and `ProfileEvents` (`workers/planning.tasks.ts`, keeping both worker factories in sync)
   - service specs
3. **UI**: ranges in `UnitConversion.ts` (Metric/Imperial) + `ValidatorGroups.ts`, form controls with `[class.is-invalid]` + sibling message, `col-12 col-sm-* col-md-*` grid, i18n keys in all 7 `assets/i18n/*.json`, component specs.
4. **Saving and loading** of every new tanks-card control (circuit dropdown, rebreather options; the selected tanks-card tab is not saved):
   - Values go through `Preferences` (`shared/preferences.ts` `toDiveFrom`/`loadDive`, `DiveDto` → `OptionsDto.rebreather`) into `PreferencesStore`.
   - The selected tanks-card tab is local component state only, not saved.
   - Older stored data loads with defaults (OC).
   - Specs: a round-trip per field, and legacy JSON without the fields.
5. **URL validation** of the new `r` parameters in `shared/PlanValidation.ts`:
   - every value is numeric
   - index 0 is a valid `CircuitType`
   - options are within their `UnitConversion` ranges
   - stage cross-field rules hold (mCCR: tank 2 is O2; eCCR: descent ≤ bottom setpoint)
   - An invalid `r` → the URL is not loaded. Valid values are clamped by `SettingsNormalizationService`.
   - Specs ("Skips loading" pattern): out-of-range, unknown circuit, non-numeric. Redundant values are silently ignored, as in other url parameters.
6. **Docs**: a section in `doc/rebreather.md` + help menu anchor. **E2E**: one happy-path test per stage.
7. `npm run lint`, `test-lib-ci`, `build-lib`, `test-ci`, `e2e` pass. Commit as `feat(scope): #26 summary`.
8. **Stages 3 (mCCR) and 4 (eCCR) don't close issue #26.** Finishing the stage ticks its row in the issue description instead (see "Stage 3 finish" / "Stage 4 finish"). Only Stage 5 may close the issue.
   - **No GitHub closing keywords for #26** anywhere in the stage's commits, PR title/body or merge commit message: `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`, each followed by `#26` or `: #26`.
   - GitHub accepts the colon form, so a commit summary `fix: #26 …` merged into `master` **closes the issue**. In these stages always put a scope after the type, e.g. `fix(planner): #26 …`. This overrides the unscoped `fix: #123 …` example in CLAUDE.md.
   - The PR body references the issue as `Part of #26`.

### Stage 2: pSCR (introduces the shared rebreather plumbing)
- [x] Status

Tanks work exactly as in OC: one `TanksService` list, and any tank can be assigned to any depth level. In pSCR the assigned tank is that level's **supply gas**, and the same list defines the **bailout gases**. No separate diluent/oxygen tanks.
- **Lib**:
  - `RebreatherOptions.injectionRatio` (default 8, range 4–20).
  - `PscrBreathing(options, diver rmv, depthConverter)`:
    - `inspiredGas` = `LoopGas.pscrSteadyState(toBar(depth), sourceGas, rmv, injectionRatio, metabolicO2)`; `ppO2` = loop fO2 × Pamb.
    - `consumedLiters` = `Rebreathers.pscrSupplyRate(toBar(averageDepth), rmv, ratio)` × minutes.
    - `usesGasSwitching = true`, `usesAirBreaks = false`.
  - `BreathingModelFactory.create(options, diver, depthConverter)`.
  - `ConsumptionByGas` (`consumption/consumptionByGas.ts`): accept an optional `BreathingModel` like `Consumption` (plan consumption via the model, reserve always OC). Otherwise the by-gas chart and the "not enough gas" check would use `RMV × P` for pSCR (Stage 1 final review finding).
  - Emergency ascent: the bottom phase is breathed from the loop, the generated ascent from open-circuit bailout gases (`BailoutBreathing`, Task 2.7).
- **Planner**:
  - `OptionsService` for `circuit`, `injectionRatio`, `metabolicO2`.
  - `RebreatherDto` (optional on `OptionsDto`), converters next to `fromAirBreaks`/`toAirBreaks`.
  - URL (`shared/PlanUrlSerialization.ts`): `t=`, `de=` and `o=` are unchanged.
    - New **optional** group `r=<circuit>,<opt1>,…` of numbers. Index 0 = `CircuitType`, then indexed options starting with the pSCR options: `r=<circuit>,<injectionRatio>,<metabolicO2>`. Stages 3/4 append theirs.
    - A missing `r` → `CircuitType.oc` + defaults. Missing trailing indexes → defaults (length-guarded like `fromAirBreakParam`).
    - `toDiveUrl` writes `r` only when circuit ≠ OC.
    - Specs: pSCR round-trip, partial `r` falls back to defaults, invalid `r` is skipped.
    - **Test "URL without `r` falls back to OC dive configuration"** (style of `PlanUrlSerialization.spec.ts:183-207`): load a literal pre-CCR URL; assert `circuit = CircuitType.oc`, default rebreather options, and tanks/segments/options equal to the OC dive (`expectSelectedEquals`); re-serializing writes no `r`.
  - Workers: `BreathingModelFactory` in `workers/planning.tasks.ts`. Simple mode / `resetToSimple` forces OC.
- **UI** (complex view only):
  - **Circuit dropdown in the tanks card header** (`plan/tanks-complex/tanks-complex.component.html`, projected into `<app-card-header>`; safety-stop dropdown pattern `diveoptions.component.html:135-152`). It lists OC and pSCR, and a thin handler sets `options.circuit` → `sendOptionsChanged`.
  - **Tanks card split into two `mdb-tabs`**: "Tanks" (existing list, both layouts) and "Rebreather" (**pSCR options only**: injection ratio, metabolic O2), shown when circuit ≠ OC.
  - `depths-complex` and the `diveinfo` Consumed tab are unchanged.
- **Docs**: create `doc/rebreather.md` (overview, pSCR model, supply/bailout tanks, reserve) + help menu entry.

#### Stage 2 detailed tasks (branch `feat/26-ccr-pscr`)
- [x] Status

Decisions made while detailing (from reading the planner code):
- pSCR loop gas needs the diver RMV also in profile/dive info workers, so `PlanRequestDto` gets `diver: DiverDto`.
- Rebreather options travel in `OptionsDto.rebreather?` (optional "because of upgrade"), so preferences save/load them through the existing `fromOptions`/`toOptions`.
- The selected tanks-card tab is only local state of the tanks component (not saved). The Rebreather tab is shown only for a non-OC circuit and closes when switched back to OC.
- The emergency ascent breathes the bottom phase from the loop and the generated ascent as open circuit (`BailoutBreathing`, Task 2.7; replaces the earlier always-OC decision). `ConsumptionByGas` gets the model (Stage 1 review finding).

##### Task 2.1: pSCR breathing model and factory (lib)
- [x] Status
- `RebreatherOptions.injectionRatio` (default 8, `RebreatherDefaults.injectionRatio`), included in `loadFrom`.
- `ccr/PscrBreathing.ts`: `PscrBreathing(options: RebreatherOptions, rmv: number, depthConverter)`; `inspiredGas` = `LoopGas.pscrSteadyState(toBar(depth), sourceGas, rmv, injectionRatio, metabolicO2)`; `ppO2` = inspired fO2 × toBar(depth); `consumedLiters` = `Rebreathers.pscrSupplyRate(toBar(averageDepth), rmvPerSecond, injectionRatio)` × rounded duration; `usesGasSwitching = true`, `usesAirBreaks = false`.
- `ccr/BreathingModelFactory.ts`: `create(options: Options, rmv: number, depthConverter): BreathingModel` → `PscrBreathing` for `CircuitType.pscr`, otherwise `OpenCircuitBreathing`.
- Export both; specs `PscrBreathing.spec.ts`, `BreathingModelFactory.spec.ts`, `BuhlmannAlgorithm.pscr.spec.ts` (no air breaks, loop gas loads tissues → different deco than OC on the supply gas), `consumption.pscr.spec.ts`.

##### Task 2.2: ConsumptionByGas uses the breathing model (lib)
- [x] Status
- `new ConsumptionByGas(depthConverter, breathing)`: plan consumption via the model, reserve OC. Specs: pSCR consumes supply rate, reserve stays OC. (Breathing made mandatory in Task 2.8.)

##### Task 2.3: Planner state, DTOs and workers
- [x] Status
- `RebreatherDto { circuit, metabolicO2, loopVolume, injectionRatio }`, `OptionsDto.rebreather?`, `PlanRequestDto.diver`, converters in `DtoSerialization` (missing dto keeps defaults).
- `PlannerService` sends `diver` in plan requests; `PlanningTasks` builds the model by `BreathingModelFactory` and passes it (+ `startAscentIndex`) to algorithm, OTU/CNS/daily CNS, density, events, `Consumption` and `ConsumptionByGas`.
- `OptionsService`: `circuit`, `injectionRatio`, `metabolicO2` (imperial via `units.fromLiter`), `isRebreather`; `resetToSimple` forces OC.
- Specs: `dtoSerialization`/`planner.service` (pSCR dive calculates, differs from OC), `options.service.spec.ts`.

##### Task 2.4: URL `r` group, validation, normalization, saving/loading
- [x] Status
- `PlanUrlSerialization`: optional `r=<circuit>,<injectionRatio>,<metabolicO2>`, written only for non-OC; missing → OC defaults; missing trailing values → defaults.
- `UnitConversion` ranges `injectionRatio` [4, 20], `metabolicO2` metric [0.5, 3] L/min, imperial [0.018, 0.106] cuft/min (+ labels), `ValidatorGroups` getters.
- `PlanValidation`: numeric values, `circuit in CircuitType`, ranges, simple dives must be OC. `SettingsNormalizationService` clamps the values.
- `Preferences` save/load the rebreather options (legacy without them → OC). The tanks-card tab is not saved.
- Specs: URL round-trip, "URL without `r` falls back to OC dive configuration", partial/invalid `r`, preferences round-trip + legacy JSON.

##### Task 2.5: Tanks card UI (dropdown + tabs + pSCR options)
- [x] Status
- `tanks-complex`: circuit dropdown (OC / pSCR) projected into the card header; body with "Tanks" / "Rebreather" tabs (Bootstrap `nav-tabs` toggling visibility: moving the body into `mdb-tabs` rebuilt the tanks accordion and broke change detection) (Rebreather tab only when not OC); selected tab is local component state, closed when switched to OC.
- New `RebreatherOptionsComponent` (`plan/rebreather-options/`, `app-rebreather-options`, registered in `app.config.ts`): injection ratio + metabolic O2 inputs, reactive form, `[class.is-invalid]` + sibling message, `col-12 col-sm-6 col-md-*` grid, thin handlers → `OptionsService` → `sendOptionsChanged`.
- i18n keys in all 7 `assets/i18n/*.json`. Component specs.

##### Task 2.6: Docs and E2E
- [x] Status
- `doc/rebreather.md` (overview, pSCR model, supply/bailout tanks, reserve, limits) + help menu entry + `helpDocument` on the Rebreather tab.
- E2E happy path: complex view → pSCR → results show a calculated dive.
- Full verification: `test-lib-ci`, `build-lib`, `test-ci`, lint of changed files, `e2e`.
##### Task 2.7: Bailout breathing for the emergency ascent
- [x] Status

Restores the bailout model from the first Stage 1 plan version, which was replaced by an always-OC emergency ascent. The emergency ascent breathes the user-defined part of the dive (including the deepest point and the problem solving time) from the dive's breathing model (the loop), and only the generated ascent from open-circuit bailout gases. For pSCR this loads the leaner loop gas before bailout, so the bailout decompression and the rock-bottom reserve aren't underestimated.

**Files:**
- Modify: `ccr/BreathingModel.ts`, `ccr/BreathingModel.spec.ts`
- Modify: `depths/PlanFactory.ts`; Create: `depths/PlanFactory.bailout.spec.ts`
- Modify: `consumption/consumption.ts`, `consumption/consumption.pscr.spec.ts`
- Modify: `projects/planner/src/app/workers/planning.tasks.ts`, `doc/rebreather.md`

**Interfaces:**
- Produces: `new BailoutBreathing(primary: BreathingModel, depthConverter: DepthConverter)` implementing `BreathingModel`. The bailout is always `OpenCircuitBreathing(depthConverter)` created inside, because the diver bails out to open circuit when the rebreather fails:
  - `inspiredGas` / `ppO2` use `primary` while `isAscent` is false, `bailout` during the generated ascent.
  - `usesGasSwitching` / `usesAirBreaks` come from `bailout`, because gas switches and air breaks happen only during the ascent.
  - `consumedLiters` comes from `bailout`, the emergency ascent is consumed as open circuit.
- Produces: `PlanFactory.emergencyAscent(originalPlan, options, tanks, breathing: BreathingModel, surfaceInterval?)` (mandatory since Task 2.8). The algorithm gets `new BailoutBreathing(breathing, depthConverter)`; for an open circuit dive this gives the same ascent as before.
- `Consumption.consumeFromTanks` passes its breathing model to `emergencyAscent`; `PlanningTasks.calculateConsumption` passes the dive's model too. The reserve liters stay open circuit (`reserveConsumption`).

**Steps (TDD):**
- [x] `BreathingModel.spec.ts` "Bailout": with `PscrBreathing` as primary and `OpenCircuitBreathing` as bailout: loop gas before ascent, supply gas during ascent, gas switching from bailout (true), air breaks from bailout (true).
- [x] Implement `BailoutBreathing`, export it.
- [x] `PlanFactory.bailout.spec.ts`:
  - a pSCR dive needs longer bailout ascent than the same dive calculated as open circuit (leaner loop gas loaded at the bottom);
  - the generated ascent is breathed from the tank gas (last segment gas = tank gas).
- [x] Implement the `breathing` parameter in `PlanFactory.emergencyAscent`.
- [x] `consumption.pscr.spec.ts`: pSCR reserve from `consumeFromTanks` is at least the open circuit reserve of the same plan.
- [x] Pass the model from `Consumption.consumeFromTanks` and `PlanningTasks.calculateConsumption`; remove the "always open circuit" comments.
- [x] `doc/rebreather.md` "Bailout and reserve": the bottom part is breathed from the loop, only the ascent is open circuit; remove the limitation note.
- [x] Verification: `test-lib-ci`, `build-lib`, `test-ci`, lint of changed files, `e2e`.

##### Task 2.8: Mandatory breathing model
- [x] Status

The breathing model is passed explicitly everywhere, open circuit is no longer an implicit default. Every production entrypoint already received a model from the planner worker, except the open circuit calculators listed below.

**Interfaces (all `breathing` parameters mandatory, no new optional parameters):**
- `AlgorithmParams.forSimpleDive(depth, gas, options, breathing, surface?)`, `AlgorithmParams.forMultilevelDive(segments, gases, options, breathing, surface?)`: `breathing` moved before the already optional `surface`. Getter `breathing: BreathingModel`. The `BuhlmannAlgorithm.breathingFor` fallback is removed.
- `PlanFactory.emergencyAscent(originalPlan, options, tanks, breathing, surfaceInterval?)`: always uses `BailoutBreathing(breathing, depthConverter)`.
- `new Consumption(depthConverter, breathing)`, `new ConsumptionByGas(depthConverter, breathing)`: plan consumption via `SegmentsConsumption.createPlan(breathing)`, reserve via `SegmentsConsumption.createReserve(depthConverter)` (always open circuit).
- `new SegmentsConsumption(breathing)`: the depth converter was only used for the default model and is removed. Factories `createPlan(breathing)` and `createReserve(depthConverter)` name the two uses.
- `new CnsCalculator(depthConverter, breathing)`, `new OtuCalculator(depthConverter, breathing)`, `new CnsDailyCalculator(depthConverter, breathing)`, `new DensityAtDepth(depthConverter, breathing)`.
- `EventOptions.breathing: BreathingModel`; the events density helper uses the same model.

**Open circuit provided explicitly:**
- NDL limits calculator: `NdlService` uses one `DepthConverterFactory(options)` converter for the MOD and for its `OpenCircuitBreathing`.
- Gas properties calculator and learn quiz: through `GasProperties`, whose `DensityAtDepth` gets `OpenCircuitBreathing`.
- Reserve (emergency ascent) consumption in `Consumption` and `ConsumptionByGas`.

**Specs:**
- Spec helper `OptionExtensions.openCircuit(options)` creates open circuit with the algorithm depth converter.
- Existing specs pass open circuit explicitly with unchanged expected values (OC identity).
- Removed the "explicit open circuit ... same as without model" comparisons, which can't be expressed anymore. Toxicity comparisons now check that open circuit does not depend on the ascent start.
- Dissolved the Stage 1 `*.breathing.spec.ts` files:
  - toxicity tests moved to `Breathing model` blocks in `cnsCalculator.spec.ts`, `OtuCalculator.spec.ts`, `cnsDailyCalculator.spec.ts`;
  - `AlgorithmParams` breathing getter tests moved to `BuhlmannAlgorithm.spec.ts` ("Algorithm parameters");
  - `consumptionByGas.breathing.spec.ts` renamed to `consumptionByGas.pscr.spec.ts`;
  - `ProfileEvents.breathing.spec.ts` and `consumption.breathing.spec.ts` deleted, their open circuit cases are covered by `ProfileEvents.spec.ts` and `consumption.spec.ts`.
- Spec depth converters named by environment (`depthConverter`, `saltWater`, `freshWater`), one `openCircuit` per `describe` where shared.
- Not covered by own specs yet: `SegmentsConsumption.createPlan` / `createReserve` (the reserve staying open circuit is covered by `consumptionByGas.pscr.spec.ts`).

**Verification:** `test-lib-ci`, `build-lib`, `test-ci`, lint of changed files, `e2e`.

##### Stage 2 final review
- [x] Status
- Fixed: stale invalid rebreather form blocked all planner inputs; unsupported circuits (mCCR/eCCR) loaded from url as OC; imperial metabolic O2 minimum; hypoxic loop now raises the existing `Low ppO2` warning.
- Deferred minors (pick up in Stage 3):
  - Tanks card header keeps `helpDocument="tanks"` also on the Rebreather tab (should open `rebreather`).
  - Metabolic O2 input `step="0.01"` is coarse in imperial units.
  - `ValidatorGroups` `required` wrapper comment wording.
- Known: high ppO2 warning is still evaluated for the supply gas, not the loop (Stage 5c).

### Stage 3: mCCR
- [ ] Status

- **Lib**:
  - `RebreatherOptions.setpoint` (default 1.3, range 0.4–1.6) and `o2Flow` (default 0.8 L/min, range 0.3–3).
  - `MccrBreathing`: loop gas from `LoopGas.constantPpO2`; `usesGasSwitching = false`, `usesAirBreaks = false`.
  - Consumption through the breathing model (no separate `MccrConsumption`, see Stage 3 detailed tasks): O2 = `Rebreathers.mccrO2Rate` × t from tank 2; diluent = `Rebreathers.diluentForDescent` over descending segments from tank 1; bailout reserve via the bailout emergency ascent (`BailoutBreathing`), which may use all tanks including the CCR oxygen tank.
  - Algorithm validation: in mCCR, tank 2 must be oxygen, otherwise the algorithm returns an error.
  - `RebreatherOptions.loopVolume` (default 6 L, range 2–10) becomes editable.
- **Tanks model** (single `TanksService` list, URL `t=`/`de=` unchanged): in mCCR the "Tanks" tab holds
  - **tank 1 = diluent**: gas fully editable
  - **tank 2 = oxygen**: gas fixed to 100 % O2, O2/He inputs and the standard-gas dropdown disabled; only size/pressure editable
  - **Switching from OC to mCCR** (`TanksService.prepareForMccr()`, called from the dropdown handler before `sendOptionsChanged`):
    1. If tank 2 is already O2 → use it as is.
    2. Else, if an O2 tank exists at another position → **move it to position 2** and use it as the mCCR oxygen. Then renumber tank ids; levels hold `TankBound` references, so assignments stay correct. If O2 was tank 1, the former tank 2 becomes the diluent.
    3. Else → insert a new O2 tank (3 L/200 bar) at position 2, shifting the rest. Existing tanks are never overwritten.
    4. If the only tank was O2 → add an air diluent at position 1.
    - Then `sendTanksReloaded`. Switching back to OC keeps the order.
    - Specs in `tanks.service.spec.ts` cover every branch, including depth levels still pointing to the moved tank.
  - All tanks (diluent, oxygen and further tanks) are available as bailout.
- **Planner**: `TanksService` `diluentTank`/`oxygenTank` helpers; `removeTank` can't remove tanks 1–2 in mCCR; `PlanValidation`: tank 2 is O2 in mCCR. O2 flow, loop volume and setpoint are appended to `r` after the pSCR options (setpoint last).
- **UI**: mCCR in the header dropdown; diluent/oxygen labels on rows 1–2, oxygen gas controls disabled; the "Rebreather" tab shows a separate options component per circuit: pSCR options (injection ratio, metabolic O2) or mCCR options (target ppO2, O2 flow, loop volume, metabolic O2). Component spec: the oxygen gas can't be changed.
- **Docs**: mCCR section.

#### Stage 3 detailed tasks (branch `feat/26-ccr-mccr`)
- [ ] Status

Decisions made while detailing (confirmed with the user 2026-10-14, or derived from the code):
- **Bailout gases in mCCR** = all tanks, including the CCR oxygen tank 2 (changed by the user 2026-10-14; the first version excluded tank 2). The emergency ascent may switch to tank 2 oxygen, so its reserve includes the ascent oxygen. `PlanFactory.emergencyAscent` stays unchanged.
- **Algorithm validation** (user 2026-10-14): in mCCR, tank 2 must be 100 % O2 / 0 % He, otherwise the algorithm returns an error event (`EventType.error`) instead of a profile. To be able to check the tank, the mCCR model gets the dive tanks: `BreathingModelFactory.create(options, rmv, tanks, depthConverter)`. All breathing models get `validate(): Event[]`.
- **Loop volume is editable** in the Rebreather tab (mCCR), and it is part of the `r` group. The default stays 6 L.
- **URL order** (user 2026-10-14): `r=<circuit>,<injectionRatio>,<metabolicO2>,<o2Flow>,<loopVolume>,<setpoint>`. The setpoint is last.
- **Separate options components** (user 2026-10-14): the Rebreather tab shows `app-pscr-options` for pSCR and `app-mccr-options` for mCCR.
  - The existing `RebreatherOptionsComponent` is renamed to `PscrOptionsComponent` (`plan/pscr-options/`), so both names follow the circuit. Control ids stay the same, so the pSCR E2E test keeps working.
  - Both components contain the metabolic O2 input. Only one is rendered at a time.
- **No `MccrConsumption` class** (deviation from the roadmap). Since Task 2.8, the breathing model is the single consumption entry point for `Consumption` and `ConsumptionByGas`, so mCCR consumption goes through the model too (eCCR reuses it in Stage 4):
  - `consumedLiters` = diluent taken from the segment source tank;
  - new `oxygenLiters` = oxygen taken from the new `oxygenTank`.
- The oxygen tank is identified by position (index 1 = tank 2), the same convention as the UI. The lib constant `RebreatherTanks.oxygenIndex = 1` names it.
- A depth level assigned to any tank in mCCR treats that tank's gas as the loop diluent (no OC bailout segments in the plan). `depths-complex` stays unchanged.
- In the UI the mCCR setpoint is called **"Target ppO2"**: the diver holds it manually, and the constant mass flow only defines the oxygen used.

##### Task 3.1: mCCR breathing model, oxygen interface and validation (lib)
- [ ] Status

**Files:**
- Modify: `ccr/RebreatherOptions.ts`, `ccr/RebreatherOptions.spec.ts`
- Modify: `ccr/BreathingModel.ts`, `ccr/BreathingModel.spec.ts`, `ccr/PscrBreathing.ts`, `ccr/PscrBreathing.spec.ts`
- Create: `ccr/MccrBreathing.ts`, `ccr/MccrBreathing.spec.ts`, `ccr/RebreatherTanks.ts`
- Modify: `ccr/BreathingModelFactory.ts`, `ccr/BreathingModelFactory.spec.ts`
- Modify: `algorithm/BuhlmannAlgorithm.ts`; Create: `algorithm/BuhlmannAlgorithm.mccr.spec.ts`
- Modify: `projects/scuba-physics/src/public-api.ts`
- Modify (factory signature): `projects/planner/src/app/workers/planning.tasks.ts`, and the factory callers in specs

**Interfaces:**
- Produces:
  - `RebreatherDefaults.setpoint = 1.3`, `RebreatherDefaults.o2Flow = 0.8` (L/min)
  - `RebreatherOptions.setpoint`, `RebreatherOptions.o2Flow`, both included in `loadFrom`
  - `BreathingModel.oxygenTank: Tank | undefined` (getter)
  - `BreathingModel.oxygenLiters(segment: Segment): number`. Oxygen comes from a fixed-rate source, so it doesn't depend on the diver RMV.
  - `BreathingModel.validate(): Event[]`. An empty array means the model can be used.
  - `OpenCircuitBreathing`, `PscrBreathing`: `oxygenTank` → `undefined`, `oxygenLiters` → `0`, `validate` → `[]`.
  - `BailoutBreathing`: `oxygenTank` → `undefined`, `oxygenLiters` → `0` (the emergency ascent is open circuit only); `validate` → `primary.validate()`.
  - `RebreatherTanks.oxygenIndex = 1`; `RebreatherTanks.oxygen(tanks: Tank[]): Tank | undefined` → `tanks[1]`
  - `new MccrBreathing(options: RebreatherOptions, tanks: Tank[], depthConverter: DepthConverter)`:
    - `inspiredGas(source, depth)` = `LoopGas.constantPpO2(toBar(depth), source, options.setpoint)`
    - `ppO2` = inspired fO2 × toBar(depth)
    - `consumedLiters(segment)` = `Rebreathers.diluentForDescent(options.loopVolume, toBar(segment.startDepth), toBar(segment.endDepth))`
    - `oxygenLiters(segment)` = `Rebreathers.mccrO2Rate(options.o2Flow, options.metabolicO2)` × `Time.toMinutes(roundTwoDecimals(segment.duration))`
    - `oxygenTank` = `RebreatherTanks.oxygen(tanks)`
    - `validate()` = `[Event.createError('mCCR needs oxygen in the second tank.')]` when `oxygenTank` is missing or its gas is not `compositionEquals(StandardGases.oxygen)`, otherwise `[]`
    - `usesGasSwitching = false`, `usesAirBreaks = false`
  - `BreathingModelFactory.create(options: Options, rmv: number, tanks: Tank[], depthConverter: DepthConverter)` → `MccrBreathing` for `CircuitType.mccr`. `tanks` is a new mandatory parameter: the planner worker passes the same deserialized `tanks` it gives to `Consumption`, so `oxygenTank` is the same instance that gets consumed.
  - `BuhlmannAlgorithm.validate(segments, gases, breathing)`: after the segment and gas validation, returns `breathing.validate()`. This applies to `decompression`, `decompressionStatistics` and `noDecoLimit`.

**Steps (TDD):**
- [ ] `RebreatherOptions.spec.ts`: defaults setpoint 1.3 / o2Flow 0.8; `loadFrom` copies both; `loadFrom` of a source with missing (0/undefined) values keeps the defaults (legacy data). Run, see it FAIL. Implement. PASS.
- [ ] `MccrBreathing.spec.ts` (salt water `depthConverter`, tanks [air diluent, O2], setpoint 1.3, o2Flow 0.8, metabolicO2 1.0, loopVolume 6):
  - at 30 m: ppO2 is 1.3 (`toBeCloseTo(1.3, 6)`); the inspired gas keeps the diluent He/N2 ratio (trimix 21/35 diluent → fHe/fN2 ratio unchanged);
  - at 3 m: setpoint above ambient → ppO2 = ambient, the loop is pure oxygen, no exception;
  - at 100 m with air diluent: diluent ppO2 above setpoint → ppO2 = diluent ppO2 (diluent flush);
  - the same results with `isAscent` true and false (mCCR has one setpoint);
  - diluent: descent 0 → 30 m consumes `6 × (toBar(30) − toBar(0))`; flat 30 m and ascent 30 → 0 m consume 0;
  - oxygen: a 10 min segment consumes 10 L (metabolic 1.0 > flow 0.8); with o2Flow 1.5, 15 L;
  - `oxygenTank` with tanks [air, O2, ean50] is the second tank instance; with a single tank, `undefined`;
  - `validate()`: [air, O2] → `[]`; [air, ean50] → one error event; [air] → one error event;
  - `usesGasSwitching`/`usesAirBreaks` are false.
  - Run, see it FAIL (missing class). Implement `RebreatherTanks`, `MccrBreathing`. PASS.
- [ ] `BreathingModel.spec.ts` and `PscrBreathing.spec.ts`:
  - OC and pSCR → `oxygenLiters` 0, `oxygenTank` undefined, `validate` empty;
  - Bailout with mCCR primary → `oxygenLiters` 0, `oxygenTank` undefined, `validate` returns the primary's error for [air, ean50].
  - Add the members to the interface and the three classes. PASS.
- [ ] `BreathingModelFactory.spec.ts`: `CircuitType.mccr` → `MccrBreathing` whose `oxygenTank` is the passed `tanks[1]`. FAIL, implement (new `tanks` parameter; update `planning.tasks.ts` `breathingFor` and `calculateConsumption` to pass the deserialized tanks), PASS.
- [ ] `BuhlmannAlgorithm.mccr.spec.ts`, 40 m / 25 min, tanks [air diluent, O2, ean50], GF 30/85:
  - (a) the whole profile stays on the diluent (no gas switch even with EAN50/O2 available);
  - (b) no air break segments;
  - (c) total runtime differs from OC on air with the same gases;
  - (d) setpoint 1.3 gives a shorter runtime than setpoint 0.7;
  - (e) tanks [air, ean50] → `decompression` returns one `EventType.error` and no calculated ascent; `noDecoLimit` returns 0 like other validation errors.
  - Write down the real runtime number in the spec after the sanity check against a reference planner (Subsurface/MultiDeco 40 m/25 min, dil air, SP 1.3, GF 30/85, within one stop minute). If no reference is at hand, assert (c)/(d) only and ledger it.
- [ ] Export `MccrBreathing`, `RebreatherTanks` in `public-api.ts`.
- [ ] Verification: single specs, then `npm run test-lib-ci`, `npm run build-lib`, `npm run test-ci` (factory signature in the worker), lint of the changed files. Commit `feat(scuba-physics): #26 mCCR breathing model`.

##### Task 3.2: mCCR consumption (lib)
- [ ] Status

**Files:**
- Modify: `consumption/consumptionCommon.ts`, `consumption/consumption.ts`, `consumption/consumptionByGas.ts`
- Create: `consumption/consumption.mccr.spec.ts`, `consumption/consumptionByGas.mccr.spec.ts`
- Modify: `depths/PlanFactory.bailout.spec.ts`

**Interfaces:**
- Consumes: `BreathingModel.oxygenTank`, `BreathingModel.oxygenLiters`, `MccrBreathing` (Task 3.1).
- Produces:
  - `SegmentsConsumption.oxygenLiters(segments: Segment[]): number` = sum of `breathing.oxygenLiters(s)`.
  - `Consumption.consumeFromTanks2`: after the reserve and before the segment consumption, consumes `oxygenLiters(segments)` from `breathing.oxygenTank`. Like the other consumption, it first keeps the reserve, then drains.
  - `ConsumptionByGas.consume`: adds the oxygen liters to the oxygen tank's gas `contentCode`.
  - `PlanFactory.emergencyAscent` is unchanged: the bailout ascent may use every tank, the CCR oxygen tank included.

**Steps (TDD):**
- [ ] `consumption.mccr.spec.ts` (tanks: 1 = air 12 L/200 bar diluent, 2 = O2 3 L/200 bar, 3 = air 11 L/200 bar bailout; profile from the algorithm with `MccrBreathing`, 30 m / 30 min):
  - O2 tank consumed = mCCR O2 rate × total runtime minutes (`toBeCloseTo`, liters);
  - diluent consumed = loop volume × descent pressure difference (only the descent consumes diluent);
  - the bailout tank 3 consumes nothing from the plan, only reserve;
  - the O2 tank reserve covers the oxygen breathed by the emergency ascent from 6 m (more than the minimal 20 bar stage reserve for a deco dive), and the plan oxygen is consumed on top of it.
  - OC identity is guarded by the unchanged `consumption.spec.ts`.
  - Run, see it FAIL. Implement in `SegmentsConsumption` + `Consumption`. PASS.
- [ ] `consumptionByGas.mccr.spec.ts`: oxygen gas consumed = the O2 liters, air consumed = diluent liters only, the reserves come from the emergency ascent. FAIL, implement, PASS.
- [ ] `PlanFactory.bailout.spec.ts`: mCCR with tanks [air, O2] → the emergency ascent switches to 100 % O2 from tank 2 at 6 m (pins the decision that the CCR oxygen is bailout too). Expected PASS without changes; it is a decision guard.
- [ ] Verification: `npm run test-lib-ci` (all existing OC/pSCR specs unchanged), `npm run build-lib`, lint. Commit `feat(scuba-physics): #26 mCCR oxygen and diluent consumption`.

##### Task 3.3: Planner state, DTOs and the tanks model
- [ ] Status

**Files:**
- Modify: `projects/planner/src/app/shared/serialization.model.ts`, `dtoSerialization.ts`, `options.service.ts`, `tanks.service.ts`
- Specs: `options.service.rebreather.spec.ts`, `tanks.service.spec.ts`, `dtoSerialization.spec.ts`, `planner.service.spec.ts`, `viewSwitchService.spec.ts`

**Interfaces:**
- Consumes: `RebreatherOptions.setpoint/o2Flow/loopVolume`, `RebreatherTanks.oxygenIndex`, `CircuitType.mccr`.
- Produces:
  - `RebreatherDto.setpoint?: number`, `RebreatherDto.o2Flow?: number` (optional because of upgrade; missing → defaults via `RebreatherOptions.loadFrom` semantics in `toRebreather`). `loopVolume` already exists.
  - `OptionsService` getters/setters `setpoint` (bar, no unit conversion), `o2Flow` and `loopVolume` (imperial via `units.fromLiter`/`toLiter`), `isMccr`, `isPscr`.
  - `TanksService.prepareForMccr(): void`, the `diluentTank`/`oxygenTank: TankBound | undefined` getters, and `canRemove(tank: TankBound, circuit: CircuitType): boolean`. `removeTank` itself stays unconditional. The UI hides the button using `canRemove`.

**Steps (TDD):**
- [ ] `dtoSerialization.spec.ts`: an mCCR options round-trip keeps setpoint/o2Flow/loopVolume; a legacy `rebreather` DTO without setpoint/o2Flow loads the defaults. FAIL → implement → PASS.
- [ ] `options.service.rebreather.spec.ts`: metric/imperial setters convert o2Flow/loopVolume; setpoint is not converted; `isMccr`/`isPscr`; `resetToSimple` still forces OC. FAIL → implement → PASS.
- [ ] `tanks.service.spec.ts` `prepareForMccr`, one test per branch:
  1. tank 2 is already O2 → nothing changes;
  2. O2 at position 3 → moved to position 2, ids renumbered 1..n, and a depth level bound to the moved tank still references the same `Tank` instance;
  3. O2 at position 1 with air at 2 → O2 becomes tank 2, air becomes tank 1 (diluent);
  4. no O2 → a new 3 L/200 bar O2 tank inserted at position 2 (metric; the imperial size comes from `units.defaults`), the other tanks shift down and none is overwritten;
  5. the only tank is O2 → an air diluent is inserted at position 1;
  - also: `sendTanksReloaded` is fired once; `canRemove` returns false for tanks 1–2 in mCCR and true in OC/pSCR.
  - FAIL → implement → PASS.
- [ ] `viewSwitchService.spec.ts` "switching mCCR dive to simple view": complex view, tanks [trimix 18/45 diluent, O2, EAN50 bailout], circuit mCCR → set `isComplex = false` → circuit is `CircuitType.oc`, only the first tank stays, and its helium is 0 %. It is expected to pass through the existing `DiveSchedules.setSimple` (`OptionsService.resetToSimple` + `TanksService.resetToSimple`). Ledger it if it is green on the first run; if it fails, fix `setSimple` the TDD way.
- [ ] `planner.service.spec.ts`:
  - an mCCR dive calculates and has a different runtime than the same OC dive; the O2 tank consumed > 0;
  - an mCCR dive with tank 2 = air ends with the profile error (no crash, no consumption), through the existing `calculatedProfile.errors` handling in `planner.service.ts`.
  - These are expected to pass through the worker wiring from Task 3.1. Ledger it if they pass without changes.
- [ ] Verification: `npm run test-ci`, lint. Commit `feat(planner): #26 mCCR options and tanks preparation`.

##### Task 3.4: URL `r` group, validation, normalization, saving/loading
- [ ] Status

**Files:**
- Modify: `shared/PlanUrlSerialization.ts`, `shared/PlanValidation.ts`, `shared/settings-normalization.service.ts`, `shared/UnitConversion.ts`, `shared/ValidatorGroups.ts`
- Specs: `PlanUrlSerialization.spec.ts`, `PlanValidation.spec.ts`, `settings-normalization.service.spec.ts`, `preferences.spec.ts`

**Interfaces:**
- URL: `r=<circuit>,<injectionRatio>,<metabolicO2>,<o2Flow>,<loopVolume>,<setpoint>`.
  - It is written for every rebreather (pSCR included, so the indexes stay stable).
  - Missing trailing values → defaults.
  - `loopVolume` is no longer hardcoded to the default.
- `UnitConversion` ranges + labels:
  - `setpoint` [0.4, 1.6] (both unit systems);
  - `o2Flow` metric [0.3, 3] L/min, imperial [0.011, 0.106] cuft/min;
  - `loopVolume` metric [2, 10] L, imperial [0.071, 0.353] cuft.
  - `ValidatorGroups` getters `setpoint`, `o2Flow`, `loopVolume`.
- `PlanValidation`:
  - `supportedCircuits` adds `CircuitType.mccr`;
  - setpoint/o2Flow/loopVolume are in range (when present);
  - **mCCR needs ≥ 2 tanks, and tank 2 must be 100 % O2 / 0 % He**. An invalid URL is not loaded; the algorithm validation from Task 3.1 covers dives that get there another way.
  - Valid values are clamped by `SettingsNormalizationService`.

**Steps (TDD):**
- [ ] `PlanUrlSerialization.spec.ts`:
  - an mCCR round-trip writes `r=3,8,1,0.8,6,1.3` and loads all six values back;
  - `r=3,8,1` → mCCR with the default o2Flow/loopVolume/setpoint;
  - `r=3,8,1,1.2` → o2Flow 1.2, default loopVolume and setpoint;
  - a pSCR URL from Stage 2 (`r=2,8,1`) still loads unchanged.
  - FAIL → implement → PASS.
- [ ] `PlanValidation.spec.ts` ("Skips loading" pattern):
  - setpoint 1.7 → skipped;
  - o2Flow 0.1 → skipped;
  - loopVolume 20 → skipped;
  - mCCR with tank 2 = air → skipped;
  - mCCR with a single tank → skipped;
  - a valid mCCR → loaded.
  - FAIL → implement → PASS.
- [ ] `settings-normalization.service.spec.ts`: out-of-range setpoint/o2Flow/loopVolume are clamped (metric and imperial). FAIL → implement → PASS.
- [ ] `preferences.spec.ts`: mCCR round-trip per field; legacy JSON without the new fields → defaults. Expected PASS after Task 3.3's DTO changes. Ledger it if it is green before the change.
- [ ] Verification: `npm run test-ci`, lint. Commit `feat(planner): #26 mCCR url, validation and normalization`.

##### Task 3.5: Tanks card UI, pSCR/mCCR options components (+ Stage 2 deferred minors)
- [ ] Status

**Files:**
- Modify: `plan/tanks-complex/tanks-complex.component.{html,ts}`, `tanks-complex.rebreather.spec.ts`
- Rename: `plan/rebreather-options/rebreather-options.component.*` → `plan/pscr-options/pscr-options.component.*` (`PscrOptionsComponent`, selector `app-pscr-options`)
- Create: `plan/mccr-options/mccr-options.component.{html,ts,spec.ts}` (`MccrOptionsComponent`, selector `app-mccr-options`)
- Modify: `app.config.ts` (`STANDALONE`: rename and register the new component)
- Modify: `assets/i18n/{cs,de,en,es,fr,ru,zh}.json`

**Interfaces:**
- Consumes: `OptionsService.isMccr/isPscr/setpoint/o2Flow/loopVolume`, `TanksService.prepareForMccr/canRemove/oxygenTank`, `ValidatorGroups.setpoint/o2Flow/loopVolume`, `UnitConversion` ranges (Tasks 3.3–3.4).
- Produces:
  - `PscrOptionsComponent` (form name `pscrOptions`): injection ratio + metabolic O2. Same behavior and control ids as the current `RebreatherOptionsComponent`.
  - `MccrOptionsComponent` (form name `mccrOptions`): target ppO2 (`#setpoint`), O2 flow (`#o2Flow`), loop volume (`#loopVolume`), metabolic O2 (`#metabolicO2`).
  - Each component adds its form group to the root form in `ngOnInit` and removes it in `ngOnDestroy`. The tanks card renders exactly one of them with `@if`. A form of the circuit that is no longer selected must not keep the root form invalid (this is the Stage 2 "stale invalid rebreather form" fix).
  - UI ids for E2E: `#circuitMccr`, `#setpoint`, `#o2Flow`, `#loopVolume`.

**Steps (TDD, component specs):**
- [ ] Rename `RebreatherOptionsComponent` → `PscrOptionsComponent` with its spec (`git mv`). Its spec passes unchanged except for the names. Run, PASS.
- [ ] `mccr-options.component.spec.ts`:
  - it shows target ppO2 (label "Target ppO2"), O2 flow, loop volume and metabolic O2, and no injection ratio;
  - an invalid target ppO2 (2.0) marks `is-invalid` and shows the sibling message with the range label; the same for O2 flow 0.1 and loop volume 20;
  - a valid change calls `sendOptionsChanged` once, with o2Flow/loopVolume converted for imperial;
  - it reloads its values on `optionsReloaded$` and `selectedChanged$`;
  - after destroy, its form group is removed from the root form.
  - FAIL → implement → PASS.
- [ ] `pscr-options.component.spec.ts`: after destroy, its form group is removed from the root form; the imperial metabolic O2 `step` is 0.001 (Stage 2 deferred minor). FAIL → implement → PASS.
- [ ] `tanks-complex.rebreather.spec.ts`:
  - choosing mCCR (`useMccr()` → `tanks.prepareForMccr()` → `applyCircuit(CircuitType.mccr)`) inserts the O2 tank 2;
  - the Rebreather tab renders `app-mccr-options` for mCCR and `app-pscr-options` for pSCR, never both;
  - an invalid pSCR value followed by a switch to mCCR doesn't block the planner (the root form is valid);
  - the header button text is "mCCR";
  - rows 1–2 show the "Diluent"/"Oxygen" labels (small and large layouts);
  - tank 2's O2/He inputs and standard-gas dropdown are disabled (**the oxygen gas can't be changed**), while size/pressure stay editable;
  - the remove button is hidden for tanks 1–2;
  - switching back to OC keeps the tank order and enables the controls again;
  - the card header `helpDocument` is `rebreather` while the Rebreather tab is open, `tanks` otherwise (Stage 2 deferred minor).
  - FAIL → implement → PASS.
- [ ] Layout: inputs in `col-12 col-sm-6 col-md-4`, `[class.is-invalid]` + sibling `text-danger` message, text in templates only.
  - New i18n keys in all 7 files: `tanksComplex.mccr`, `tanksComplex.diluent`, `tanksComplex.oxygen`, `mccrOptions.setpoint` (en text "Target ppO2"; the UI never calls the mCCR value a setpoint, `setpoint` stays the internal name only), `mccrOptions.o2Flow`, `mccrOptions.loopVolume`, `mccrOptions.metabolicO2`.
  - The existing `rebreatherOptions.*` keys are renamed to `pscrOptions.*`.
- [ ] `ValidatorGroups` `required` wrapper comment wording (Stage 2 deferred minor).
- [ ] Verification: `npm run test-ci`, lint. Commit `feat(planner): #26 mCCR tanks card and options components`.

##### Task 3.6: Docs, E2E and full verification
- [ ] Status

**Files:**
- Modify: `doc/rebreather.md` (mCCR section) and the help menu anchor. The mCCR section covers:
  - target ppO2: the diver holds this ppO2 by adding O2 manually (flow below metabolic use) or flushing diluent (flow above it); the planner uses it for tissue loading and CNS/OTU;
  - the constant mass flow only defines the O2 used (needle-valve O2 flow vs metabolic O2);
  - the diluent and oxygen tanks; tank 2 must be oxygen, otherwise the plan shows an error;
  - all tanks, including the CCR oxygen, are bailout gases;
  - loop volume and the diluent used during descent;
  - help anchors.
- Create: `e2e/mccr.spec.ts` (page-object style of `e2e/pscr.spec.ts`)

**Steps:**
- [ ] E2E happy path: complex view → `#circuitType` → `#circuitMccr` → the tanks card shows the oxygen tank 2 → `#rebreatherTab` → `#setpoint` = 1.2 → `#total-dive-time-value` differs from the OC runtime read before the switch.
- [ ] Manual check (`npm start`):
  - the profile, CNS/OTU and the O2/diluent consumed values update immediately on each input;
  - mobile width layout;
  - an mCCR URL round-trips;
  - an old URL/preferences load as OC.
- [ ] Verification: `npm run test-lib-ci`, `npm run build-lib`, `npm run test-ci`, `npm run lint`, `npm run e2e`. Commit `docs: #26 mCCR rebreather documentation` and `test(e2e): #26 mCCR happy path`.

##### Stage 3 final review
- [ ] Status

##### Stage 3 finish (issue #26 stays open)
- [ ] Status

Runs with `superpowers:finishing-a-development-branch`, after the final review is clean.

- [ ] Check the branch for closing keywords before the merge/PR:
  - `git log master..HEAD --format='%s%n%b' | grep -inE '(close[sd]?|fix(e[sd])?|resolve[sd]?):? *#26'`
  - Expected: no output.
  - Reword any match (scoped type, see shared rule 8) with my approval, because it rewrites published history if the branch was pushed.
- [ ] The PR body (if a PR is used) says `Part of #26`, never `Closes #26`. A local merge commit message gets the same check.
- [ ] After the merge into `master` is pushed:
  - `gh issue view 26 --json state,body`. Expected state: `OPEN`. If GitHub closed it anyway, `gh issue reopen 26` and tell me which commit did it.
  - Tick the mCCR row in the issue description:
    1. Save the body to the scratchpad.
    2. Change exactly the one task-list row that mentions mCCR from `- [ ]` to `- [x]`.
    3. Show me the diff of the body.
    4. `gh issue edit 26 --body-file <file>`.
  - If no row or more than one row matches mCCR, stop and ask me which row to tick.
  - `gh` needs `gh auth login` (or `GH_TOKEN`) first; it isn't authenticated in this environment yet. Editing the issue is outward-facing, so confirm with me right before running it.
- [ ] Mark `### Stage 3: mCCR` `- [x] Status` in this plan.

### Stage 4: eCCR
- [ ] Status

- **Lib**:
  - `RebreatherOptions.setpoints { descent 0.7, bottom 1.3, deco 1.3, switchDepth 20 m }` and `o2Loss` 0.1.
  - `EccrBreathing`: before the ascent, shallower than switchDepth → descent SP, deeper → bottom SP; `isAscent` → deco SP (uses Stage 1 `isAscent`/`startAscentIndex`). `AlgorithmParams` also gets an optional `startAscentIndex`, so `decompressionStatistics` (which swims an already calculated profile) can use the deco SP.
  - `EccrConsumption`: O2 = `Rebreathers.eccrO2Rate` × t; diluent as mCCR; bailout reserve.
- **Planner**: validation (descent ≤ bottom), appended to `r` after the mCCR options.
- **UI**: eCCR in the dropdown, three setpoints + switch depth (instead of the single mCCR setpoint).
- **Docs**: eCCR section.
- **E2E** `e2e/eccr.spec.ts` (page-object style of `e2e/startupSmoke.spec.ts`; add stable `id`s as needed):
  1. Complex view, choose **eCCR** in the tanks-card header dropdown.
  2. Tanks: diluent **18/45**, tank 2 CCR oxygen, bailout tanks **18/45**, **EAN50**, **oxygen**.
  3. Rebreather tab: descent and bottom setpoints **1.1**, deco setpoint **1.4**.
  4. Depth **60 m** (default bottom time).
  5. Assert **only**: the Consumed tab shows the **CCR oxygen tank consumed value**, and the Results tab `#total-dive-time-value` shows the expected runtime. Hardcode both values, taken from `BuhlmannAlgorithm.eccr.spec.ts` / `consumption.eccr.spec.ts` with the same inputs, cross-checked against a reference planner.
- **Stage 4 finish (issue #26 stays open)**: the same steps as "Stage 3 finish" (keyword check of the branch, `Part of #26` in the PR, issue still `OPEN` after the push), but tick the one task-list row of the issue description that mentions **eCCR**. When this stage gets its detailed tasks, copy them as a "Stage 4 finish" task with its own checkboxes.

### Stage 5: CCR results UI
- [ ] Status

Applies only when the circuit is not OC; OC views stay unchanged. Follows the shared rules.

#### 5a. Waypoints table: CCR / bailout profile tabs
- [ ] Status

- `plan/waypoints/waypoints.component.html`: when circuit ≠ OC, wrap the table in `mdb-tabs` "CCR profile" / "Bailout profile".
  - **CCR profile**: `stops.wayPoints`; the gas column shows the loop (diluent + setpoint; pSCR: supply gas).
  - **Bailout profile**: plan waypoints up to `dive.emergencyAscentStart`, followed by `dive.emergencyAscent` (`shared/diveresults.ts:71,87,171`, filled in `planner.service.ts:205-218` from the bailout emergency ascent: loop until the deepest point, open-circuit ascent). Built in a service, not the component. The stops-only filter applies to both tabs.
- Profile chart: the bailout tab switches on the existing emergency-ascent overlay (`showEmergencyAscent`, `shared/chartPlotter.ts:172`). Row highlighting works in both tabs.
- The selected tab is persisted. Specs in `waypoints.component.spec.ts`.

#### 5b. Results: consumed tanks grouped like the tanks card
- [ ] Status

- `plan/diveinfo/diveinfo.component.html` Consumed tab (`app-tankchart`): a **Rebreather** group (mCCR/eCCR: tank 1 **Diluent**, tank 2 **Oxygen**; pSCR: tanks assigned to levels, labelled **Supply**) and a **Bailout** group (the remaining tanks, reserve only).
- `tank-chart` gets an optional `@Input() roleLabel` (text stays in the template). The grouping lives in a service (`TanksService` `rebreatherTanks`/`bailoutTanks`). The by-gas view (`app-gaschart`) stays ungrouped. Specs in `diveinfo.component.spec.ts`.

#### 5c. New warning: loop ppO2 out of safe range
- [ ] Status

- **Lib**: `EventType.ppO2OutOfRange` (16) + `EventsFactory.createPpO2OutOfRange(timeStamp, depth, ppO2)`.
  - In `ProfileEvents.fromProfile` for non-OC models, evaluate `breathing.ppO2(...)`. Out of range means below `GasMixtures.minPpO2` (0.18), or above `maxPpO2` before `startAscentIndex` / `maxDecoPpO2` after it.
  - One event per contiguous out-of-range part (de-duplicated like `addHighPpO2`), carrying depth and ppO2.
  - Spec `ProfileEvents.ccr.spec.ts`.
- **Planner**: a `dive-issues` alert `@if (event.isPpO2OutOfRange)` showing time, depth, calculated ppO2 and the allowed range; event mapping in `diveresults.ts` / `IgnoredIssues`; i18n in 7 files; spec in `dive-issues.component.spec.ts`.

#### Stage 5 E2E
- [ ] Status

- Extend the eCCR scenario: both waypoints tabs are visible; the bailout tab lists rows ending at 0 m; the Consumed tab shows the "Diluent" and "Oxygen" labels.

## Verification
- [ ] Status

- Stage 1: Task 8 Step 7 (`test-lib-ci`, `lint`, `build-lib`, `test-ci`); no existing spec modified.
- Stages 2–5: lib specs plus a reference-planner sanity check (e.g. Subsurface/MultiDeco: 40 m/25 min, dil air, SP 1.3, GF 30/85, within a stop minute for eCCR/mCCR). Then `npm start` → complex view → tanks-card header dropdown → "Rebreather" tab. Check that the profile, CNS/OTU and loop/bailout consumption update immediately, the layout works at mobile width, a shared URL round-trips, and an old URL or stored preferences load as OC. Then `npm run e2e`.
