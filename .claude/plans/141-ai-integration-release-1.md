# AI Integration Release 1 (#141) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an AI plan a single-level open circuit dive with Dugong through an MCP server (`.mcpb`) or a Skill, both deployed with the app on GitHub Pages, computing through the same `scuba-physics` code as the app.

**Architecture:** `PlanningTasks`, `DtoSerialization`, the plan DTOs and the metric validation ranges move from `planner` into `scuba-physics`, which loses its Angular dependency. A new plain TypeScript project `projects/dugong-mcp` holds a transport-independent `src/core` (input schema, `planDive`, MCP server factory, CLI command dispatcher) and two thin host entry points (`src/stdio.ts`, `src/cli.ts`). `build/build-mcp.ps1` bundles them with esbuild into self-contained `.mjs` files, packs `dugong.mcpb` and `dugong-skill.zip`, and `build/deploy.ps1` publishes them at `https://dugong.online/ai/`.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk` (McpServer, StdioServerTransport, InMemoryTransport), `zod`, `esbuild`, `@anthropic-ai/mcpb` CLI, Vitest 4 (Node environment for `dugong-mcp`), PowerShell 7, Angular 22 (planner only).

**Spec:** `docs/superpowers/specs/2026-11-15-ai-integration-design.md` (Release 1 sections only).

## Global Constraints

- Branch `feature/141-ai-integration` (already created from latest `master`). Commit messages: Conventional Commits with `#141` before the summary, e.g. `refactor: #141 move PlanningTasks to scuba-physics`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before changing a file, fix its existing lint issues (`npx eslint <file>`) and commit that separately (`style:`/`refactor:`).
- `scuba-physics` must not import `@angular/*`, `lodash` or Node built-ins, and its `package.json` has no `@angular/*` peer dependencies.
- `projects/dugong-mcp/src/core/**` must not import `@angular/*` or Node built-ins (`fs`, `path`, `process`, `node:*`, …) and must not call `console.*` (stdout carries the MCP protocol). Only `src/stdio.ts` and `src/cli.ts` may use Node APIs, and they contain no logic.
- All build/package/version/deploy scripts are PowerShell in `build/`; npm scripts and the workflow only call them.
- Units on the wire are metric: meters, bars, liters, minutes, percent for gas content and gradient factors.
- Release 1 scope only: one open circuit dive, one depth level. No multilevel, repetitive, rebreather, calculators, share link, QR code or chart.
- Every `plan_dive` result carries the disclaimer, exact text: `None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.` It is the `disclaimerText` already shown in the app (`projects/planner/src/assets/i18n/en.json`), copied verbatim in English.
- Existing planner and library specs must pass unchanged, except for import paths of moved code. OC results stay identical.
- New UI text goes through `ngx-translate` with keys in all locale files (en, cs, de, es, fr, ru, zh; English as fallback).
- Lint: `npm run lint` (4-space indent, single quotes, semicolons, 140 chars).
- Single spec runs: library `npx ng test scuba-physics --no-watch --include='**/<name>.spec.ts'`, planner `npx ng test planner --no-watch --include='**/<name>.spec.ts'`, MCP `npx vitest run --config projects/dugong-mcp/vitest.config.mts <name>`.

## Review Focus

1. **Bottom time shorter than the descent** (e.g. 40 m for 1 min): the app plans a descent-only dive with a zero length bottom; `planDive` must return a plan, not throw (Task 8 test "bottom time shorter than descent still plans the dive").
2. **Not enough gas** (10 l tank, 60 m for 40 min): result with `hasReserve: false` and `endPressure` clamped at 0, never negative or an exception (Task 8 test "reports tanks without reserve").
3. **Plan the algorithm can't calculate** (e.g. 300 m on air for 1440 min): `errors` non-empty, no exception; the MCP tool still answers with a text naming the problem (Task 8 test "returns algorithm errors instead of throwing", Task 9 test "explains a plan which can't be calculated").
4. **Unbreathable gas** (trimix 10/70 as the only gas): the plan is calculated and the `lowPpO2` event is reported in `events` (Task 8 test "reports hypoxic gas event").
5. **Invalid gas content** (O2 + He above 100 %, He without O2 entered, zero depth): readable validation messages naming the field, for both MCP and CLI (Task 7 tests, Task 10 test "prints validation errors").

---

## File Structure

| File | Responsibility |
| --- | --- |
| Create `projects/dugong-mcp/tsconfig.json`, `vitest.config.mts`, `eslint.config.mjs` | Node project config, `scuba-physics` aliased to `dist/scuba-physics`, lint guard for `src/core`. |
| Create `projects/dugong-mcp/manifest.json` | `.mcpb` manifest. |
| Create `projects/dugong-mcp/skill/SKILL.md`, `skill/examples/air-30m.json` | Skill instructions and example input. |
| Create `projects/dugong-mcp/src/core/version.ts` | `serverVersion` constant replaced at bundle time. |
| Create `projects/dugong-mcp/src/core/server.ts` | `createServer(): McpServer` registering all tools. |
| Create `projects/dugong-mcp/src/core/commands.ts` | `executeCommand(...)`, CLI dispatcher without Node APIs. |
| Create `projects/dugong-mcp/src/core/planDiveInput.ts` | zod input schema of `plan_dive`. |
| Create `projects/dugong-mcp/src/core/planDive.ts` | `planDive(input)`: request DTOs → `PlanningTasks` → result. |
| Create `projects/dugong-mcp/src/core/planDiveResult.ts` | Result types, event texts, disclaimer, text summary. |
| Create `projects/dugong-mcp/src/core/planDiveTool.ts` | MCP tool `plan_dive` registration. |
| Create `projects/dugong-mcp/src/stdio.ts`, `src/cli.ts` | Host entry points. |
| Create `projects/scuba-physics/src/lib/workers/MetricRanges.ts` | `RangeConstants`, `MetricRanges` (moved). |
| Create `projects/scuba-physics/src/lib/workers/serialization.model.ts`, `DtoSerialization.ts`, `PlanningTasks.ts` | Moved plan DTOs, serialization, planning pipeline. |
| Modify `projects/planner/src/app/shared/serialization.model.ts` | Keeps only app DTOs (`AppPreferences`, `AppStates`, `AppPreferencesDto`, `DiveDto`, `AppOptionsDto`, `QuizSessionDto`) and computer worker DTOs (`ComputerRequestDto`, `CeilingDto`, `ComputerStartedDto`, `RunTimePointDto`, `ComputerPointDto`, `ComputerFinishedDto`, `ComputerResultDto`). |
| Create `build/build-mcp.ps1`, `build/verify-ai-downloads.ps1` | Bundle/pack, post-deploy check. |
| Modify `build/test.ps1`, `build/deploy.ps1`, `build/bump-version.ps1`, `.releaserc.json`, `.github/workflows/main.yml`, `package.json`, `angular.json` | Pipeline integration. |
| Create `doc/ai.md`; modify `mainmenu`, `help.component.ts`, i18n files, `README.md`, `e2e/` | Promotion. |

---

## Stage 1 — Skeleton

### Task 1: `dugong-mcp` project skeleton
- [x] Status

**Files:**
- Create: `projects/dugong-mcp/tsconfig.json`, `projects/dugong-mcp/vitest.config.mts`, `projects/dugong-mcp/eslint.config.mjs`, `projects/dugong-mcp/manifest.json`, `projects/dugong-mcp/skill/SKILL.md`, `projects/dugong-mcp/src/core/version.ts`, `projects/dugong-mcp/src/core/server.ts`, `projects/dugong-mcp/src/core/commands.ts`, `projects/dugong-mcp/src/stdio.ts`, `projects/dugong-mcp/src/cli.ts`
- Modify: `package.json` (devDependencies, scripts), `angular.json` (lint-only project)
- Test: `projects/dugong-mcp/src/core/server.spec.ts`, `projects/dugong-mcp/src/core/commands.spec.ts`

**Interfaces:**
- Produces:
  - `serverName = 'dugong'`, `serverVersion: string` (`version.ts`; `declare const __DUGONG_VERSION__: string | undefined;` → `typeof __DUGONG_VERSION__ === 'string' ? __DUGONG_VERSION__ : '0.0.0-dev'`).
  - `createServer(): McpServer` (`server.ts`).
  - `interface CommandResult { exitCode: number; output: string }`, `executeCommand(command: string | undefined, input: string): CommandResult` (`commands.ts`); unknown or missing command → `exitCode: 2`, `output` = usage text starting with `Usage: dugong <command>`.
  - npm scripts `test-mcp` (`vitest --config projects/dugong-mcp/vitest.config.mts`), `test-mcp-ci` (`vitest run --config projects/dugong-mcp/vitest.config.mts --coverage`, JUnit to `test-results/dugong-mcp`, Cobertura to `coverage/dugong-mcp`).

- [x] **Step 1: Install dev dependencies**

Run: `npm install --save-dev --legacy-peer-deps @modelcontextprotocol/sdk zod esbuild @anthropic-ai/mcpb`
Expected: all four in `devDependencies`; use the zod major the installed SDK version supports.

- [x] **Step 2: Add config files**

`tsconfig.json`: extends root `tsconfig.json`, `module`/`moduleResolution` `NodeNext`-compatible for the SDK subpath imports, `types: ["node"]`, includes `src/**/*.ts`. `vitest.config.mts`: `environment: 'node'`, `include: ['src/**/*.spec.ts']`, `resolve.alias` `scuba-physics` → `<root>/dist/scuba-physics` (like the root `tsconfig.json` paths; requires `npm run build-lib`), coverage provider `istanbul` like the other projects. `eslint.config.mjs`: extends root config with `parserOptions.project: ['projects/dugong-mcp/tsconfig.json']`, plus for `src/core/**/*.ts`: `no-restricted-imports` patterns `@angular/*`, `node:*`, `fs`, `path`, `os`, `child_process`, `process`; `no-restricted-globals` `process`, `require`, `Buffer`, `__dirname`; `no-console: 'error'`. `angular.json`: add project `dugong-mcp` (`projectType: library`, `root: projects/dugong-mcp`, `sourceRoot: projects/dugong-mcp/src`) with only a `lint` target (`eslintConfig: projects/dugong-mcp/eslint.config.mjs`, `lintFilePatterns: ['projects/dugong-mcp/**/*.ts']`).

- [x] **Step 3: Write the failing tests**

```ts
// server.spec.ts
it('starts with server name and version', async () => {
    const client = await connectClient(createServer()); // InMemoryTransport.createLinkedPair + Client.connect, helper in core/testing/client.testing.ts
    expect(client.getServerVersion()).toEqual({ name: 'dugong', version: '0.0.0-dev' });
});

// commands.spec.ts
it('prints usage for missing command', () => {
    const result = executeCommand(undefined, '');
    expect(result.exitCode).toBe(2);
    expect(result.output).toMatch(/^Usage: dugong <command>/);
});
```

- [x] **Step 4: Run tests to verify they fail**

Run: `npm run build-lib; npx vitest run --config projects/dugong-mcp/vitest.config.mts`
Expected: FAIL, modules `server`/`commands` not found.

- [x] **Step 5: Implement `version.ts`, `createServer()`, `executeCommand()`, `stdio.ts`, `cli.ts`**

`stdio.ts`: `await createServer().connect(new StdioServerTransport())`. `cli.ts`: read `process.argv[2]` as command, input from `--input <file>` or stdin, `process.stdout.write(result.output)`, `process.exitCode = result.exitCode`.

- [x] **Step 6: Add skeleton `manifest.json` and `SKILL.md`**

`manifest.json`: `manifest_version` of the installed `@anthropic-ai/mcpb`, `name: dugong`, `display_name: Dugong Gas Planner`, `version: 0.0.0` (stamped at release), `description`, `author: { name: 'Dugong', url: 'https://dugong.online' }`, `server: { type: 'node', entry_point: 'server/dugong-mcp.mjs', mcp_config: { command: 'node', args: ['${__dirname}/server/dugong-mcp.mjs'] } }`, `tools: []`. `SKILL.md`: frontmatter `name: dugong-dive-planner`, `description: Plans recreational and technical open circuit scuba dives ...`, a line `Version: 0.0.0`, body placeholder.

- [x] **Step 7: Verify**

Run: `npx vitest run --config projects/dugong-mcp/vitest.config.mts` → PASS; `npm run lint` → no errors (includes `dugong-mcp`); `npx mcpb validate projects/dugong-mcp/manifest.json` → valid.

- [x] **Step 8: Commit** — `chore: #141 dugong-mcp project skeleton`

---

## Stage 2 — Library refactoring (behavior preserving)

### Task 2: `scuba-physics` without Angular
- [x] Status

**Files:**
- Modify: `projects/scuba-physics/src/lib/calculators/altitudeCalculator.spec.ts`, `projects/scuba-physics/package.json`, `projects/scuba-physics/eslint.config.mjs`

- [x] **Step 1: Add the lint guard** — in `projects/scuba-physics/eslint.config.mjs` add `no-restricted-imports` patterns `@angular/*`, `lodash`, `node:*`, `fs`, `path`, `os`, `child_process`, `process` and `no-restricted-globals` `process`, `require`, `Buffer`, `__dirname`.
- [x] **Step 2: Run lint to verify it fails** — `npx ng lint scuba-physics` → error in `altitudeCalculator.spec.ts` (`@angular/core/testing`).
- [x] **Step 3: Rewrite `altitudeCalculator.spec.ts`** creating `new AltitudeCalculator()` directly instead of `TestBed.inject`; all expectations unchanged.
- [x] **Step 4: Remove `peerDependencies`** (`@angular/common`, `@angular/core`) from `projects/scuba-physics/package.json`.
- [x] **Step 5: Verify** — `npx ng lint scuba-physics` clean; `npm run test-lib-ci` PASS; `npm run build-lib` PASS; `npm run test-ci` PASS.
- [x] **Step 6: Commit** — `refactor: #141 scuba-physics without Angular dependency`

### Task 3: Metric ranges in the library
- [x] Status

**Files:**
- Create: `projects/scuba-physics/src/lib/workers/MetricRanges.ts`, `projects/scuba-physics/src/lib/workers/MetricRanges.spec.ts`
- Modify: `projects/scuba-physics/src/public-api.ts`, `projects/planner/src/app/shared/UnitConversion.ts`, planner files importing `RangeConstants`

**Interfaces:**
- Produces: `interface RangeConstants` (moved unchanged, uses lib `Units`), `class MetricRanges implements RangeConstants` (moved unchanged, uses lib `MetricUnits`), both exported from `public-api.ts`. `ImperialRanges` stays in `UnitConversion.ts`; `UnitConversion.createMetricRanges()` returns `new MetricRanges()` from `scuba-physics`.

- [x] **Step 1: Write the failing test**

```ts
describe('MetricRanges', () => {
    const ranges = new MetricRanges();
    it('depth', () => expect(ranges.depth).toEqual([0, 350]));
    it('tank size', () => expect(ranges.tankSize).toEqual([1, 50]));
    it('rmv', () => expect(ranges.diverRmv).toEqual([5, 90]));
    it('labels in metric units', () => expect(ranges.depthLabel).toBe('0 - 350 m'));
});
```

- [x] **Step 2: Run to verify it fails** — single library spec run → FAIL, `MetricRanges` not found.
- [x] **Step 3: Move `RangeConstants`, `toLabel`, `perMinute` and `MetricRanges`** to `MetricRanges.ts`, export them, update planner imports.
- [x] **Step 4: Verify** — library spec PASS; `npm run build-lib`; `npm run test-ci` PASS; `npm run lint` clean.
- [x] **Step 5: Commit** — `refactor: #141 move metric ranges to scuba-physics`

### Task 4: Plan DTOs in the library
- [ ] Status

**Files:**
- Create: `projects/scuba-physics/src/lib/workers/serialization.model.ts`
- Modify: `projects/planner/src/app/shared/serialization.model.ts`, `projects/scuba-physics/src/public-api.ts`, planner files importing moved DTOs

**Interfaces:**
- Produces (exported from `scuba-physics`, definitions moved unchanged): `ITankBound`, `PlanRequestDto`, `ProfileRequestDto`, `DiveInfoRequestDto`, `CnsExposureDto`, `EventOptionsDto`, `DiveInfoResultDto`, `DensityDto`, `ProfileResultDto`, `EventDto`, `CalculatedProfileDto`, `LoadedTissueDto`, `ConsumptionRequestDto`, `ConsumptionOptionsDto`, `ConsumedDto`, `ConsumedGasDto`, `ConsumptionResultDto`, `TankDto`, `SegmentDto`, `GasDto`, `DiverDto`, `AirBreaksDto`, `OptionsDto`, `RebreatherDto`.

- [ ] **Step 1: Move the interfaces**; planner files import them from `scuba-physics` directly (no re-export from the planner model).
- [ ] **Step 2: Verify** — `npm run build-lib`; `npm run test-ci` PASS unchanged; `npm run lint` clean.
- [ ] **Step 3: Commit** — `refactor: #141 move plan DTOs to scuba-physics`

### Task 5: `DtoSerialization` in the library
- [ ] Status

**Files:**
- Create: `projects/scuba-physics/src/lib/workers/DtoSerialization.ts`
- Move: `projects/planner/src/app/shared/dtoSerialization.rebreather.spec.ts`, `dtoSerialization.tissues.spec.ts` → `projects/scuba-physics/src/lib/workers/`
- Delete: `projects/planner/src/app/shared/dtoSerialization.ts`
- Modify: `public-api.ts`, planner importers

**Interfaces:**
- Produces: `class DtoSerialization` exported from `scuba-physics`, public static API unchanged (`toTanks`, `fromTanks`, `toConsumed`, `fromConsumedGases`, `toConsumedGases`, `toSegments`, `fromSegments`, `toProfile`, `fromProfile`, `toTissues`, `packTissuesHistory`, `unpackTissuesHistory`, `tissuesHistorySamples`, `fromTissues`, `toEvents`, `fromEvents`, `fromDiver`, `toDiver`, `fromOptions`, `toOptions`, `fromDensity`, `toDensity`, `toGas`, `fromGas`).

- [ ] **Step 1: Move the two specs** to the library and run them → FAIL, `DtoSerialization` not in the library. Specs keep their assertions; only imports and planner-only test helpers change (replace a planner helper by building the objects directly).
- [ ] **Step 2: Move `DtoSerialization`**, replacing `_(tissues).map(...)` by native `tissues.map(...)` (no `lodash`).
- [ ] **Step 3: Verify** — moved specs PASS in `npm run test-lib-ci`; `npm run build-lib`; `npm run test-ci` PASS; `npm run lint` clean.
- [ ] **Step 4: Commit** — `refactor: #141 move DtoSerialization to scuba-physics`

### Task 6: `PlanningTasks` in the library
- [ ] Status

**Files:**
- Create: `projects/scuba-physics/src/lib/workers/PlanningTasks.ts`, `PlanningTasks.spec.ts`
- Delete: `projects/planner/src/app/workers/planning.tasks.ts`
- Modify: `public-api.ts`, `profile.worker.ts`, `diveInfo.worker.ts`, `consumption.worker.ts`, `computer.tasks.ts`, `computer.tasks.spec.ts`

**Interfaces:**
- Produces: `class PlanningTasks` exported from `scuba-physics`, unchanged static API: `calculateDecompression(task: ProfileRequestDto): ProfileResultDto`, `diveParameters(task: PlanRequestDto): AlgorithmParams`, `diveInfo(task: DiveInfoRequestDto): DiveInfoResultDto`, `calculateConsumption(task: ConsumptionRequestDto): ConsumptionResultDto`.

- [ ] **Step 1: Write the failing spec** (`PlanningTasks.spec.ts`, builds a 30 m / 20 min air plan with `PlanFactory.createPlan` and `new Options()`):

```ts
it('calculates the profile ending at the surface without errors', () => {
    const result = PlanningTasks.calculateDecompression(request);
    expect(result.profile.errors).toEqual([]);
    expect(result.profile.segments.at(-1)?.endDepth).toBe(0);
});
it('dive info no deco limit is longer than the dive', () => {
    expect(PlanningTasks.diveInfo(infoRequest).noDeco).toBeGreaterThan(20);
});
it('consumption consumes gas from the tank', () => {
    expect(PlanningTasks.calculateConsumption(consumptionRequest).tanks[0].consumedVolume).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL, `PlanningTasks` not found.
- [ ] **Step 3: Move `PlanningTasks`**, imports switched to relative library imports.
- [ ] **Step 4: Verify** — `npm run test-lib-ci` PASS; `npm run build-lib`; `npm run test-ci` PASS; `npm run e2e` PASS (workers still compute); `npm run lint` clean.
- [ ] **Step 5: Commit** — `refactor: #141 move PlanningTasks to scuba-physics`

---

## Stage 3 — Dive planning as MCP tool and Skill

### Task 7: `plan_dive` input schema
- [ ] Status

**Files:**
- Create: `projects/dugong-mcp/src/core/planDiveInput.ts`, `planDiveInput.spec.ts`

**Interfaces:**
- Produces: `planDiveInputSchema` (zod object) and `type PlanDiveInput = z.infer<typeof planDiveInputSchema>`:

```ts
{
    depth: number;                    // m, MetricRanges.depth, must be > 0
    bottomTime: number;               // min, MetricRanges.duration, as the app's simple plan duration (includes descent)
    tanks: {                          // min 1; first = bottom gas, others = deco gases
        size: number;                 // l, MetricRanges.tankSize
        startPressure: number;        // bar, MetricRanges.tankPressure
        o2: number;                   // %, MetricRanges.trimixOxygen
        he?: number;                  // %, MetricRanges.tankHe, default 0; o2 + he <= 100
    }[];
    options?: {
        gfLow?: number; gfHigh?: number;            // %, 10-120 (ValidatorGroups.minGradient/maxGradient), gfLow <= gfHigh
        salinity?: 'fresh' | 'brackish' | 'salt';
        altitude?: number;                          // m, MetricRanges.altitude
        maxPpO2?: number; maxDecoPpO2?: number;     // bar, MetricRanges.ppO2
        ascentSpeed50perc?: number; ascentSpeed50percTo6m?: number; ascentSpeed6m?: number; descentSpeed?: number; // m/min, MetricRanges.speed
        lastStopDepth?: number;                     // m, MetricRanges.lastStopDepth
        safetyStop?: 'never' | 'auto' | 'always';
        gasSwitchDuration?: number; problemSolvingDuration?: number; // min, 1-100 (ValidatorGroups.duration100)
    };
    diver?: { rmv?: number; stressRmv?: number };   // l/min, MetricRanges.diverRmv
}
```
  Every field has a `.describe()` text with unit and default (used as the MCP tool input documentation). Unknown fields are rejected (`strict`), so Release 2 additions stay explicit.

- [ ] **Step 1: Write the failing tests**

```ts
it('accepts minimal air dive', () => {
    expect(planDiveInputSchema.safeParse({ depth: 30, bottomTime: 20, tanks: [{ size: 15, startPressure: 200, o2: 21 }] }).success).toBe(true);
});
it('rejects o2 and he above 100 %', () => expectError({ ...air, tanks: [{ size: 15, startPressure: 200, o2: 50, he: 60 }] }, 'tanks.0'));
it('rejects zero depth', () => expectError({ ...air, depth: 0 }, 'depth'));
it('rejects depth deeper than 350 m', () => expectError({ ...air, depth: 351 }, 'depth'));
it('rejects missing tanks', () => expectError({ ...air, tanks: [] }, 'tanks'));
it('rejects gfLow above gfHigh', () => expectError({ ...air, options: { gfLow: 90, gfHigh: 80 } }, 'options'));
it('rejects unknown field', () => expectError({ ...air, levels: [] }, ''));
// expectError(input, path): safeParse fails and an issue path joined by '.' starts with `path`, message non-empty
```

- [ ] **Step 2: Run to verify they fail** → FAIL, module not found.
- [ ] **Step 3: Implement `planDiveInputSchema`** with ranges read from `new MetricRanges()` (no duplicated numbers except the gradient and duration100 limits, commented with their planner source).
- [ ] **Step 4: Verify** — tests PASS; `npm run lint` clean.
- [ ] **Step 5: Commit** — `feat: #141 plan_dive input schema`

### Task 8: `planDive` core function
- [ ] Status

**Files:**
- Create: `projects/dugong-mcp/src/core/planDiveResult.ts`, `projects/dugong-mcp/src/core/planDive.ts`, `planDive.spec.ts`

**Interfaces:**
- Consumes: `PlanDiveInput` (Task 7), `PlanningTasks`, `DtoSerialization`, DTOs (Tasks 4–6), `PlanFactory`, `Options`, `OptionDefaults`, `Diver`, `Tank`, `Consumption.defaultPrimaryReserve` (30 bar), `Consumption.defaultStageReserve` (20 bar), `GasDensity.recommendedMaximum` (5.7 g/l).
- Produces (`planDiveResult.ts`):

```ts
export const disclaimer = 'None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.';
export interface PlanDiveResult {
    noDecoDive: boolean;          // bottomTime <= noDecoLimit
    noDecoLimit: number;          // min
    runtime: number;              // min, whole calculated profile
    timeToSurface: number;        // min, emergency ascent from ConsumptionResultDto
    maxDepth: number; averageDepth: number; // m
    decoStops: { depth: number; duration: number; gas: string }[]; // flat ascent segments after startAscentIndex, incl. safety stop; min
    tanks: { index: number; gas: string; size: number; startPressure: number; endPressure: number;
             reservePressure: number; consumedVolume: number; hasReserve: boolean }[];
    cns: number; otu: number;     // %, OTU
    maxDensity: { density: number; depth: number; gas: string }; // g/l, m
    events: { type: string; runtime: number; depth: number; message: string }[]; // min, m; type = EventType key name
    errors: string[];             // algorithm errors, plan not calculated when non-empty
    disclaimer: string;
}
export function summaryText(result: PlanDiveResult): string; // English, few lines: runtime, deco/no-deco, stops, gas per tank, CNS/OTU, warnings, disclaimer last
```
  `planDive(input: PlanDiveInput): PlanDiveResult` (`planDive.ts`). Rounding: minutes and pressures to 1 decimal place, CNS/OTU to whole numbers (`Precision.round`).

- [ ] **Step 1: Write the failing tests** — reference values are computed in the test by running `PlanningTasks` exactly as the planner does (helper `appReference(input)` in `planDive.testing.ts` building `PlanRequestFactory`-equivalent DTOs, `previousCns: 0`, `previousCnsExposures: []`, `surfaceInterval: Number.POSITIVE_INFINITY` as a first dive in the app — check `DiveSchedules` for the exact first-dive value):

```ts
it('no deco air dive matches the app', () => {
    const result = planDive(air30m20min);
    const app = appReference(air30m20min);
    expect(result.noDecoDive).toBe(true);
    expect(result.runtime).toBe(app.runtime);
    expect(result.tanks[0].endPressure).toBe(app.tanks[0].endPressure);
});
it('nitrox deco dive with deco gas matches the app stops', ...);     // 40 m/35 min EAN28 + EAN50 → decoStops equal, gas switch to EAN50
it('trimix deco dive matches the app', ...);                         // 60 m/20 min 18/45 + 50 % → stops, cns, otu equal
it('uses app defaults for a new dive', ...);                         // fresh water, safety stop auto, GF 40/85, rmv 20
it('bottom time shorter than descent still plans the dive', ...);    // 40 m, 1 min → errors [], runtime > 0
it('reports tanks without reserve', ...);                            // 10 l, 60 m, 40 min → hasReserve false, endPressure >= 0
it('returns algorithm errors instead of throwing', ...);             // 300 m air 1440 min → errors.length > 0
it('reports hypoxic gas event', ...);                                // 10/70 only → events contains type 'lowPpO2'
it('carries the disclaimer', ...);                                   // result.disclaimer === disclaimer
it('summary text ends with the disclaimer', ...);
```

- [ ] **Step 2: Run to verify they fail** → FAIL, module not found.
- [ ] **Step 3: Implement `planDive`**

Mapping decisions:
  - Options: `new Options()`, then `salinity = Salinity.fresh`, `safetyStop = SafetyStop.auto` (as `OptionsService` constructor), then input overrides; gradient percent → fraction.
  - Tanks: `TankDto` ids 1..n, `workPressure: 0` (metric input has no working pressure; it matters only for imperial units, can be added later), gas from o2/he percent.
  - Plan: `PlanFactory.createPlan(depth, bottomTime, firstTank, options)` → `DtoSerialization.fromSegments`.
  - `isComplex = tanks.length > 1 || tanks.some(t => (t.he ?? 0) > 0)` (the app needs the complex view for these).
  - Event options `maxDensity: GasDensity.recommendedMaximum`; consumption options reserves `Consumption.defaultPrimaryReserve`/`defaultStageReserve`.
  - Tank results: `DtoSerialization.toTanks`, apply `ConsumedDto` volumes, read `endPressure`, `reserve`, `hasReserve`.
  - Event messages: English texts of the app's event messages from `projects/planner/src/assets/i18n/en.json`, kept as a map `EventType → text` in `planDiveResult.ts`.
  - When `ProfileResultDto.profile.errors` is non-empty, skip dive info/consumption and return `errors` with the remaining fields zeroed/empty.

- [ ] **Step 4: Verify** — tests PASS; `npm run lint` clean.
- [ ] **Step 5: Commit** — `feat: #141 plan single level dive in dugong-mcp core`

### Task 9: MCP tool `plan_dive`
- [ ] Status

**Files:**
- Create: `projects/dugong-mcp/src/core/planDiveTool.ts`, `planDiveTool.spec.ts`
- Modify: `projects/dugong-mcp/src/core/server.ts`, `projects/dugong-mcp/manifest.json` (`tools: [{ name: 'plan_dive', description }]`)

**Interfaces:**
- Consumes: `planDiveInputSchema`, `planDive`, `summaryText`.
- Produces: `registerPlanDive(server: McpServer): void`; tool `plan_dive`, title `Plan a scuba dive`, description: what it plans (single level open circuit, Bühlmann ZHL-16C with gradient factors), units, and the instruction "Always show the disclaimer to the user and never present the plan as authoritative.". Result: `content: [{ type: 'text', text: summaryText(result) }]`, `structuredContent: result` (with matching `outputSchema`).

- [ ] **Step 1: Write the failing tests** (in-memory client from Task 1):

```ts
it('lists plan_dive tool', async () => expect((await client.listTools()).tools.map(t => t.name)).toEqual(['plan_dive']));
it('plans a dive', async () => {
    const response = await client.callTool({ name: 'plan_dive', arguments: air30m20min });
    expect(response.isError).toBeFalsy();
    expect(response.structuredContent).toEqual(planDive(air30m20min));
});
it('rejects invalid input with readable message', async () => {
    const response = await client.callTool({ name: 'plan_dive', arguments: { ...air30m20min, depth: 0 } });
    expect(response.isError).toBe(true);
    expect(JSON.stringify(response.content)).toContain('depth');
});
it('explains a plan which can\'t be calculated', ...); // 300 m air → text contains the error message, isError false
```

- [ ] **Step 2: Run to verify they fail** → FAIL.
- [ ] **Step 3: Implement `registerPlanDive`** and call it from `createServer`.
- [ ] **Step 4: Verify** — tests PASS; `npx mcpb validate projects/dugong-mcp/manifest.json`; `npm run lint` clean.
- [ ] **Step 5: Commit** — `feat: #141 plan_dive MCP tool`

### Task 10: Skill command `plan_dive`
- [ ] Status

**Files:**
- Modify: `projects/dugong-mcp/src/core/commands.ts`, `commands.spec.ts`, `projects/dugong-mcp/skill/SKILL.md`
- Create: `projects/dugong-mcp/skill/examples/air-30m.json`

**Interfaces:**
- Consumes: `planDiveInputSchema`, `planDive`.
- Produces: `executeCommand('plan_dive', json)` → `exitCode 0`, `output = JSON.stringify(planDive(input), null, 2)`; invalid JSON or schema → `exitCode 1`, `output = JSON.stringify({ errors: string[] }, null, 2)` with one `path: message` entry per issue.

- [ ] **Step 1: Write the failing tests**

```ts
it('plans dive from json input', () => {
    const result = executeCommand('plan_dive', JSON.stringify(air30m20min));
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.output)).toEqual(planDive(air30m20min));
});
it('prints validation errors', () => {
    const result = executeCommand('plan_dive', JSON.stringify({ ...air30m20min, depth: 0 }));
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.output).errors[0]).toMatch(/^depth: /);
});
it('prints error for invalid json', () => expect(executeCommand('plan_dive', '{').exitCode).toBe(1));
it('example input is valid', ...); // skill/examples/air-30m.json imported as JSON passes planDiveInputSchema
```

- [ ] **Step 2: Run to verify they fail** → FAIL.
- [ ] **Step 3: Implement the command and write `SKILL.md`**: when to use (planning an open circuit single level dive, gas consumption, deco stops), how to run (`node scripts/dugong.mjs plan_dive --input <file>` or JSON on stdin), the input fields with units and defaults (same texts as the schema descriptions), the example file, the output fields, the rule to always show `disclaimer`, and what it can't do in this version (multilevel, repetitive, rebreathers, calculators).
- [ ] **Step 4: Verify** — tests PASS; `npm run lint` clean.
- [ ] **Step 5: Commit** — `feat: #141 plan_dive Skill command`

---

## Stage 4 — Build pipeline

### Task 11: Bundle and package script
- [ ] Status

**Files:**
- Create: `build/build-mcp.ps1`
- Modify: `package.json` (script `build-mcp`: `pwsh ./build/build-mcp.ps1`), `.gitignore` if `dist/` isn't ignored already

**Interfaces:**
- Produces in `dist/dugong-mcp/`: `bundle/manifest.json`, `bundle/server/dugong-mcp.mjs`, `dugong.mcpb`, `skill/SKILL.md`, `skill/scripts/dugong.mjs`, `skill/examples/air-30m.json`, `dugong-skill.zip` (zip root folder `dugong-dive-planner/`).

- [ ] **Step 1: Write `build/build-mcp.ps1`** (`$ErrorActionPreference = 'Stop'`, exit on non-zero `$LASTEXITCODE` like the other scripts):
  1. `npm run build-lib`.
  2. Read `version` from `projects/dugong-mcp/manifest.json`.
  3. `npx esbuild projects/dugong-mcp/src/stdio.ts` and `.../cli.ts` with `--bundle --platform=node --format=esm --target=node20 --define:__DUGONG_VERSION__='"<version>"'`, `scuba-physics` resolved to `dist/scuba-physics` (`--alias:scuba-physics=./dist/scuba-physics`), outputs as above.
  4. Copy manifest, `npx mcpb pack dist/dugong-mcp/bundle dist/dugong-mcp/dugong.mcpb`.
  5. Copy skill files, `Compress-Archive` into `dugong-skill.zip`.
  6. Smoke: `Get-Content projects/dugong-mcp/skill/examples/air-30m.json | node dist/dugong-mcp/skill/scripts/dugong.mjs plan_dive` must exit 0 and its output must contain `"runtime"`; fail the script otherwise.
- [ ] **Step 2: Run** `npm run build-mcp` → all files exist, smoke passes, `npx mcpb info dist/dugong-mcp/dugong.mcpb` shows name `dugong` and version.
- [ ] **Step 3: Manual check with Claude** — run rounds 1 (MCP server) and 2 (Skill) of the spec section "Manual testing with Claude (Release 1)" with its test prompts. Note the result in the commit body. Round 3 (downloads from the deployed site) runs after the first release from `master`, outside this plan.
- [ ] **Step 4: Commit** — `build: #141 bundle MCP server and Skill`

### Task 12: Workflow integration
- [ ] Status

**Files:**
- Create: `build/verify-ai-downloads.ps1`
- Modify: `build/test.ps1`, `build/bump-version.ps1`, `build/deploy.ps1`, `.releaserc.json`, `.github/workflows/main.yml`

- [ ] **Step 1: Tests in CI** — `build/test.ps1`: after `install-lib.ps1`, run `npm run test-mcp-ci`. Workflow: add `coverage/dugong-mcp/cobertura.xml` to the coverage summary file list (JUnit already matched by `test-results/**/*.xml`).
- [ ] **Step 2: Versioning** — `build/bump-version.ps1` sets `version` in `projects/dugong-mcp/manifest.json` and the `Version: x.y.z` line in `projects/dugong-mcp/skill/SKILL.md`, failing when either isn't found; add both files to `@semantic-release/git` `assets` in `.releaserc.json`. Run `pwsh ./build/bump-version.ps1 -Version 9.9.9` locally → both files changed; revert with `git checkout -- .`.
- [ ] **Step 3: Deploy** — `build/deploy.ps1`: after `npm run build`, run `build/build-mcp.ps1` and copy `dugong.mcpb` and `dugong-skill.zip` to `dist/planner/ai/`; in the gh-pages worktree also remove the old `ai` folder before copying. `ngsw-config.json` stays unchanged (no asset group matches `/ai/*`, and navigation requests with a file extension aren't served `index.html`); verify `dist/planner/ngsw.json` doesn't list `/ai/`.
- [ ] **Step 4: Post-deploy check** — `build/verify-ai-downloads.ps1 -SiteUrl <url> -ExpectedVersion <version>`: downloads `<url>/ai/dugong.mcpb` and `<url>/ai/dugong-skill.zip` (cache-busted), fails unless both start with the zip signature `PK` and `manifest.json` inside the `.mcpb` has `version` = expected. Workflow: run it after "Wait for deployment to go live", before the Playwright smoke test (the rollback step covers its failure). Run it locally against `npx http-server -p 9090 dist/planner` after copying the files there.
- [ ] **Step 5: Verify** — `pwsh ./build/test.ps1` PASS locally; `npm run lint` clean.
- [ ] **Step 6: Commit** — `ci: #141 test, version and deploy MCP server and Skill`

---

## Stage 5 — Promotion

### Task 13: Help page, menu entry, README
- [ ] Status

**Files:**
- Create: `doc/ai.md`, `e2e/aiIntegration.spec.ts`
- Modify: `projects/planner/src/app/mainmenu/mainmenu.component.html`, `mainmenu.component.spec.ts`, `projects/planner/src/app/help/help.component.ts`, `projects/planner/src/assets/i18n/{en,cs,de,es,fr,ru,zh}.json`, `README.md`

**Interfaces:**
- Produces: route `/help/ai`; i18n keys `menu.useWithAi` (en: `Use with AI`) and `help.menu.application.ai` (en: `Use with AI`); download links `ai/dugong.mcpb` and `ai/dugong-skill.zip` in `doc/ai.md` with ids `download-mcpb`/`download-skill` (or link texts the E2E test can locate).

- [ ] **Step 1: Write the failing component test** (`mainmenu.component.spec.ts`): the menu contains a link with text `Use with AI` whose `href` ends with `/help/ai`.
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Add the menu item** `<li><a class="nav-link" [routerLink]="['/help', 'ai']">{{ 'menu.useWithAi' | translate }}</a></li>` after Help, the help sidebar item `{ label: 'help.menu.application.ai', path: 'ai' }` in the application group, and both keys in all locale files (English fallback where no translation is known).
- [ ] **Step 4: Write `doc/ai.md`**: what it is, the disclaimer, Release 1 limits, install for Claude Desktop (download `.mcpb`, double-click or Settings → Extensions → Install Extension), Claude Code / other MCP clients (unzip the `.mcpb` and run `claude mcp add dugong -- node <folder>/server/dugong-mcp.mjs`, plus the JSON config snippet), Skill (download zip, upload in claude.ai Settings → Capabilities → Skills, or unzip into `~/.claude/skills/`), example prompts.
- [ ] **Step 5: Write the E2E happy path** (`e2e/aiIntegration.spec.ts`): open `/`, click menu `Use with AI`, the help page shows the AI document heading and both download links point to `ai/dugong.mcpb` and `ai/dugong-skill.zip`.
- [ ] **Step 6: README** — short "Use Dugong from your AI" section linking to the help page and the downloads.
- [ ] **Step 7: Verify** — `npm run test-ci` PASS; `npm run e2e` PASS; `npm run lint` clean.
- [ ] **Step 8: Commit** — `feat: #141 promote AI integration in the app`

---

## Final review

- [ ] Whole-branch review per CLAUDE.md workflow step 4 (`superpowers:requesting-code-review`, merge-base with `master` to `HEAD`, with this plan, its Review Focus and the spec), fix Critical and Important findings test-first, then stop for the owner's review.
