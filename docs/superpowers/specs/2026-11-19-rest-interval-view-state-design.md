# Rest interval owned by the chart components — design

Branch: `feat/show-tissues-after-dive`

## Intent

The rest interval (time spent on the surface after the dive) only drives the tissue heatmap: how the
loaded tissues keep desaturating after surfacing. It is a viewing setting of a chart, not part of the
dive plan. So it moves out of the shared `DiveSchedules` state into the two chart components, each
keeping its own value, persisted only as part of that view's state.

## Goals

- Planner profile chart and diff profile chart each have their own, independent rest interval.
- The value is used only to calculate the after-dive tissue over-pressures for the heatmap
  (and, unchanged, to extend the depth line so the chart stays aligned with the heatmap).
- Values are persisted only in the view states (`SubViewStorage` / `ViewStates`):
  - planner → `DashBoardViewState.restInterval`
  - diff → `DiffViewState.restInterval`, written only by `DiffComponent.saveState()`.
- After an app reload, both charts show their last used rest interval.

## Non-goals / anti-goals

- Not stored in `DiveSchedule`, `DiveSchedules`, `DiveResults`, the dive DTOs or the shared plan URL.
- Calculated after-dive over-pressures are never stored in `DiveResults`, they are computed on each plot.
- No change to how the heatmap or depth line look or are calculated today.
- Changing the rest interval must not trigger a dive recalculation (`sendInfoCalculated`), only a redraw of
  the owning chart.

## Approaches considered

- **A. Each value lives in the service behind its chart** (`ProfileComparatorService`, `SubViewStorage`).
  Not chosen.
- **B. Each chart component holds its own value** — **chosen**, with the diff value written into
  `DiffViewState` through `DiffComponent` (so only one place writes that state and the fields can't
  overwrite each other).
- C. Service-driven input with component-level providers per chart. Rejected: hides where the value comes
  from and still needs separate save paths.

## Design

### `RestIntervalComponent` (presentational)

- No longer injects `DiveSchedules` or `ReloadDispatcher`.
- Exposes `restInterval = model<number>(0)` (seconds), two-way bound by the host: `[(restInterval)]`.
- The text field syncs from the model (formatted `HH:MM`) and writes a valid parsed value back to the model.
- The preset menu items (0 min, 30 min, 1 h, 2 h) set the model directly.
- Validation (0–24 h, `ValidatorGroups.restInterval`) and the error message stay as they are.

### Planner — `ProfileChartComponent`

- Holds `restInterval` as a signal, initialized from `SubViewStorage` (dashboard view state, default `0`).
- Template: `<app-rest-interval [(restInterval)]="restInterval" />`.
- On change: saves through `SubViewStorage` and redraws its charts (`plotAllCharts`).
- Heatmap: `schedules.selected.overPressuresWithSurfaceInterval(restInterval())`, as now.
- `ChartPlotterFactory.withRestInterval(() => this.restInterval())`, as now.

### `SubViewStorage` / `DashBoardViewState`

- `DashBoardViewState` gets optional `restInterval?: number` (optional, so older saved preferences still load;
  missing means `0`).
- `SubViewStorage` exposes the main view rest interval (getter + setter that saves immediately).
- `saveMainView()` must keep the stored rest interval, so the periodic main view save
  (`DelayedScheduleService`, `StartUp`) does not reset it to `0`. The value loaded from preferences must be
  picked up after `Preferences.applyApp` (builder's call how, e.g. reading it from `ViewStates` when not set yet).

### Diff — `DiffComponent`, `ProfileDifferenceChartComponent`, `ProfileComparatorService`

- `DiffViewState` gets optional `restInterval?: number` (missing means `0`).
- `DiffComponent` loads it in `loadState()`, holds it as a signal and passes it down:
  `<app-diff-profilechart [(restInterval)]="restInterval" />`; on change it calls `saveState()`, which writes
  it together with profiles and `alignByEnd`.
- `ProfileDifferenceChartComponent` gets `restInterval = model<number>(0)`, binds it to its
  `<app-rest-interval [(restInterval)]>`, redraws on change, and passes it to both
  `withRestInterval(...)` trace builders.
- `ProfileComparatorService` no longer reads a rest interval: `overPressures` becomes
  `overPressures(restInterval: number)`; the start/end aligned calculations stay the same.

### Removed from `DiveSchedules`

- `_restInterval`, `restInterval` getter/setter and the `apply*RestInterval()` methods, with their tests.
- `DiveSchedule.overPressuresWithSurfaceInterval()` stays (pure on-demand calculation, nothing stored).

## Testing

- `RestIntervalComponent`: model → input text, typing valid value → model, presets → model, invalid input shows
  the message and does not change the model.
- `ProfileChartComponent`: loads initial value from the view state, change saves into the dashboard view state.
- `DiffComponent`: loads `restInterval` from `DiffViewState` (missing → 0), change from the chart saves it.
- `ProfileComparatorService`: `overPressures(restInterval)` tests replace the ones setting `schedules.restInterval`.
- `SubViewStorage`: main view save keeps the rest interval.

## Left to the builder

- Exact way `SubViewStorage` picks up the loaded rest interval after start-up.
- Naming of the `SubViewStorage` accessor.
