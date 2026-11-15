# AI integration (MCP server + Skill) — design

Issue: [#141 AI integration/MCP](https://github.com/jirkapok/GasPlanner/issues/141)
Branch: `feature/141-ai-integration`

## Intent

Divers should be able to use Dugong's dive planning from their AI assistant ("use this planning tool from any app").
An AI asks for a plan in structured form, gets the same numbers the app would show, explains them, and hands the user
a link that opens the same plan in <https://dugong.online>.

This first delivery covers **open circuit dive planning only, including multilevel and repetitive dives**.
The other calculators (SAC, Nitrox, NDL, altitude, weight,
gas properties, blender, redundancies) follow later using the same pattern.

## Goals

- An MCP server exposing a `plan_dive` tool, runnable locally (stdio) and distributed as a `.mcpb` bundle
  (one-click install in Claude Desktop) hosted on GitHub Pages next to the app.
- A Skill (`SKILL.md` + bundled script) giving the same planning capability without MCP, distributed as a zip on GitHub Pages.
- MCP server, Skill and app compute results through one shared implementation in `scuba-physics`.
- The existing GitHub workflow tests, builds, versions and deploys both artifacts with every release.
- The app tells users that and how they can use Dugong from their AI.

## Non-goals (this plan)

- Calculators other than dive planning.
- Rebreather (CCR/pSCR) dives.
- Share URL holding a whole series of repetitive dives.
- Remote hosting (Cloudflare Worker). Not confirmed yet; the design keeps it possible without refactoring.
- Publishing to npm or the MCP registry, signing the `.mcpb`, Anthropic extension directory listing, auto-update.
- WebMCP (`navigator.modelContext`) in the PWA.

## Anti-goals (failure even if it works)

- The MCP/Skill returns different results than the app for the same dive.
- Existing share URLs stop loading or change format.
- `scuba-physics` gains a dependency on Angular or on Node-only APIs.
- Results presented as authoritative: every result must carry the safety disclaimer.
- Worker performance regression in the app caused by the refactoring.

## Constraints

- `scuba-physics` must not depend on or install any Angular package (remove `peerDependencies` on `@angular/*`),
  must not use Node-only APIs (`fs`, `path`, `process`, …) and must not pull `lodash` (replace by native code in moved files).
  `ng-packagr` stays as the build tool, it is not a runtime dependency.
- The MCP and Skill code must not depend on Angular or use Node-only APIs (decided by the owner), so it can later run
  in a Cloudflare Worker unchanged. The only exception are the two thin entry points (`stdio.ts`, `cli.ts`): reading
  stdin/stdout is inherently a host API. They contain no logic, only wire the host's streams to the core, and are the
  parts a Worker entry would replace. A lint rule/test guards that `src/core` imports no `@angular/*` nor Node built-ins.
- Tools are stateless; each call carries the complete dive.
- Units on the wire are metric/SI (meters, bars, liters, minutes); the share URL is always metric (as today).
- Project conventions apply: TDD (unit tests for library, Vitest), `npm run lint` clean, Conventional Commits with `#141`,
  TypeScript or PowerShell for scripts, docs/help in `doc/`, i18n for any UI text.

## Approaches considered

- **A. Plain Node/TypeScript project in this repo** (`projects/dugong-mcp`, esbuild bundles) — **chosen**.
  Matches how MCP servers are built, one bundle runs in Claude Desktop, `npx`, Skills and Workers,
  library and server change in one PR with one version. Cost: a second small toolchain next to Angular.
- **B. Project inside the Angular workspace** — Angular builders target browser apps/libraries, not Node CLI bundles;
  `.mcpb` packaging needs custom scripts anyway. Rejected.
- **C. Separate repository** — every library change needs release + bump in the other repo, versions drift,
  works against one shared implementation. Rejected.

## Design by stage (stages decided by the owner)

### Stage 1 — Skeleton

```text
projects/dugong-mcp/
  src/core/          tool definitions, schemas, handlers (transport independent, no Node-only APIs)
  src/stdio.ts       MCP stdio entry point (Claude Desktop .mcpb, Claude Code, npx)
  src/cli.ts         command-line entry used by the Skill
  skill/SKILL.md     Skill instructions
  manifest.json      .mcpb manifest
  build.ts           bundling + packaging script (run directly by Node, type stripping)
  tsconfig*.json, vitest config (Node environment), eslint config
```

- Dependencies (`@modelcontextprotocol/sdk`, `zod`, `esbuild`, `@anthropic-ai/mcpb`) are added to the root `package.json`
  as devDependencies; bundles are self-contained, so the artifacts have no runtime dependencies. *(builder's call — keeps
  one `npm install` in CI)*
- Root npm scripts: `build-mcp`, `test-mcp`, `test-mcp-ci`. `npm run lint` covers the new project.
- Skeleton: the stdio server starts and lists no tools; the CLI prints usage. Both covered by a smoke test.

### Stage 2 — Library refactoring (behavior preserving)

- Move into `scuba-physics` (new folder, e.g. `lib/serialization/`, exported from `public-api.ts`):
  - plan-related DTOs from `serialization.model.ts` (`PlanRequestDto`, `ProfileRequestDto/ResultDto`,
    `DiveInfoRequestDto/ResultDto`, `ConsumptionRequestDto/ResultDto`, `TankDto`, `SegmentDto`, `GasDto`, `DiverDto`,
    `OptionsDto`, `RebreatherDto`, `AirBreaksDto`, tissue/CNS/event DTOs, computer DTOs as needed by `ComputerTasks`),
  - `DtoSerialization`,
  - `PlanningTasks`.
- App-only DTOs stay in planner (`AppPreferences`, `AppStates`, `AppPreferencesDto`, `DiveDto`, `AppOptionsDto`,
  `QuizSessionDto`, anything referencing `ViewState`) and import the moved types from `scuba-physics`.
- Add a pure **share URL encoder** to the library (dive DTOs → `t=…&de=…&di=…&o=…[&r=…]&ao=…` query, the static
  `to*Param` functions of `PlanUrlSerialization`). `PlanUrlSerialization` in the app delegates to it; URL parsing stays in
  the app. Existing `PlanUrlSerialization.spec.ts` must pass unchanged — this is the guard against changed URLs.
- Workers (`profile`, `diveInfo`, `consumption`, `computer`) and `ComputerTasks` import from `scuba-physics`.
- Remove `@angular/*` from `projects/scuba-physics/package.json` `peerDependencies`; rewrite
  `altitudeCalculator.spec.ts` without `TestBed`. Add a guard (lint rule or test) that library sources import neither
  `@angular/*`, `lodash` nor Node built-ins.
- Existing planner and library tests are the safety net; moved code gets its specs moved with it.

### Stage 3 — Dive planning as MCP tool and Skill

- Scope (decided by the owner): **open circuit only**, **multilevel** dives and **repetitive** dives (series of dives
  with surface intervals), **no calculators**.
- One shared core function `planDives(input) → result` in `src/core`, used by the MCP tool and the CLI,
  so both return identical JSON. For each dive in order it maps the input to `PlanRequestDto`, runs `PlanningTasks`
  (profile → dive info → consumption) and maps the DTOs to the output below. A repetitive dive gets the previous dive's
  tissues (`previousTissues`), surface interval, `previousCns` and `previousCnsExposures` exactly as the app's
  `DiveSchedules`/`PlanRequestFactory` pass them (builder verifies against the app's repetitive dive flow).
- **Input** (zod schema, metric): `dives[]` (one or more), shared optional `options` and `diver`; each dive has:
  - `surfaceInterval` (min) before the dive — required for every dive except the first,
  - `tanks[]`: size (l), working pressure (bar), start pressure (bar), O2 %, He %; first tank is the bottom gas,
  - `levels[]`: depth (m), duration (min) and optional tank index of each planned level (as the app's complex plan
    segments — a single level is the simple plan, more levels a multilevel dive); descent, ascent and deco are calculated,
  - optional per dive `options` overriding the shared ones.
  - Rebreather fields are not part of the schema (open circuit only).
  - optional `options`: gradient factors low/high, salinity (fresh/salt), altitude (m), max ppO2 bottom/deco,
    ascent/descent speeds, last stop depth, safety stop, gas switch duration, problem solving / stress RMV factor —
    defaults from the library (same as a new dive in the app).
  - optional `diver`: RMV (l/min).
  - Validation ranges equal to the app's (`UnitConversion` metric ranges); errors are readable text the AI can act on.
    The ranges live in the planner today; if they are pure data, move the metric ranges into the library and let
    `UnitConversion` reuse them, otherwise reference them from the core schema. *(builder's call)*
- **Output** (JSON + short text summary as MCP content), one entry per dive, each with:
  - surface interval, runtime, no-deco or deco dive flag, NDL, time to surface, max/average depth,
  - deco stops `[{depth, duration, gas}]`,
  - per tank: start, end and reserve pressure, consumed volume, whether reserve is kept,
  - CNS %, OTU, max density, events/warnings (as the app's dive info events, English text),
  - `shareUrl` to <https://dugong.online> with the same dive. The app's URL format holds one dive only, so for a
    repetitive dive the link opens that dive alone, without the previous dives' saturation; the output says so.
    Extending the URL format to dive series is out of scope. *(builder's call)*
  - plus once for the whole result a `disclaimer`: fixed text — for planning/education only, verify with your dive
    computer and training.
- Tool description instructs the AI to always show the disclaimer and the share link and never to present the plan
  as authoritative.
- **Skill**: `SKILL.md` explains when to use it and how to call `node scripts/dugong.mjs plan_dive` with JSON input on
  stdin (or an `--input` file), documents input/output with one example, and requires showing disclaimer + link.
  The zip contains `SKILL.md` and the bundled CLI only.
- Output text (events, summary) is English. *(builder's call)*
- Tests: core function unit tests compare results with `PlanningTasks` run the app's way for reference dives
  (no-deco air dive, multilevel dive, deco trimix dive, two repetitive dives where the second one is affected by the
  first, invalid input); an MCP in-memory client test calls the tool; a CLI test.

### Stage 4 — Build pipeline in the existing workflow

- Unit test tier (`build/test.ps1`): run `test-mcp-ci` after the library build (the MCP consumes the built library
  the same way as the planner).
- Versioning: `build/bump-version.ps1` also stamps the version into `manifest.json` and `SKILL.md`
  (and the server's reported version).
- Packaging: `npm run build-mcp` bundles `stdio`/`cli`, runs `mcpb pack` → `dugong.mcpb`, zips the Skill →
  `dugong-skill.zip`, output into the app build so it is deployed with it at `https://dugong.online/ai/`.
  *(path is builder's call)*
- Deploy (`build/deploy.ps1`): artifacts are part of `dist/planner`, so the existing wipe/copy and rollback cover them.
  Service worker must not cache `/ai/**`.
- Post-deploy smoke test: both files download and are zip archives (not the SPA `404.html` fallback) with the released version.

### Stage 5 — Promotion

- New help document `doc/ai.md`, rendered by `HelpComponent` at `/help/ai`: what it is, disclaimer, install for
  Claude Desktop (`.mcpb` download + steps), Claude Code / other MCP clients (config snippet running the stdio
  bundle), Skill install (zip upload), example prompts.
- A visible entry point in the app (e.g. navigation menu item / button "Use with AI") linking to the help page;
  label localized in all locale files. *(placement is builder's call, owner to confirm)*
- README section with the same information in short and links.
- E2E happy path: help page opens from the entry point and both download links are present.

## Left to the builder

Exact file/folder names, esbuild and Vitest configuration, how lint is wired to the new project, exact output field
names, the text of the summary content, and the placement of the moved library files.
