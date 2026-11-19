# Rest interval heatmap tissues in a web worker — design

Branch: `feat/show-tissues-after-dive`

## Intent

The tissue over-pressures after the dive (rest interval part of the heatmap) are calculated on the main thread,
one sample per second (24 h = 86 400 samples × 16 tissues), blocking the UI. Move the calculation into a web
worker, so the UI stays responsive.

## Goals

- The rest interval tissues are calculated in a background task (web worker), never on the main thread.
- Option A while calculating: the heatmap immediately shows the dive part, the rest interval part is appended
  by a redraw once the worker responds.
- A new request cancels a running (outdated) calculation; outdated results are never drawn.
- Planner and diff charts keep independent values and requests (diff: one request per profile).

## Non-goals / anti-goals

- Results are not stored in `DiveResults`; heatmap content and depth line stay the same as now.
- No change to the algorithm, sampling or the `scuba-physics` API.
- No calculation while the heatmap is hidden (as now).

## Approaches considered

- **Restartable worker task owned by a small per-chart helper** — **chosen**. Reuses `RestartableBackgroundTask`
  (as the dive computer worker does) so a 24 h calculation can be interrupted, and keeps the planner and the
  two diff profiles independent.
- Extend the dive info worker with the rest interval — rejected: a rest interval change would recalculate the
  whole dive info and the result would end up in `DiveResults`.
- One shared injectable service — rejected: planner and diff (two profiles) would cancel each other's requests.

## Design

- DTOs (`serialization.model.ts`):
  - `RestIntervalRequestDto { tissues: LoadedTissueDto[]; altitude: number; restInterval: number }`
  - `RestIntervalResultDto { tissueOverPressures: TissueOverPressures[] }`
- `PlanningTasks.restIntervalTissues(request): RestIntervalResultDto` — pure, runs
  `BuhlmannAlgorithm.applySurfaceIntervalStatistics` (moved from `DiveSchedule.overPressuresWithSurfaceInterval`).
- `workers/restInterval.worker.ts` calls it; `WorkersFactory.createRestIntervalWorker()` returns
  `RestartableBackgroundTask`, `WorkersFactoryCommon` the synchronous fallback (`cancel` is a no-op).
- `shared/restIntervalTissues.ts` — `RestIntervalTissues` (plain class, one per heatmap, created by the chart with
  the injected workers factory):
  - `calculate(dive: DiveResults, altitude: number, restInterval: number): void` — cancels the running task;
    no dive info → `[]`; rest `0` or dive not ending on surface → dive tissues only, no request; otherwise
    publishes dive tissues immediately and requests the rest part.
  - `overPressures: Signal<TissueOverPressures[]>` — dive tissues, later dive + rest tissues.
  - Failure of the worker leaves the dive tissues shown.
- Planner chart: one `RestIntervalTissues`; `plotAllCharts` calls `calculate(...)` when the heatmap is shown;
  an effect plots the heatmap whenever `overPressures` changes.
- Diff: chart owns two `RestIntervalTissues` (A, B). `ProfileComparatorService` keeps the alignment logic:
  - `restIntervals(rest): { profileA: number; profileB: number }` — start aligned: shorter dive gets `rest + diff`;
    end aligned: both `rest`.
  - `alignOverPressures(a, b): SaturationComparison` — end aligned pads the shorter one with empty rows (as now).
  - The chart calls `calculate` for both on redraw and plots both heatmaps from `alignOverPressures` in an effect.
- `DiveSchedule.overPressuresWithSurfaceInterval` and `ProfileComparatorService.overPressures` are removed.

## Testing

- `PlanningTasks.restIntervalTissues`: sample count equals rest interval, values drop over time.
- `RestIntervalTissues` (with `WorkersFactoryCommon` and a fake restartable task): immediate dive part, appended rest
  part, no dive info → `[]`, rest 0 → no request, new request cancels the previous, outdated result ignored.
- `ProfileComparatorService`: `restIntervals` start/end aligned, `alignOverPressures` padding.
- Chart component tests: heatmap plotted with dive part, then with appended part; calculation not requested while
  the heatmap is hidden.
