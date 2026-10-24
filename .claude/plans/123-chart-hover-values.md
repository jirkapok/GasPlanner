# Profile Chart Hover Values (#123) Implementation Plan

> **Status: FINISHED** (2026-10-25, branch `feat/123-chart-hover-values`). Both tasks done, final review fixes applied.
> Follow-up changes requested after the plan: restored the dotted vertical hover line (x axis spikes),
> added colored circle markers in front of each value and left-aligned the line with start padding (`ps-5`).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the floating Plotly hover box from the plan-page profile chart and show the hovered values in a single text line above the chart instead.

**Architecture:** `ChartPlotterFactory` gets an opt-in `withoutHoverLabels()` switch. When it is on, every trace gets `hoverinfo: 'none'`, so Plotly draws no box but still fires `plotly_hover`. Every trace gets a stable `uid` that ends with its `TraceKind`. A new pure class `ProfileHoverValues` turns the hover event points into a small model (time, depth, avg depth, ceiling, emergency depth, event texts). `ProfileChartComponent` stores that model on hover, clears it on unhover, and renders it in a line that always keeps its height.

**Tech Stack:** Angular 22 (standalone, zoneless), plotly.js-dist 3, ngx-translate, Jasmine + Karma.

**Spec:** the approved description in the brainstorming conversation, copied here:
- Scope: only the profile chart on the plan page (`ProfileChartComponent`). The Diff page and the heat map stay unchanged.
- Plotly draws no hover box. The cursor line, the waypoint highlighting and the event labels inside the chart keep working as today.
- A single text line sits above the chart, inside the same card. While hovering or tapping, it shows: the time, Depth, Avg depth, Ceiling (left out when it's 0), Emergency ascent depth (only when that toggle is on, in red), and the event text(s) at that point, separated by commas. Each value is colored like its line.
- Labels reuse the translated trace names. While the cursor is off the chart, the line is empty but keeps its height, so the chart never moves.
- On a phone the line wraps instead of being cut off.

## Global Constraints
- Branch: `feat/123-chart-hover-values`, created from the latest clean `master`.
- Commit messages: Conventional Commits with the issue prefix, e.g. `feat: #123 show profile chart hover values above the chart`. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- ESLint: 4-space indent, single quotes, semicolons, 140-char lines. `npm run lint` must pass.
- The Diff page (`diff-profilechart.component.ts`) must look and behave exactly as before. It does not call `withoutHoverLabels()`.
- No new translation keys. Labels reuse `profileChart.depthTraceName`, `profileChart.avgDepthTraceName`, `profileChart.ceilingTraceName` and `profileChart.emergencyTraceName`. Units come from `UnitConversion.length`.
- Line colors must match the trace colors in `DiveTracesBuilder`: depth `rgb(31, 119, 180)`, avg depth `rgb(62, 157, 223)`, ceiling `rgb(255, 160, 73)`, emergency `rgb(255, 77, 77)`.
- Prefer MDB/Bootstrap classes. The only custom SCSS allowed is the reserved line height and the four value colors. No media queries.
- Single-spec command: `npx ng test --project planner --browsers=ChromeHeadless --no-watch --include='**/profileHoverValues.spec.ts'`.

## Review Focus
1. **Prefixed trace uids (Diff page builders)**: `diffResultsTable.profileA.depth` must still resolve to `TraceKind.depth`. This is pinned by the Task 1 test "resolves kind from prefixed uid".
2. **Ceiling exactly 0** during no-deco parts must leave the ceiling out, not show "0 m". Pinned by the Task 1 test "omits zero ceiling".
3. **No event or emergency point near the cursor** must not produce an empty comma list or an "undefined" value. Pinned by the Task 1 test "has no events and no emergency depth when not hovered" and the Task 2 test "hides emergency and events when absent".
4. **Recalculating while hovering** (`wayPointsCalculated$` / `infoCalculated$` both call the unhover handler) must clear the line. Pinned by the Task 2 test "clears values on unhover".
5. **Zoneless change detection**: Plotly events fire outside Angular's template events, so the component must call `cd.markForCheck()` after changing the hover values, or the line won't update in the real app. A spec cannot fully prove this; the Task 2 manual check covers it.

---

### Task 1: Hide hover labels and extract hover values

- [x] Status

**Files:**
- Modify: `projects/planner/src/app/shared/chartPlotter.ts` (factory flag, builder `uid` + `hoverinfo`)
- Create: `projects/planner/src/app/shared/profileHoverValues.ts`
- Test: `projects/planner/src/app/shared/profileHoverValues.spec.ts`, `projects/planner/src/app/shared/chartPlotter.spec.ts` (new)
- Modify: `.gitignore` (add `.superpowers/`, which the brainstorming mockups created)

**Interfaces:**
- Produces:
  - `export enum TraceKind { averageDepth = 'averageDepth', depth = 'depth', emergency = 'emergency', ceiling = 'ceiling', events = 'events' }` in `chartPlotter.ts`.
  - `ChartPlotterFactory.withoutHoverLabels(): ChartPlotterFactory` (fluent, like `withNamePrefix`). It is passed to the builder through `create()` as a new constructor argument `hideHoverLabels: boolean`.
  - Each trace gets `uid`: `kind` when there is no name prefix, otherwise `${namePrefixKey}.${kind}`. When `hideHoverLabels` is set, each trace also gets `hoverinfo: 'none'`.
  - `ProfileHoverValues` in `profileHoverValues.ts`:
    ```ts
    export class ProfileHoverValues {
        /** seconds from dive start */
        public timeStamp: number;
        public depth?: number;
        public averageDepth?: number;
        /** undefined when ceiling is 0 */
        public ceiling?: number;
        public emergencyDepth?: number;
        public events: string[];
        public static fromPoints(points: Plotly.PlotDatum[]): ProfileHoverValues;
        public static traceKind(uid: string | undefined): TraceKind | undefined;
    }
    ```
    `traceKind` returns the segment after the last `.` when it is a `TraceKind` value. `fromPoints` takes `timeStamp` from `DateFormats.secondsFromDate(String(points[0].x))`, reads `y` for depth, avg depth, emergency and ceiling by kind, and collects `point.text` for every `events` point.

- [ ] **Step 1: Write the failing tests** in `profileHoverValues.spec.ts`. Build fake points as `{ x: '1970-02-01 00:29:00', y, text, data: { uid } } as unknown as Plotly.PlotDatum`.
  - `reads values by trace kind`: points with uids depth=21, averageDepth=25.6, ceiling=5 → `depth` 21, `averageDepth` 25.6, `ceiling` 5, `timeStamp` 1740.
  - `resolves kind from prefixed uid`: `ProfileHoverValues.traceKind('diffResultsTable.profileA.depth')` → `TraceKind.depth`; `traceKind('unknown')` and `traceKind(undefined)` → `undefined`.
  - `omits zero ceiling`: ceiling point with y 0 → `ceiling` is `undefined`.
  - `collects event texts`: two `events` points with texts `'Gas switch to EAN50'` and `'Low gas'` → `events` equals both, in that order.
  - `has no events and no emergency depth when not hovered`: only a depth point → `events` equals `[]`, `emergencyDepth` is `undefined`.
  - `reads emergency depth`: emergency point y 18 → `emergencyDepth` 18.

  In the new `chartPlotter.spec.ts` (TestBed providers `ResamplingService, UnitConversion, provideTestTranslate()`; builder from `new ChartPlotterFactory(resampling, units)` over `new DiveResults()`):
  - `assigns uid per trace kind`: `create(...).allTraces()` uids equal `['averageDepth', 'depth', 'ceiling', 'events']`.
  - `prefixes uid with name prefix`: `withNamePrefix('diffResultsTable.profileA')` → first uid `'diffResultsTable.profileA.averageDepth'`.
  - `hides hover labels when requested`: `withoutHoverLabels()`, `showEmergencyAscent = true` → every trace has `hoverinfo === 'none'`.
  - `keeps hover labels by default`: no trace has `hoverinfo` defined.

- [ ] **Step 2: Run both specs and check they fail** (compile error: missing `ProfileHoverValues` / `TraceKind` / `withoutHoverLabels`).

- [ ] **Step 3: Implement** `TraceKind`, the factory flag, the builder `uid`/`hoverinfo` (apply them in one private helper used by `allTraces()` and `profileTraces()`, so every trace path gets them), and `ProfileHoverValues`. Add `.superpowers/` to `.gitignore`.

- [ ] **Step 4: Run both specs and check they pass**, then run `npm run lint` and `npm run test-ci`. All must pass. The Diff page specs must pass unchanged.

- [ ] **Step 5: Commit** `feat: #123 extract profile chart hover values`.

---

### Task 2: Hover value line on the plan-page profile chart

- [x] Status

> **Deviations found during the manual check (fixed test-first):**
> - `hoverinfo: 'none'` doesn't hide the `'x unified'` box, so `withoutHoverLabels()` also switches the layout to `hovermode: 'x'`.
> - `hovertemplate` takes precedence over `hoverinfo`, so it is removed when labels are hidden.
> - `min-height` still let the chart move 1.4 px, so the empty line renders `&nbsp;` instead.

**Files:**
- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.ts`
- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.html`
- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.scss`
- Test: `projects/planner/src/app/plan/profilechart/profilechart.component.spec.ts`

**Interfaces:**
- Consumes: `ChartPlotterFactory.withoutHoverLabels()`, `ProfileHoverValues.fromPoints(points)`, `TraceKind` (Task 1).
- Produces (component members):
  - `public hoverValues: ProfileHoverValues | undefined`
  - `public get lengthUnit(): string` (returns `units.length`)
  - `public get timeFormat(): string` (returns `DateFormats.selectTimeFormat(this.dive.totalDuration)`)
  - `public get hoverTime(): Date | undefined` (returns `DateFormats.toDate(hoverValues.timeStamp)`)
  - `public get hoverEvents(): string` (events joined with `', '`)
  - `public plotlyHoverLeave(): void` becomes **public**, so specs and the existing dispatcher subscriptions share it.

- [ ] **Step 1: Write the failing component tests.** Reuse the fake point helper from Task 1. Call `component.plotlyHover({ points } as unknown as Plotly.PlotMouseEvent)`, then `fixture.detectChanges()`, then read `[data-testid="hover-values"]`. Translations come back as keys.
  - `reserves empty hover line when not hovering`: the element exists and its `textContent.trim()` is `''`.
  - `shows hover values while hovering`: depth 21, avgDepth 25.6, ceiling 5 and an event `'Gas switch to EAN50'` → text contains `'profileChart.depthTraceName'`, `'21'`, `'profileChart.avgDepthTraceName'`, `'25.6'`, `'profileChart.ceilingTraceName'`, `'5'`, `'Gas switch to EAN50'` and `'m'`.
  - `hides emergency and events when absent`: only a depth point → text contains neither `'profileChart.emergencyTraceName'` nor `'profileChart.ceilingTraceName'`.
  - `clears values on unhover`: hover, then `component.plotlyHoverLeave()` → `textContent.trim()` is `''`.

- [ ] **Step 2: Run the spec and check it fails.**

- [ ] **Step 3: Implement.**
  - Constructor: build the plan builder with `chartPlotterFactory.withNamePrefix(null).withoutHoverLabels()`.
  - `plotlyHover` keeps setting `selectedTimeStamp` and also sets `hoverValues = ProfileHoverValues.fromPoints(data.points)`. `plotlyHoverLeave` sets `hoverValues = undefined`. Both call `this.cd.markForCheck()`.
  - Template: a `<div data-testid="hover-values" class="hover-values small">` directly above `#diveplot`, inside `.card-body` (after `app-calculating`). Inside, using `@if (hoverValues)`:
    - `<span class="fw-bold me-2">` with `hoverTime | date: timeFormat`
    - one span per value, each shown only when the value is defined: the label from the `translate` pipe, then the value with `| number:'1.0-1'` and `lengthUnit`, in the order Depth, Avg depth, Ceiling, Emergency
    - then `hoverEvents` when it is not empty
    - values separated by a muted `|`
  - SCSS: `.hover-values { min-height: 1.5em; }`, plus four color classes using the Global Constraints colors (the event text keeps the default color). The line wraps naturally; don't add `text-nowrap`.
  - Add `DatePipe` and `DecimalPipe` to the component `imports`.

- [ ] **Step 4: Run the spec and check it passes**, then run `npm run lint` and `npm run test-ci`.

- [ ] **Step 5: Manual check** with `npm start` at http://localhost:4200, on a deco plan with emergency ascent switched on:
  - no floating box appears
  - the line updates while the mouse moves and empties when it leaves
  - the chart does not jump
  - the waypoints table highlight still follows the cursor
  - the Diff page still shows its box
  - at phone width (DevTools, 375px) the line wraps

- [ ] **Step 6: Commit** `feat: #123 show profile chart hover values above the chart`.
