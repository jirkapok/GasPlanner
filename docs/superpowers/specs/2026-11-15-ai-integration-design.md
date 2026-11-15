# AI integration (MCP server + Skill) — design

Issue: [#141 AI integration/MCP](https://github.com/jirkapok/GasPlanner/issues/141)
Branch: `feature/141-ai-integration`

## Intent

Divers should be able to use Dugong's dive planning from their AI assistant ("use this planning tool from any app").
An AI asks for a plan in structured form, gets the same numbers the app would show and explains them. Later the AI
also hands the user a link and QR code that open the same plan in <https://dugong.online>, and a chart of the profile.

## Releases

The work is split into two releases (decided by the owner). **The implementation plan covers Release 1 only.**
Release 2 is described here so Release 1 doesn't block it; it gets its own plan.

| | Release 1 | Release 2 (deferred) |
| --- | --- | --- |
| Dive planning | single open circuit dive at one depth level (the app's simple plan, bottom gas plus optional deco gases) | multilevel dives, repetitive dives |
| Gas supply | open circuit only | all non open circuit gas supplies supported by the app: closed circuit rebreathers (eCCR, mCCR) and pSCR, with their diluent, oxygen and bailout tanks and setpoints |
| Calculators | none | SAC, Nitrox, NDL, altitude, weight, gas properties, blender, redundancies |
| Open in the app | none | link to the planned dive in the current application and a QR code of it ([Stage 6](#stage-6--link-and-qr-code-to-open-the-dive-in-the-app)) |
| Profile chart | none | SVG of the dive profile chart as output ([Stage 7](#stage-7--dive-profile-chart-as-svg)) |
| Delivery | MCP server (`.mcpb`), Skill, library refactoring, build pipeline, promotion in the app | new tools and outputs added to the same MCP server and Skill using the Release 1 pattern |

Release 1 must keep the input and output schema extensible, so Release 2 adds to it without breaking Release 1 callers.

## Goals (Release 1)

- An MCP server exposing a `plan_dive` tool, runnable locally (stdio) and distributed as a `.mcpb` bundle
  (one-click install in Claude Desktop) hosted on GitHub Pages next to the app.
- A Skill (`SKILL.md` + bundled script) giving the same planning capability without MCP, distributed as a zip on GitHub Pages.
- MCP server, Skill and app compute results through one shared implementation in `scuba-physics`.
- The existing GitHub workflow tests, builds, versions and deploys both artifacts with every release.
- The app tells users that and how they can use Dugong from their AI.

## Non-goals (Release 1)

- Release 2 scope: multilevel dives, repetitive dives, rebreather (CCR, pSCR) gas supplies, all calculators,
  link and QR code to open the dive in the app, profile chart SVG (see [Releases](#releases)).
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
  in a Cloudflare Worker unchanged. The only exception are the two thin entry points (`stdio.ts`, `cli.ts`), agreed by
  the owner: reading stdin/stdout is inherently a host API. They contain no logic, only wire the host's streams to the
  core, and are the parts a Worker entry would replace. A lint rule/test guards that `src/core` imports no `@angular/*`
  nor Node built-ins.
- Tools are stateless; each call carries the complete dive.
- Units on the wire are metric/SI (meters, bars, liters, minutes); the share URL is always metric (as today).
- Project conventions apply: TDD (unit tests for library, Vitest), `npm run lint` clean, Conventional Commits with `#141`,
  build scripts in PowerShell under `build/` (see Stage 4), docs/help in `doc/`, i18n for any UI text.

## Approaches considered

- **A. Plain Node/TypeScript project in this repo** (`projects/dugong-mcp`, esbuild bundles) — **chosen**.
  Matches how MCP servers are built, one bundle runs in Claude Desktop, `npx`, Skills and Workers,
  library and server change in one PR with one version. Cost: a second small toolchain next to Angular.
- **B. Project inside the Angular workspace** — Angular builders target browser apps/libraries, not Node CLI bundles;
  `.mcpb` packaging needs custom scripts anyway. Rejected.
- **C. Separate repository** — every library change needs release + bump in the other repo, versions drift,
  works against one shared implementation. Rejected.

## Release 1 design by stage (stages decided by the owner)

### Stage 1 — Skeleton

```text
projects/dugong-mcp/
  src/core/          tool definitions, schemas, handlers (transport independent, no Node-only APIs)
  src/stdio.ts       MCP stdio entry point (Claude Desktop .mcpb, Claude Code, npx)
  src/cli.ts         command-line entry used by the Skill
  skill/SKILL.md     Skill instructions
  manifest.json      .mcpb manifest
  tsconfig*.json, vitest config (Node environment), eslint config
build/
  build-mcp.ps1      bundling + packaging script (see Stage 4)
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
- Workers (`profile`, `diveInfo`, `consumption`, `computer`) and `ComputerTasks` import from `scuba-physics`.
- Remove `@angular/*` from `projects/scuba-physics/package.json` `peerDependencies`; rewrite
  `altitudeCalculator.spec.ts` without `TestBed`. Add a guard (lint rule or test) that library sources import neither
  `@angular/*`, `lodash` nor Node built-ins.
- Existing planner and library tests are the safety net; moved code gets its specs moved with it.

### Stage 3 — Dive planning as MCP tool and Skill

- Release 1 scope (decided by the owner): **one open circuit dive at one depth level**.
  Multilevel dives, repetitive dives, rebreather (CCR, pSCR) gas supplies, calculators, link/QR code and the profile
  chart belong to Release 2.
- One shared core function `planDive(input) → result` in `src/core`, used by the MCP tool and the CLI,
  so both return identical JSON. It builds the plan the way the app builds a simple plan (descent to the depth, bottom
  time, calculated ascent and deco — reuse `PlanFactory`/the app's simple plan logic), maps it to `PlanRequestDto`
  (first dive: no previous tissues, surface interval none), runs `PlanningTasks` (profile → dive info → consumption)
  and maps the DTOs to the output below.
- **Input** (zod schema, metric):
  - `depth` (m) and `bottomTime` (min, as the app's simple plan duration),
  - `tanks[]`: size (l), start pressure (bar), O2 %, He %; first tank is the bottom gas,
    the others are deco gases (switched to as the app does),
    no working pressure: the input is metric only and the app uses it only for imperial units (can be added later),
  - optional `options`: gradient factors low/high, salinity (fresh/salt), altitude (m), max ppO2 bottom/deco,
    ascent/descent speeds, last stop depth, safety stop, gas switch duration, problem solving / stress RMV factor —
    defaults from the library (same as a new dive in the app),
  - optional `diver`: RMV (l/min),
  - rebreather fields are not part of the Release 1 schema (open circuit only); the schema must allow adding them in Release 2.
  - Validation ranges equal to the app's (`UnitConversion` metric ranges); errors are readable text the AI can act on.
    The ranges live in the planner today. Only the metric ranges move into the library (decided by the owner); the MCP
    core schema validates against them and the app's `UnitConversion` reuses them for its metric ranges. Imperial ranges
    stay in the planner.
- **Output** (JSON + short text summary as MCP content):
  - runtime, no-deco or deco dive flag, NDL, time to surface, max/average depth,
  - deco stops `[{depth, duration, gas}]`,
  - per tank: start, end and reserve pressure, consumed volume, whether reserve is kept,
  - CNS %, OTU, max density, events/warnings (as the app's dive info events, English text),
  - `disclaimer`: the disclaimer already shown in the app (English `disclaimerText` from `en.json`), copied verbatim.
- Tool description instructs the AI to always show the disclaimer and never to present the plan as authoritative.
- **Skill**: `SKILL.md` explains when to use it and how to call `node scripts/dugong.mjs plan_dive` with JSON input on
  stdin (or an `--input` file), documents input/output with one example, and requires showing the disclaimer.
  The zip contains `SKILL.md` and the bundled CLI only.
- Output text (events, summary) is English. *(builder's call)*
- Tests: core function unit tests compare results with `PlanningTasks` run the app's way for reference dives
  (no-deco air dive, deco nitrox dive with a deco gas, deco trimix dive, invalid input); an MCP in-memory client test
  calls the tool; a CLI test.

### Stage 4 — Build pipeline in the existing workflow

- All build, packaging, versioning and deploy scripts are PowerShell scripts in the `build/` directory (decided by the
  owner), like the existing `build/*.ps1`: new ones (e.g. `build/build-mcp.ps1`) and extensions of the existing ones.
  npm scripts and the GitHub workflow only call them; no TypeScript or inline build scripts.

- Unit test tier (`build/test.ps1`): run `test-mcp-ci` after the library build (the MCP consumes the built library
  the same way as the planner).
- Versioning: `build/bump-version.ps1` also stamps the version into `manifest.json` and `SKILL.md`
  (and the server's reported version).
- Packaging: `npm run build-mcp` runs `build/build-mcp.ps1`, which bundles `stdio`/`cli`, runs `mcpb pack` → `dugong.mcpb`, zips the Skill →
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

## Release 2 design by stage (deferred, own plan)

Release 2 also extends `plan_dive` and the Skill to multilevel dives, repetitive dives and rebreather gas supplies,
and adds the calculator tools (see [Releases](#releases)). Those get their own stages when Release 2 is planned.
The two stages below were added by the owner.

### Stage 6 — Link and QR code to open the dive in the app

- `plan_dive` output gains `shareUrl`: a link to <https://dugong.online> (the current application) opening the planned
  dive, in the same format as the app's share link, and `qrCode`: the same link as a QR code, so the user can open the
  dive on a phone (e.g. while the AI runs on a desktop).
- Add a pure **share URL encoder** to the library (dive DTOs → `t=…&de=…&di=…&o=…[&r=…][&si=…]&ao=…` query, the static
  `to*Param` functions of `PlanUrlSerialization`). `PlanUrlSerialization` in the app delegates to it; URL parsing stays in
  the app. Existing `PlanUrlSerialization.spec.ts` must pass unchanged — this is the guard against changed URLs.
- The link opens the simple view for a single level dive and the complex view for a multilevel dive (`ao` parameter).
- The app's URL format holds one dive only, so for a repetitive dive the link opens that dive alone, without the
  previous dives' saturation; the output says so. Extending the URL format to a dive series is out of scope.
- QR code is generated without DOM/canvas (e.g. the `qrcode` package the app already gets through `angularx-qrcode`,
  rendering to an SVG string), returned as an image in the MCP result and as a file by the Skill CLI.
- Tool description and `SKILL.md` instruct the AI to show the link (and offer the QR code) with every plan.
- Tests: the generated link loads in the app as the same dive (simple and multilevel), QR code decodes to the link.

### Stage 7 — Dive profile chart as SVG

- `plan_dive` output gains the dive profile chart as SVG: depth over time of the calculated profile with ceilings,
  gas switches and deco stops, resembling the app's profile chart.
- The app draws the chart with Plotly, which needs a DOM; the MCP core has none. So the SVG is generated by a pure
  function (profile DTO → SVG string) in the library, without DOM or Node-only APIs, so it also works in a Worker.
- Returned as an image in the MCP result (with a PNG fallback considered for clients that don't render SVG) and as a
  file by the Skill CLI.
- Tests: SVG is well formed, contains the profile path and axes for reference dives; snapshot test of a reference dive.

## Left to the builder

Exact file/folder names, esbuild and Vitest configuration, how lint is wired to the new project, exact output field
names, the text of the summary content, and the placement of the moved library files.
