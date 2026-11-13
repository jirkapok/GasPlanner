# Profile Chart Legend (#123) Implementation Plan

> **Status: FINISHED** (2026-11-13, branch `feat/123-chart-hover-values`, rebased on `master` 0.22.0).
> All tasks are implemented and committed, including the follow-ups requested after the original plan (Task 3).
> Alternatives built for comparison (Plotly legend above the chart, and values written into the Plotly legend)
> were rejected and their branches `feat/123-chart-legend` and `feat/123-chart-legend-values` deleted.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the floating Plotly hover box from the profile charts (plan page and compare dives page) and show the hovered values in a chart legend above the chart instead.

**Architecture:** `ChartPlotterFactory` gets an opt-in `withoutHoverLabels()` switch. When it is on, every trace gets `hoverinfo: 'none'` without `hovertemplate`, the layout uses `hovermode: 'x'` with a dotted vertical spike line, so Plotly draws no box but still fires `plotly_hover`. Every trace gets a stable `uid` (`DiveTracesBuilder.uidPrefix` + `TraceKind`). The pure class `ChartLegendValues` turns the hover event points of one profile into a small model (time, depth, avg depth, ceiling, emergency depth, event texts). The shared presentational `ChartLegendComponent` (`app-chart-legend`) renders one legend row with line samples in the trace colors (`DiveTracesBuilder.legendColors`). The plan page shows one row, the compare dives page shows the time and one row per profile.

**Tech Stack:** Angular 22 (standalone, zoneless, OnPush), plotly.js-dist 3, ngx-translate, Vitest browser mode (Playwright Chromium).

**Spec:** the approved description from the brainstorming conversation, extended by the follow-ups requested later:

- Plotly draws no hover box on the plan page and the compare dives page. The dotted vertical cursor line, the waypoint highlighting and the event labels inside the chart keep working.
- Plan page: a single legend row sits above the chart, inside the same card. While hovering or tapping, it shows: the time, Depth, Avg depth, Ceiling (left out when it's 0), Emergency ascent depth (only when that toggle is on), and the event text(s) at that point, separated by commas.
- Compare dives page: the time once, then one legend row for profile A and one for profile B, each with the profile name and its own trace colors.
- In front of each value is a sample like in a chart legend: solid depth, dotted avg depth, dashed emergency, filled ceiling area, circle for events. Values are bold in the line color, entries separated by a muted `|`, the row starts with the plot area (`ps-5`).
- Labels reuse the translated trace names. While the cursor is off the chart, the rows are empty but keep their height.
- On a phone the rows wrap instead of being cut off; a sample always stays with its value.

## Global Constraints

- Branch: `feat/123-chart-hover-values`, created from the latest clean `master`.
- Commit messages: Conventional Commits with the issue prefix, e.g. `feat: #123 show profile chart hover values above the chart`. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- ESLint: 4-space indent, single quotes, semicolons, 140-char lines. `npm run lint` must not report errors in changed files (master has 113 existing errors elsewhere).
- No new translation keys. Labels reuse `profileChart.depthTraceName`, `profileChart.avgDepthTraceName`, `profileChart.ceilingTraceName`, `profileChart.emergencyTraceName` and `diffResultsTable.profileA/B`. Units come from `UnitConversion.length`.
- Legend colors come from the trace builders (`DiveTracesBuilder.legendColors`), never hardcoded in the templates.
- Prefer MDB/Bootstrap classes; custom SCSS only for the legend samples. No media queries.
- Single-spec command: `ng test planner --no-watch --include='**/chartLegendValues.spec.ts'`.

## Review Focus

1. **Prefixed trace uids (compare dives page)**: `diffResultsTable.profileA.depth` must resolve to `TraceKind.depth` and only to profile A. Pinned by "resolves kind from prefixed uid" and "reads only values of profile with given uid prefix".
2. **Ceiling exactly 0** during no-deco parts must leave the ceiling out, not show "0 m". Pinned by "omits zero ceiling".
3. **No event or emergency point near the cursor** must not produce an empty comma list or an "undefined" value. Pinned by "has no events and no emergency depth when not hovered" and "hides emergency and events when absent".
4. **Stale values**: recalculation, dive switch, language change, emergency toggle and profiles alignment change must clear the legend (touch devices don't always send unhover). Pinned by the "clears values ..." and "clears hovered values ..." specs.
5. **Zoneless change detection**: Plotly events fire outside Angular's template events, so the components call `cd.markForCheck()` after changing the legend values. Pinned by the specs calling `plotlyHover` directly and the manual check.

---

### Task 1: Hide hover labels and extract legend values

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/shared/chartPlotter.ts` (factory flag, builder `uid` + `hoverinfo`)
- Create: `projects/planner/src/app/shared/chartLegendValues.ts` (originally `profileHoverValues.ts`)
- Test: `projects/planner/src/app/shared/chartLegendValues.spec.ts`, `projects/planner/src/app/shared/chartPlotter.spec.ts` (new)
- Modify: `.gitignore` (`.superpowers` is ignored by master already)

**Interfaces:**

- Produces:
  - `export enum TraceKind { averageDepth, depth, emergency, ceiling, events }` (string values) in `chartPlotter.ts`.
  - `ChartPlotterFactory.withoutHoverLabels(): ChartPlotterFactory`, passed to the builder as `hideHoverLabels: boolean`.
  - Each trace gets `uid` = `uidPrefix + kind`, where `uidPrefix` is `''` or `${namePrefixKey}.`. With `hideHoverLabels`, each trace gets `hoverinfo: 'none'` and no `hovertemplate`.
  - `ChartLegendValues` in `chartLegendValues.ts`: `timeStamp`, `depth?`, `averageDepth?`, `ceiling?` (undefined when 0), `emergencyDepth?`, `events: string[]`, `static fromPoints(points, uidPrefix = '')`, `static traceKind(uid)`.

- [x] **Step 1: Write the failing tests** in `chartLegendValues.spec.ts` (reads values by trace kind, resolves kind from prefixed uid, omits zero ceiling, collects event texts, has no events and no emergency depth when not hovered, reads emergency depth) and `chartPlotter.spec.ts` (assigns uid per trace kind, prefixes uid with name prefix, hides hover labels when requested, keeps hover labels by default).
- [x] **Step 2: Run both specs and check they fail** (compile error: missing class / `TraceKind` / `withoutHoverLabels`).
- [x] **Step 3: Implement** `TraceKind`, the factory flag, the builder `uid`/`hoverinfo` in one private `identify()` helper used by every trace, and the legend values class.
- [x] **Step 4: Run both specs and check they pass**, then `npm run lint` and the full suite.
- [x] **Step 5: Commit** `feat: #123 extract profile chart hover values`.

---

### Task 2: Legend row on the plan-page profile chart

- [x] Status

> **Deviations found during the manual check (fixed test-first):**
> - `hoverinfo: 'none'` doesn't hide the `'x unified'` box, so `withoutHoverLabels()` also switches the layout to `hovermode: 'x'`.
> - `hovertemplate` takes precedence over `hoverinfo`, so it is removed when labels are hidden.
> - `min-height` still let the chart move 1.4 px, so the empty row renders `&nbsp;` instead.
> - Final review: hours were lost in the time on dives longer than 1 hour (now `duration` pipe), and values stayed visible after tap on touch devices (now cleared on dive switch, language change and emergency toggle).

**Files:**

- Modify: `projects/planner/src/app/plan/profilechart/profilechart.component.{ts,html,scss,spec.ts}`

**Interfaces:**

- Consumes: `withoutHoverLabels()`, `ChartLegendValues.fromPoints(points)`, `TraceKind` (Task 1).
- Produces: `legendValues: ChartLegendValues | undefined`, `legendColors: ChartLegendColors`, public `plotlyHoverLeave()`.

- [x] **Step 1: Write the failing component tests** reading `[data-testid="chart-legend"]` (reserves empty chart legend when not hovering, shows chart legend values while hovering with exact `'21 m'`, `'25.6 m'`, `'5 m'` values, hides emergency and events when absent, clears values on unhover).
- [x] **Step 2: Run the spec and check it fails.**
- [x] **Step 3: Implement** the builder `withoutHoverLabels()`, `legendValues` set in `plotlyHover` and cleared in `plotlyHoverLeave`, both with `markForCheck()`, and the legend row above `#diveplot`.
- [x] **Step 4: Run the spec and check it passes**, then `npm run lint` and the full suite.
- [x] **Step 5: Manual check** in the running app at 1280 px and 375 px: no floating box, the row updates while the mouse moves and empties when it leaves, the waypoints table highlight follows the cursor, the row wraps on a phone, emergency value shown when switched on. The ceiling sample was verified by component tests only (the default dive has no ceiling). See Known limitations for the chart moving when the row wraps.
- [x] **Step 6: Commit** `feat: #123 show profile chart hover values above the chart`.

---

### Task 3: Follow-ups requested after the plan

- [x] Status

- [x] **Step 1: Restore the dotted vertical hover line**: `withoutHoverLabels()` sets x axis spikes like the unified hover (`across`, `dot`, 1.5 px, `#444`). Commit `fix: #123 restore vertical hover line in profile chart`.
- [x] **Step 2: Legend samples**: colored circles, then short line samples like in the Plotly legend (solid, dotted, dashed, filled ceiling area, circle for events). Commits `feat: #123 colored circle markers ...`, `feat: #123 legend like line samples in profile chart hover line`.
- [x] **Step 3: Row layout**: left aligned with start padding `ps-5`, wider spacing between entries (`mx-2` around separators, `me-3` after the time). Commits `fix: #123 left align hover line with start padding`, `feat: #123 wider spacing between profile chart hover values`.
- [x] **Step 4: Shared `ChartLegendComponent` and compare dives page**: `app-chart-legend` (inputs `values`, `colors`, `labelKey`, `showTime`) registered in `app.config.ts`; `DiveTracesBuilder.uidPrefix` and `legendColors`; `ChartLegendValues.fromPoints(points, uidPrefix)`; compare dives page without Plotly box, with time row and rows for profile A and B, cleared on unhover and profiles alignment change. Commit `feat: #123 hover values above profile chart in compare dives page`.
- [x] **Step 5: Naming**: everything belonging to the legend renamed from "hover values" to "chart legend" (component, values class and file, colors, fields, test ids, CSS classes). Plotly hover names (`plotlyHover`, `withoutHoverLabels`, `hoverinfo`, ...) kept. Commits `refactor: #123 rename hover values component to chart legend`, `refactor: #123 rename hover values to chart legend`.
- [x] **Step 6: Outdated tests**: Jasmine matchers converted to Vitest during the rebase on master, the plan page legend test asserts exact values with units instead of `'5'` and `'m'` substrings (verified it fails without units).
- [x] **Step 7: Verification**: full planner suite and `npm run lint` (no errors in changed files), checked in the running app on both pages at 1280 px and 375 px.

---

## Known limitations (accepted, not part of this plan)

- When a legend row wraps (phone, or desktop with emergency and an event), the chart moves down by one row while hovering. Reserving the extra row would fix it.
- Plotly reports one point per trace, so only one event is shown when two events happen at the same time (as in the original hover box).
- A missing `y` value would be shown as `0 m` (`Number(point.y)`); the current traces never produce it.
- The help pages (`doc/profile_chart.md`, compare dives help) don't describe the legend yet.
