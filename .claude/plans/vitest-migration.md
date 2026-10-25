# Karma → Vitest Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. ONE task per request, then stop for review (see CLAUDE.md Workflow).

**Goal:** Replace Karma + Jasmine with Vitest (Angular `@angular/build:unit-test` builder) for both `scuba-physics` and `planner`, keeping every existing test, coverage and CI reporting. Zone.js stays (zoneless is a separate, later project).

**Why:** Karma is deprecated by Angular. Our Karma setup needs workarounds that depend on Angular builder internals (`projects/karma-jasmine-classic.js`, the `karma-jasmine` → `jasmine-core` npm override), Jasmine 7 can't be used with zone.js testing, and the Plotly 4 upgrade showed Karma ping-timeout hangs.

**Architecture:**
- Runner: `@angular/build:unit-test` with `runner: vitest` (default). The builder sets up Vitest globals and the Angular TestBed itself, so the `src/test.ts` files go away.
- Environment: **Vitest browser mode with Playwright Chromium** (`browsers: ["ChromiumHeadless"]` in CI, headed `Chromium` for local interactive runs). Reason: the specs were written for a real browser (Plotly, workers, `performance.memory`, layout), and Playwright Chromium is already installed for E2E. jsdom is a non-goal.
- Spec syntax: ~~Angular's schematic `refactor-jasmine-vitest`~~ **not used**. It reprints whole files through the TypeScript printer: it joins wrapped lines past the 140-char lint limit and collapses multi-line imports. Instead, `build/jasmine2vitest.ts` (`node build/jasmine2vitest.ts <dir>`) does formatting-preserving text replacements (`toBeTrue`/`toBeFalse`, `withContext` → `expect(x, msg)`). Extend it for the planner patterns (spies, `objectContaining`, …), and fix the rest by hand. Task 5 deletes it.

## Lessons from Task 1 (apply to Task 2)
- **Spec files must not export helpers.** A spec that imports from another `*.spec.ts` re-runs all of that file's tests inside the importing file (Vitest counted 1060 instead of 969), and the exporting file itself may end up reporting "No test suite found". Move the exported helpers to a `<Name>.testing.ts` file next to the spec. In the library, `**/*.testing.ts` is excluded in `tsconfig.lib.json`. Planner has 12 exporting spec files (`TestbedExtensions.spec.ts`, `Options.spec.ts`, several component specs).
- **`toBeCloseTo` is stricter in Vitest:** Jasmine rounds the difference to precision+1 digits before comparing (`round(delta·10^(p+1)) <= 5`), Vitest compares `delta < 10^-p/2` exactly. Borderline expected values must be corrected to the properly rounded value at the same precision, e.g. `2225.388` → `2225.389` for an actual `2225.38851`. Don't lower the precision.
- **Jasmine's matcher failure message argument** (`toBe(x, 'msg')`) → `expect(value, 'msg').toBe(x)`. `tsc --noEmit -p <tsconfig.spec.json>` lists them all as TS2554.
- `zone.js` is added by the builder automatically for the library too (no `test.ts` needed).
- Vitest JSON reporter for counting/duplicate analysis: `ng test <p> --no-watch --reporters=json --output-file=<file>`.

**Tech Stack:** Angular 22.2, `vitest` 4.1.x (Angular 22 peer is `^4.0.8`; 5.x not supported yet), `@vitest/browser-playwright` 4.1.x, `@vitest/coverage-istanbul` 4.1.x (see Task 2), `@vitest/eslint-plugin` 1.6.x. Pin versions at least two weeks old (now: 4.1.11, eslint plugin 1.6.27).

## Global Constraints
- Branch: `chore/vitest` from local `master` (which already contains the tier 2 upgrades).
- Commits: Conventional Commits, `test:` / `chore(deps):` / `ci:` types (no release triggered). End each commit with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commit only when the user asks.
- npm installs use `--legacy-peer-deps` (ngx-md peer), like CI.
- **Test counts must not drop:** `scuba-physics` 969, `planner` 809 (excluding `*.performance.spec.ts`). No assertion may be weakened to make a spec pass. If a converted spec fails, find out why (semantic difference between Jasmine and Vitest) before changing it.
- Lint: no new errors over the master baseline (121 errors / 28 warnings), see `npm run lint`.
- The user may have `ng serve` running on port 4200. Don't kill it. See memory note about port conflicts.

## Known Jasmine → Vitest semantic traps (check every converted spec)
| Jasmine | Vitest | Trap |
|---|---|---|
| `spyOn(o, 'm')` | `vi.spyOn(o, 'm')` | Jasmine **stubs** (returns undefined), Vitest **calls through**. Where the original had no `.and.*`, add `.mockImplementation(() => undefined)` (or the schematic's equivalent) unless calling through is harmless. 66 call sites. |
| `.and.callThrough()` | (nothing) | fine |
| `it('x', (done) => …)` | not supported | 21 usages, convert to `async`/`Promise` (`new Promise<void>(resolve => …)`). |
| `jasmine.clock()` | `vi.useFakeTimers()` / `vi.advanceTimersByTime` | 4 usages; restore with `vi.useRealTimers()` in `afterEach`. |
| `toBeCloseTo(x, p)` | `toBeCloseTo(x, p)` | Default precision 2 in both, but **Vitest is stricter on borderline values**, see Lessons from Task 1. |
| `withContext(msg)` | `expect(value, msg)` | 8 usages |
| `jasmine.objectContaining` | `expect.objectContaining` | 2 usages |
| `toHaveBeenCalledOnceWith` | `toHaveBeenCalledExactlyOnceWith` | 3 usages |
| `spyOnProperty` | `vi.spyOn(o, 'p', 'get')` | 3 usages |
| `fail(msg)` | `expect.fail(msg)` | 3 usages |
| `jasmine.Spy` / `jasmine.SpyObj` types | `Mock` / `Mocked<T>` from `vitest` | type-only |
| test isolation | builder default `isolate: false` | same as Karma (one shared page); keep it. |

## File Structure
| File | Change |
|---|---|
| `package.json` | add vitest deps, scripts; Task 5 removes Karma/Jasmine deps and the `overrides` block |
| `angular.json` | `test` targets → `@angular/build:unit-test` |
| `projects/*/tsconfig.spec.json` | `types: ["vitest/globals"]`, drop `src/test.ts` |
| `projects/*/src/**/*.spec.ts` | converted by the schematic + manual fixes |
| `projects/scuba-physics/vitest-performance.config.ts` | new, Chromium launch flags for performance specs |
| `projects/*/vitest-base.config.ts` | new only if reporters can't be set from the builder (Task 4) |
| delete | `projects/*/karma.conf.js`, `projects/scuba-physics/karma.performance.conf.js`, `projects/karma-jasmine-classic.js`, `projects/*/src/test.ts` |
| `eslint.config.mjs` | `eslint-plugin-jasmine` → `@vitest/eslint-plugin`, `globals.jasmine` → `globals.vitest` |
| `.claude/CLAUDE.md` | Commands section (single-spec command, runner) |

---

## Task 1: Vitest infrastructure + `scuba-physics` specs
- [x] Status (969 passed; `test-lib`/`test-lib-ci` scripts updated; coverage lands in `coverage/scuba-physics`; lint errors at baseline, +5 `jasmine/expect-single-argument` warnings until Task 5)

1. `npm install --save-dev --legacy-peer-deps vitest@4.1.11 @vitest/browser-playwright@4.1.11 @vitest/coverage-istanbul@4.1.11`.
2. `angular.json` → `projects.scuba-physics.architect.test`: builder `@angular/build:unit-test`, options `tsConfig: projects/scuba-physics/tsconfig.spec.json`, `browsers: ["ChromiumHeadless"]`, `exclude: ["**/*.performance.spec.ts"]`. A library has no `build` target with application options; if the builder requires `buildTarget`, check how the builder handles libraries (`node_modules/@angular/build/src/builders/unit-test/`) and document the choice here.
3. `projects/scuba-physics/tsconfig.spec.json`: `types: ["vitest/globals"]`, remove `files: ["src/test.ts"]`. Delete `projects/scuba-physics/src/test.ts` (zone.js import: the builder adds zone.js from the polyfills, check that the library specs don't need it at all).
4. Run `npx ng g @schematics/angular:refactor-jasmine-vitest --project scuba-physics --browser-mode`. Read the generated report and fix every TODO it lists.
5. Review the diff for the traps table above (especially `spyOn` stubbing).
6. Verify: `npx ng test scuba-physics --no-watch` → **969 passed**, 0 failed/skipped. `npm run lint` at baseline.
7. Keep `npm run test-lib`/`test-lib-ci` working for this project (scripts are finalized in Task 4).

## Task 2: `planner` specs
- [x] Status (809 passed, 3 runs without coverage + 2 `test-ci` runs; lint errors below the baseline (100 vs 109), +4 `jasmine/expect-single-argument` warnings until Task 5)

Done differently than planned:
- **Polyfills:** the builder imports `zone.js/testing` statically only if the build target `polyfills` lists `zone.js` by name. With `polyfills.ts`, it generates a top-level `await import('zone.js/testing')` that fails to compile with zone.js. `projects/planner/src/polyfills.ts` (only `@angular/localize/init` + `zone.js`) was replaced by `"polyfills": ["@angular/localize/init", "zone.js"]` in the build target. The production polyfills bundle is unchanged (36.3 kB).
- **TestBed teardown:** the builder always initializes TestBed with `destroyAfterEach: true` (there is no option). The old `false` from `test.ts` isn't needed, all specs pass.
- **`restoreMocks: true`** in `projects/planner/vitest-base.config.mts`: Jasmine removes spies after each test, Vitest doesn't by default. Without it, spies on static `PlanningTasks` methods leaked into later tests (calls counted from 42 tests).
- **Coverage provider `@vitest/coverage-istanbul`** instead of `-v8`: V8 browser coverage made the planner suite ~30x slower (919 s test time vs 29 s) and the heavy CNS/rebreather specs exceeded the 15 s browser-mode test timeout at random. Istanbul: 45 s wall time, slowest test 2.5 s. The Angular builder prefers Istanbul in browser mode when it is installed.
- Runner config files are `.mts`, a `.ts` file triggers Vite's "ESM syntax in a file loaded as CommonJS" warning.
- `jasmine.createSpyObj` → `createSpyObj<T>(methods)` helper in `projects/planner/src/testing/spy-testing.helpers.ts`.
- `jasmine.clock()` → `vi.useFakeTimers()`/`vi.setSystemTime()`/`vi.advanceTimersByTime()`/`vi.useRealTimers()`.
- `done` callbacks → `async` tests awaiting `new Promise(resolve => setTimeout(resolve, ms))`, so a failed `expect` fails the test instead of becoming an unhandled error.
- Stub spy later switched to call through (`spy.and.callThrough()`) → `spy.mockReset()` (Vitest 4 restores the original implementation of a `vi.spyOn` spy).
- `shared/Options.spec.ts` and `shared/TestbedExtensions.spec.ts` contained only helpers, renamed to `*.testing.ts`. The exported page objects of component specs are not imported anywhere, left as they are.
- Two more borderline `toBeCloseTo` values corrected at the same precision (`ApplicationSettings.spec.ts`, `tanks-simple.component.spec.ts`).
- Scripts `test` and `test-ci` already switched to the new builder (`ng test planner`, `ng test planner --no-watch --coverage`).

1. `angular.json` → `projects.planner.architect.test`: builder `@angular/build:unit-test`, `buildTarget: planner:build:development` (provides polyfills incl. `@angular/localize/init` + zone.js, assets, styles), `tsConfig: projects/planner/tsconfig.spec.json`, `browsers: ["ChromiumHeadless"]`. Check that the spec-only assets (doc markdown, i18n) are served; the old Karma target listed its own `assets`/`styles`.
2. `projects/planner/tsconfig.spec.json`: `types: ["vitest/globals"]`, `files: ["src/polyfills.ts"]` only if still needed. Delete `projects/planner/src/test.ts`. The builder's TestBed setup must keep `teardown: { destroyAfterEach: false }`. If the builder doesn't allow that, use a `providersFile`/setup file and note it here.
3. Run the schematic for `planner` with `--browser-mode`, fix the report TODOs.
4. Fix the traps: the `done` callbacks (`delayedSchedule.service.spec.ts` and others), `jasmine.clock`, `jasmine.SpyObj` in `mainmenu`/`help.service` specs, `spyOnProperty`.
5. Verify: `npx ng test planner --no-watch` → **809 passed**, 3 runs in a row without a hang or flake. `npm run lint` at baseline.

## Task 3: Performance specs
- [x] Status (7 performance tests pass, the "Memory measurement is available" spec proves both flags; lint at baseline)

Done differently than planned:
- **Separate target `scuba-physics:test-performance`** (`"test-performance": "ng run scuba-physics:test-performance"`) instead of overriding the `test` target from the command line. The builder creates its own Playwright provider from the `browsers` option and that provider can't receive launch arguments. Without `browsers`, the builder uses the `browser` section of the runner config as it is. The separate target also avoids fighting the `exclude` of the `test` target.
- `projects/scuba-physics/vitest-performance.config.mts`: headless Chromium with `--enable-precise-memory-info` and `--js-flags=--expose-gc`, `testTimeout` 30 min, no failure screenshots, `verbose` reporter (the default reporter hides `console.log` of passed tests, but the logged durations and heap sizes are the result of these specs).
- `projects/scuba-physics/karma.performance.conf.js` deleted, comments in `DiveComputer.performance.spec.ts` point to the new config.

1. Create `projects/scuba-physics/vitest-performance.config.ts` that launches Chromium with `--enable-precise-memory-info` and `--js-flags=--expose-gc`, and a long test timeout (the longest dive takes seconds; the Karma config allowed 30 minutes of no activity).
2. Script: `"test-performance": "ng test scuba-physics --no-watch --runner-config projects/scuba-physics/vitest-performance.config.ts --include **/*.performance.spec.ts"`. The `exclude` from `angular.json` must not drop these files, so override it or move the exclusion into the scripts.
3. Verify: `npm run test-performance` runs both performance specs. `performance.memory` and `gc` are defined, so the memory measurements aren't NaN.

## Task 4: npm scripts, coverage and CI reporting
- [x] Status (`pwsh ./build/test.ps1` passes: 969 + 809 tests, cobertura and junit files at the CI paths; lint unchanged)

Done:
- Scripts: `test` = `ng test planner --no-headless`, `test-lib` = `ng test scuba-physics --no-headless` (headed Chromium with the Vitest UI in watch mode, like Karma's Chrome window), `test-ci`/`test-lib-ci` = `--no-watch --coverage`.
- Coverage: `coverageReporters: ["html", "text-summary", ["cobertura", { "file": "cobertura.xml" }]]` in both `test` targets. The builder writes to `coverage/<project>` by default. `coverageExclude` removes spec files, `*.testing.ts` and `testing/**` helpers. The planner also excludes `projects/scuba-physics/**`: it resolves the library from `dist/`, whose source maps point to the library sources. `coverageInclude` isn't used. It adds files no test loads (and fails on `index.html`), while Karma reported only loaded files.
- JUnit: `reporters: ['default', ['junit', { suiteName }]]` and `outputFile: { junit: 'test-results/<project>/junit.xml' }` in both `vitest-base.config.mts` files. Root level options of the runner config reach Vitest.
- `build/test.ps1` installs Playwright Chromium first (`npx playwright install chromium`, the same as `build/e2e.ps1`). The CI unit test job had no Playwright browser, Karma used the preinstalled Chrome.
- The Vitest packages are pinned to exact versions (`4.1.11`). `build/install-lib.ps1` runs `npm install ./dist/scuba-physics --no-package-lock`, which ignores the lock file and resolves all packages again within their `package.json` ranges. With `^4.1.11` the planner tests in CI would run on a newer Vitest than the library tests. Existing behavior for the other packages, not changed here.

1. Scripts:
   - `test`, `test-lib`: watch mode with a headed browser (`--browsers Chromium` or `--no-headless`).
   - `test-ci`, `test-lib-ci`: `--no-watch --coverage`.
2. Coverage output must stay where CI expects it: `coverage/scuba-physics/cobertura.xml` and `coverage/planner/cobertura.xml`. Configure with `coverageReporters: ["html", "text-summary", "cobertura"]`, and set the output dir in a runner config if needed.
3. JUnit output must stay where the CI "Publish Test Results" step reads it: `test-results/**/*.xml`, i.e. `test-results/scuba-physics/*.xml` and `test-results/planner/*.xml`. Set up Vitest's `junit` reporter, using a `vitest-base.config.ts` runner config if the builder has no option for it.
4. `build/test.ps1` and the workflow should need no change; if they do, keep the change minimal.
5. Verify: run `npm run test-lib-ci` and `npm run test-ci` and check that both cobertura and junit files exist with the expected test counts.

## Task 5: Remove Karma/Jasmine, lint and docs
- [x] Status (`build/test.ps1` 969 + 809 passed, `test-performance` 7 passed, production build ok, e2e 8 passed; lint 102 + 12 errors, 0 warnings, better than the baseline 121 errors / 28 warnings)

Done:
- Uninstalled `karma*`, `jasmine-core`, `@types/jasmine`, `istanbul-lib-instrument` (only the Karma builder used it, `@vitest/coverage-istanbul` has its own), `eslint-plugin-jasmine`. Removed the `overrides` block. Deleted both `karma.conf.js`, `projects/karma-jasmine-classic.js` and the migration codemod `build/jasmine2vitest.ts`.
- ESLint: `@vitest/eslint-plugin` recommended rules, `globals.vitest`. `vitest/expect-expect` accepts helper names `expect*`, `assert*`, `verify*` and `measure`, because most assertions are wrapped in spec helpers. Renamed one helper that asserts (`calculateNoDecompressionLimit` → `assertNoDecompressionLimits`) and fixed 8 test titles for `vitest/valid-title` (trailing/leading spaces, duplicate "it"/"It is" prefix, two incomplete `Gases` partial pressure titles completed by their assertions).
- `.vscode`: removed the Karma Test Explorer recommendation and its settings, updated the `npm: test`/`npm: test-lib` task details.
- `.claude/CLAUDE.md`: Commands (test runners, `test-performance`, runner configs, `*.testing.ts` rule, single-spec command), docs assets note and CI tier 1.
- Not done: clean `npm ci` (the user's `ng serve` on port 4200 locks `node_modules`). `npm ls` confirms no removed package is installed. E2E ran against an own dev server on port 4300.
- Remaining "Jasmine" mentions are three comments explaining Vitest code by its Jasmine equivalent. `karma` remains in `package-lock.json` only as an optional peer dependency of `@angular/build`.

1. Uninstall: `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `karma-junit-reporter`, `karma-verbose-reporter`, `jasmine-core`, `@types/jasmine`, `istanbul-lib-instrument` (only if nothing else needs it). Remove the `overrides` block.
2. Delete the Karma config files and `projects/karma-jasmine-classic.js`.
3. ESLint: replace `eslint-plugin-jasmine` with `@vitest/eslint-plugin@1.6.27` (recommended rules), `globals.jasmine` → `globals.vitest`. Lint stays at baseline or better.
4. Update `.claude/CLAUDE.md` Commands section: the runner is Vitest browser mode and the single-spec command is `ng test planner --no-watch --include '**/foo.spec.ts'`. Remove references to Karma. Add a memory note if anything non-obvious came up.
5. Verify from a clean install: `npm ci --legacy-peer-deps`, then `pwsh ./build/test.ps1`, `npm run lint`, `npm run e2e` (port caveat) and `npm run build`. All green, and `grep -ri karma` finds nothing outside `node_modules`, the changelog and old plans.
