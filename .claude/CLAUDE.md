# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Dugong Gas Planner — a client-side web app for recreational scuba divers to plan dive gas consumption,
decompression, and related calculations (Bühlmann ZHL-16C with gradient factors, RMV/SAC, Nitrox/Trimix,
NDL tables, etc). Runs fully offline as a PWA; no backend. Live instance: https://dugong.online/.

## Commands

Build order matters: the `scuba-physics` library must be built before the `planner` app consumes it.

- `npm run build-lib` — production build of the `scuba-physics` library (run this first after any lib change).
- `npm start` — builds `scuba-physics` then serves `planner` via `ng serve` (dev mode, http://localhost:4200).
- `npm run build` — production build of `planner` into `dist/planner`.
- `npm run start-pwa` — production build of `planner`, then serves `dist/planner` via `http-server` on port `9090` (use this to test service-worker/offline/PWA behavior, which does not work under `ng serve`).
- `npm test` — Karma unit tests for `planner` (interactive/watch, Chrome).
- `npm run test-lib` — Karma unit tests for `scuba-physics` (interactive/watch, Chrome).
- `npm run test-ci` / `npm run test-lib-ci` — headless, single-run variants used in CI.
- `npm run lint` — `ng lint` (Angular ESLint) across both projects.
- `npm run e2e` — Playwright E2E (`playwright-ng-schematics` builder), auto-starts the dev server; single spec currently in `e2e/startupSmoke.spec.ts`.
- Run a single spec file: `ng test --project planner --include='**/foo.spec.ts'` (swap `--project scuba-physics` for library specs).
- Windows PowerShell equivalents of the main build/test flow are in `build/*.ps1`, but the npm scripts above are the primary workflow.

## Architecture

### Workspace layout

Two Angular projects under `projects/`:

- **`scuba-physics`** — framework-agnostic dive-physics/algorithm library, built with `ng-packagr`. Public surface is explicitly re-exported from `projects/scuba-physics/src/public-api.ts`; anything not exported there is internal. Organized by domain, not by layer:
  - `lib/algorithm` — Bühlmann ZHL-16C implementation, compartments, tissues, profile/event calculation.
  - `lib/consumption` — gas consumption, tanks, divers, standard tank definitions.
  - `lib/depths` — dive profile/segment/level modeling.
  - `lib/gases` — gas mixtures, gas properties, gas toxicity, standard gas names.
  - `lib/physics` — unit conversion, pressure/depth conversion, time.
  - `lib/calculators` — standalone calculators (SAC, NDL, CNS/OTU, Nitrox, gas blending, weight, altitude, gas pricing).
  - `lib/common` — shared primitives (precision, feature flags).
- **`planner`** — the standalone-component Angular app (no NgModules). Bootstrapped from `src/main.ts` via `bootstrapApplication(AppComponent, CONFIG)`, where `CONFIG` is assembled in `src/app/app.config.ts`.

### App composition (`app.config.ts` / `app.routes.ts`)

- `app.config.ts` is the single composition root: standalone components are listed in the `STANDALONE` array, injectable services in `SERVICES`, third-party Angular modules (MDB UI Kit, `NgxMdModule`, `ServiceWorkerModule`, etc.) alongside them. When adding a new standalone component or service, register it in the matching array here rather than importing it ad hoc elsewhere.
- `app.routes.ts` defines flat routes per feature/calculator (`KnownViews` enum) plus a catch-all `DashboardComponent` route guarded by `canActivateDashboard`, which redirects an empty-query root navigation back to the last-viewed dashboard view (state tracked in `ViewStates`).

### State & services (`projects/planner/src/app/shared/*`)

Business/state logic is kept out of components and lives in injectable services under `shared/`, e.g. `PlannerService`, `TanksService`, `DepthsService`, `OptionsService`, `DiveSchedules` / `ManagedDiveSchedules`, `PreferencesStore`. The app supports multiple concurrent dive schedules, but only one is displayed at a time; **`ReloadDispatcher`** is the central RxJS event bus that notifies the UI when the *selected* schedule's tanks/depths/options/results change, decoupling multi-schedule state from re-render triggers. Dive plans are shareable via URL — see `PlanUrlSerialization` and `serialization.model.ts` (DTOs) for the (de)serialization format used both for URL sharing and for `PreferencesStore`/local persistence.

### Background computation (Web Workers)

Heavy dive-profile/consumption/decompression math runs off the main thread. `projects/planner/src/app/workers/*.worker.ts` (`profile.worker.ts`, `diveInfo.worker.ts`, `consumption.worker.ts`) wrap `scuba-physics` algorithm calls; `shared/workers.factory.ts` (browser `Worker` instances) implements the `WorkersFactoryCommon` abstraction from `shared/serial.workers.factory.ts` (a synchronous fallback used e.g. in tests/non-worker contexts). Request/response payloads are typed DTOs in `shared/serialization.model.ts`. When changing algorithm inputs/outputs in `scuba-physics`, keep these worker DTOs and both factory implementations in sync.

### Docs / Help

Markdown docs live in `doc/` at the repo root and are copied into the app bundle as `assets/doc` via the `assets` glob in `angular.json` (both `build` and `test` targets). They're rendered at runtime by `HelpComponent` using `ngx-md`, routed as `/help/:document/:anchor`.

### CI/CD pipeline (`.github/workflows/main.yml`, `build/*.ps1`)

Tiered, each tier gated on the previous, later tiers restricted to `master`:

1. **Unit tests** (every push) — `build/test.ps1`: `scuba-physics` Karma tests, then `build/install-lib.ps1` builds the lib and `npm install`s it from `dist/scuba-physics` (mirrors real consumption, not a workspace link), then `planner` Karma tests.
2. **E2E** (PRs + `master`, needs #1) — `build/e2e.ps1`: reinstalls the built lib, installs Playwright Chromium, runs `npm run e2e`.
3. **Release** (`master` only, needs #1+#2) — `npx semantic-release` (`.releaserc.json`): derives next version from conventional commits, updates `doc/CHANGELOG.md`, runs `build/bump-version.ps1` to stamp the version into `scuba-physics/package.json` and the PWA manifest's `id`, commits as `chore(release): X.Y.Z`, creates a GitHub release.
4. **Deploy** (after release) — `build/deploy.ps1`: builds lib+app, uses a `git worktree` to update `gh-pages` in place (wipes old build files, copies in `dist/planner`, duplicates `index.html` → `404.html` for SPA routing on GitHub Pages), pushes if changed. `build/wait-for-deploy.ps1` then polls the live `manifest.webmanifest` `id` until it matches the released version (cache-busted, 4 min timeout) before a Playwright smoke test runs against production. On any deploy-stage failure, `build/rollback-deploy.ps1` force-resets `gh-pages` to the pre-deploy SHA — deploys self-heal without manual intervention.

## Conventions

- Keep new UI/state code in the standalone-component style (no NgModules); don't reintroduce them.
- Push logic into `scuba-physics` wherever it's pure computation/domain logic — keep `planner` focused on UI, routing, and orchestration.
- Test coverage: write component tests for app code; write unit tests only for library (`scuba-physics`) code.
- Add E2E coverage only for the happy path of a key scenario when introducing a new page — not for every case.
- Prefer Angular Material-provided styles over custom CSS/SCSS where possible (note: current UI still relies on `mdb-angular-ui-kit`; don't expand that surface, prefer Material for new UI).
- Don't edit generated output in `dist/`, `.angular/`, or `coverage/`.
- ESLint enforces 4-space indent, single quotes, required semicolons, 140-char line length, and Angular-specific rules (`app` element/attribute prefix, kebab-case component selectors, camelCase directive selectors); run `npm run lint` before considering a change done.
- Implement layouts for both desktop and mobile using the existing `col-12 col-sm-* col-md-*...` Bootstrap/MDB grid pattern (see `diveoptions.component.html`) — mobile is the `sm` breakpoint and below (<768px, i.e. no `col-md`-or-larger override applies). Don't introduce custom media queries for this.
- Keep component minimum code inside the angular component by putting only formatting (e.g. Precision.round for display), form accessors, component initialization, validation wiring, and thin event handlers that delegate a single UI value or action to a service call with no computation of their own (see diveoptions.component.ts). Extract anything that computes or derives a value into the separate service.
- Always provide validation of inputs: apply [class.is-invalid] to the control when out of the UnitConversion range, and show a message in a sibling element immediately below it (see the O2 % field in oxygen-dropdown.component.html).
- Keep user-facing text in .html templates as literal strings rather than building or storing it in component TypeScript — this keeps the door open for Angular's i18n extraction (@angular/localize / ng extract-i18n, already in the project but not yet wired to any locale) if translation ever becomes a real requirement. Exception: multi-line or text reused across components can live in a shared class like TextConstants (see shared/TextConstants.ts).
- When creating custom scripts use typescript or powershell.
- Update the UI immediately after fields are changed.
- Write commit messages in Conventional Commits format (`type(scope): summary`, e.g. `fix: weight calculator wrong usage of consumed amount`), since `semantic-release` on `master` parses commit types to decide the next version: `fix` → patch, `feat` → minor, `docs` → patch (custom rule in `.releaserc.json`), a `BREAKING CHANGE:` footer (or `!` after type) → major, other types (`chore`, `ci`, `refactor`, `test`, …) do not trigger a release by default. See [CI/CD pipeline](#cicd-pipeline-githubworkflowsmainyml-buildps1) above. If the current branch name contains a GitHub ticket/issue number, prefix the summary with it as `#<number>` right before the summary text, e.g. `fix: #123 weight calculator wrong usage of consumed amount`.
- Always start implementing new feature in new branch checkout from latest clean master.
