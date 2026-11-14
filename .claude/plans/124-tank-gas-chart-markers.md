# #124 Tank and Gas Chart Legend Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the numbers drawn inside the tank (bars) and consumed-gas (liters) progress charts, and give each legend entry a rounded square marker in its bar's color. In the tank chart, the orange rock bottom line becomes thicker and is shortened to the chart frame. The liters chart then gets the same bar style and layout as the tank chart.

**Architecture:** This is a template and SCSS change only, in two existing standalone components: `TankChartComponent` (`app-tankchart`, pressures) and `GasChartComponent` (`app-gaschart`, volumes). Both already share `tank-chart.component.scss`.

- Task 1 finishes the tank chart. It also adds the shared legend marker classes and the shortened, thicker `.reserve-bar` line.
- Task 2 rebuilds the liters bar from the same building blocks:
  - `combined_wrapper`, a full-height `progress-bar rounded-progress` and the same `.reserve-bar` orange line.
  - The only extra is a grey available background bar.
- No TypeScript logic or translation keys change. `ConsumedGas` already exposes `percentsAvailable`, `percentsRequired`, `percentsReserve` and `hasReserve`.

**Tech Stack:** Angular 22 standalone components (OnPush, zoneless), MDB/Bootstrap, SCSS, and Vitest browser mode with Playwright Chromium. Computed styles and layout are real, so `getComputedStyle` and `getBoundingClientRect` work in tests.

**Spec:** GitHub issue #124 "Improve tank and gas charts in results", refined by the user:

1. Tank chart in bars:
   - No numbers inside the chart.
   - The legend above the chart shows the same markers as the liters chart, in the colors of the current bars.
   - The orange reserve (rock bottom) line is thicker and its number is removed.
   - The line is shortened so it no longer reaches below the chart frame. It now ends at the frame.
2. Consumed chart in liters:
   - No numbers inside the chart.
   - Each legend item (Reserve, Consumed, Available) gets a rounded square marker in the same color as its bar.
3. The liters chart's progress bar gets the same style and layout as the tank chart.
   - The bar segments have the same height and rounding as the tank's remaining bar, inside the same frame.
   - The reserve is drawn as the same thick orange line as the tank's rock bottom, not as an orange box.
   - The header and legend layout of the liters chart stays as it is (user decision: "Bars only").

**Decision (liters bar geometry), mirroring the tank chart where the green bar runs from 0 to the end pressure and the orange line marks the reserve inside it:**

- **Grey available background:** `#bdbdbd`, from 0 to `percentsAvailable`.
- **Required bar** (reserve + consumed): green/red, from 0 to `percentsRequired`. It replaces the separate orange reserve box and the consumed box.
- **Orange reserve line:** at `percentsReserve`, the same `.reserve-bar` as the tank chart. The reserve is the part left of the line, and the consumed gas is the part between the line and the end of the required bar.
- **No reserve:** when the required gas exceeds the available gas, the grey available bar is shown from the start and a red missing bar continues after it up to the required volume (end of the scale `max(total, required)`). Changed by Task 3, originally the red required bar covered the whole scale.

## Global Constraints

- Scope is only `projects/planner/src/app/plan/tank-chart/*` and `projects/planner/src/app/plan/gas-chart/*`. Do not change the diff view chart (`diff/gasconsumed/.../diff-gas-consumed-tank-chart`).
- Keep the legend's existing values, element ids and layout.
  - E2E `e2e/eccr.spec.ts` reads `#tankRemaining-<id>` text (`188/200`).
  - Keep the gas chart classes `.reserve-value-text`, `.consumed-value-text` and `.available-value-text`.
- Keep a `role="progressbar"` element with `aria-valuemin/max/now` for every value shown. Only their text content is removed, so screen readers still get the values. In the liters chart, `aria-valuenow` is the available total, required and reserve volumes in liters.
- The markers are decorative: `aria-hidden="true"`. Add no new text and no new translation keys.
- Each marker uses the same condition as its bar: remaining (bars) and consumed (liters) are `bg-success` when `hasReserve` and `bg-danger` otherwise.
- Write no custom media queries. Run `npm run lint` before each commit.
- Commit messages: `feat: #124 ...` / `test: #124 ...`.

## Review Focus

1. **No-reserve state.** When consumed gas exceeds the usable gas (`hasReserve === false`), the remaining/consumed marker and its bar must turn red together. In the liters chart, the grey available bar stays visible from the start and the red missing bar follows it to the end (Task 3). The `bg-danger` tests in both tasks cover this.
2. **Zero-width segments.** With a 0 reserve or 0 consumption, a segment has width 0%, but its legend marker must still render with its color and size. The marker size test in Task 1 checks this.
3. **Reserve line at extreme values.** With a 0 reserve the line sits at the left frame edge. With the reserve at or above the start pressure (bars) or the scale (liters), it sits at the right edge. In both cases it must stay inside the frame and must not overflow horizontally (visual check in both tasks).
4. **Stacking order in the liters bar.** From bottom to top: grey available, then the colored required bar, then the orange line. A positioned element paints over a static one, so the required bar must be positioned as well (see Task 2 Step 4). The paint order test in Task 2 checks this.
5. **Imperial units.** The legend values still convert (psi / cuft). The existing imperial tests must stay green.

---

### Task 1: Tank chart (bars): legend markers, no numbers, thicker and shorter rock bottom line

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/plan/tank-chart/tank-chart.component.html`
- Modify: `projects/planner/src/app/plan/tank-chart/tank-chart.component.scss`
- Test: `projects/planner/src/app/plan/tank-chart/tank-chart.component.spec.ts`

**Interfaces:**

- Produces (used by Task 2) these CSS classes in `tank-chart.component.scss`:
  - `.legend-marker` is an inline-block rounded square: `display: inline-block; width: .75em; height: .75em; border-radius: .2em; vertical-align: middle;`, with `me-1` spacing applied in the template.
  - `.legend-marker-reserve` sets `background-color: darkorange`.
  - `.legend-marker-available` sets `background-color: #bdbdbd`. It is used only by Task 2, but defined here with its siblings.
  - The remaining/consumed markers use MDB `bg-success` / `bg-danger` directly.
  - `.reserve-bar` is the orange line: `position: absolute; left: 0; top: -5px; bottom: -5px; padding: 0; border-right: 4px solid darkorange;`. Its width is set by the template as the reserve percentage. It spans the `.gas-bar` frame's padding box, since the frame's vertical padding is `5px`.
- Marker markup pattern, placed as the first child of each legend `<small>`:
  `<span class="legend-marker legend-marker-reserve me-1" aria-hidden="true"></span>`
- Legend mapping in this chart: the "Gas remaining" `<small>` gets the remaining marker (`bg-success` when `tank.hasReserve`, else `bg-danger`). The "Rock bottom" `<small>` gets the `.legend-marker-reserve` marker.

- [x] **Step 1: Write the failing tests** in `tank-chart.component.spec.ts`. In the tests below, `assignConsumption(consumed, reserve)` is in bars, and the default tank is 200 bar.

```ts
const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

it('bars contain no numbers', async () => {
    tank = new TankBound(Tank.createDefault(), units);
    tank.assignConsumption(100, 50);
    fixture = await renderOnPush(TankChartComponent, { tank });
    expect(host().querySelector('.progress')?.textContent?.trim()).toBe('');
});

it('shows remaining and rock bottom markers in bar colors', async () => {
    tank = new TankBound(Tank.createDefault(), units);
    tank.assignConsumption(100, 50);
    fixture = await renderOnPush(TankChartComponent, { tank });
    const markers = host().querySelectorAll('.legend-marker');
    expect(markers.length).toBe(2);
    expect(markers[0].classList).toContain('bg-success');
    expect(markers[1].classList).toContain('legend-marker-reserve');
});

it('rock bottom marker has reserve line color and own size', async () => {
    tank = new TankBound(Tank.createDefault(), units);
    tank.assignConsumption(0, 0);
    fixture = await renderOnPush(TankChartComponent, { tank });
    const marker = host().querySelector('.legend-marker-reserve') as HTMLElement;
    expect(getComputedStyle(marker).backgroundColor).toBe('rgb(255, 140, 0)'); // darkorange
    expect(marker.getBoundingClientRect().width).toBeGreaterThan(0);
});

it('remaining marker turns red when consumption changes outside Angular events', async () => {
    tank = new TankBound(Tank.createDefault(), units);
    fixture = await renderOnPush(TankChartComponent, { tank });

    tank.assignConsumption(180, 50);
    await fixture.whenStable();

    const remainingMarker = host().querySelectorAll('.legend-marker')[0];
    expect(remainingMarker.classList).toContain('bg-danger');
});

it('rock bottom line is thicker', async () => {
    tank = new TankBound(Tank.createDefault(), units);
    tank.assignConsumption(100, 50);
    fixture = await renderOnPush(TankChartComponent, { tank });
    const line = host().querySelector('.reserve-bar') as HTMLElement;
    expect(getComputedStyle(line).borderRightWidth).toBe('4px');
});

it('rock bottom line is shortened to the chart frame', async () => {
    tank = new TankBound(Tank.createDefault(), units);
    tank.assignConsumption(100, 50);
    fixture = await renderOnPush(TankChartComponent, { tank });
    const frame = host().querySelector('.gas-bar') as HTMLElement;
    const frameRect = frame.getBoundingClientRect();
    const lineRect = (host().querySelector('.reserve-bar') as HTMLElement).getBoundingClientRect();
    const border = parseFloat(getComputedStyle(frame).borderTopWidth);
    // spans the frame padding box: from inner top edge to inner bottom edge of the frame border
    expect(lineRect.top).toBeCloseTo(frameRect.top + border, 0);
    expect(lineRect.bottom).toBeCloseTo(frameRect.bottom - border, 0);
});
```

- [x] **Step 2: Run the tests and confirm they fail**

Run: `npx ng test planner --no-watch --include='**/tank-chart.component.spec.ts'`
Expected: the 6 new tests FAIL.

- There are no markers yet, and the bar text contains `50`/`100`.
- The line border is `2px`.
- The line (`height: 4em`) reaches below the frame.

- [x] **Step 3: Update `tank-chart.component.html`.**
  - Add the two markers.
  - Remove the `reserve-overlay` / `reserve-value` block and the `{{endPressure ...}}` text from the remaining bar.
  - Remove the `rounded-progress` class from the reserve bar div. Its `height: 100%` would override `bottom`.

- [x] **Step 4: Update `tank-chart.component.scss`.**
  - Add the marker classes and set `.reserve-bar` exactly as listed under Interfaces.
  - Remove from `.reserve-bar`: `height: 4em`, `top: -.1em`, `font-size: .75em` and `text-align: right`. These only existed to place the number below the bar.
  - Delete the unused `.reserve-overlay` and `.reserve-value` rules. Do not touch the diff chart's own `.reserve-value` in its own scss.

- [x] **Step 5: Run the tests and confirm they pass**

Run: `npx ng test planner --no-watch --include='**/tank-chart.component.spec.ts'` and then `npx ng test planner --no-watch --include='**/gas-chart.component.spec.ts'`. The gas chart shares this scss, so run both.
Expected: all tests PASS.

- [x] **Step 6: Visual check (Review Focus 2, 3).** Run `npm start` and open the plan with 2 tanks, including one with no reserve (red). Check the following:
  - The rock bottom line spans only the bar frame and ends at its bottom border.
  - The line stays inside the frame with a 0 reserve and with a reserve equal to the start pressure.
  - Markers are aligned with the legend text, on both desktop and mobile width.

- [x] **Step 7: Lint**

Run: `npm run lint`
Expected: `All files pass linting.`

- [x] **Step 8: Commit**

```bash
git add projects/planner/src/app/plan/tank-chart
git commit -m "feat: #124 tank chart legend markers and shorter thicker rock bottom line"
```

---

### Task 2: Gas chart (liters): legend markers, no numbers, bar styled like the tank chart

- [x] Status

**Files:**

- Modify: `projects/planner/src/app/plan/gas-chart/gas-chart.component.html`
- Modify: `projects/planner/src/app/plan/gas-chart/gas-chart.component.scss`
- Test: `projects/planner/src/app/plan/gas-chart/gas-chart.component.spec.ts`

**Interfaces:**

- Consumes from Task 1:
  - `.legend-marker`, `.legend-marker-reserve`, `.legend-marker-available`, `bg-success`/`bg-danger`, and the marker markup pattern.
  - The `.reserve-bar` line.
  - The existing `combined_wrapper` and `rounded-progress` classes from `tank-chart.component.scss`.
- Legend mapping in this chart:
  - Reserve gets the `.legend-marker-reserve` marker.
  - Consumed gets a marker with `bg-success` when `consumed.hasReserve`, else `bg-danger`.
  - Available gets the `.legend-marker-available` marker.
- Bar markup inside `.progress.gas-bar`, in this DOM (paint) order:
  1. Available bar: `<div class="combined_wrapper">` → `<div role="progressbar" class="available-bar rounded-progress" [style.width]="consumed.percentsAvailable + '%'" [attr.aria-valuenow]="consumed.total">`
  2. Required bar: `<div role="progressbar" [ngClass]="{'progress-bar rounded-progress required-bar': true, 'bg-success': consumed.hasReserve, 'bg-danger': !consumed.hasReserve}" [style.width]="consumed.percentsRequired + '%'" [attr.aria-valuenow]="consumed.required">`
  3. Reserve line: `<div role="progressbar" class="reserve-bar" [style.width]="consumed.percentsReserve + '%'" [attr.aria-valuenow]="consumed.reserve">`
  
  All three get `aria-valuemin="0"` and `[attr.aria-valuemax]="consumed.scale"`.
- `gas-chart.component.scss` keeps only these rules:
  - `.available-bar { position: absolute; left: 0; top: 0; background-color: #bdbdbd; }`. Its height comes from `rounded-progress`.
  - `.required-bar { position: relative; }`. It paints above the absolutely positioned available bar.
  - Delete `.stacked-wrapper`, `.reserve-bar-stacked` and `.consumed-bar`.

- [x] **Step 1: Write the failing tests** in `gas-chart.component.spec.ts`. Add a new `describe('Bars like tank chart')` that uses the existing `render(total, consumed, reserve)` helper. In these tests, `required = consumed + reserve` and `scale = max(total, required)`.

```ts
const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
const rect = (selector: string): DOMRect => (host().querySelector(selector) as HTMLElement).getBoundingClientRect();

it('bars contain no numbers', () => {
    render(3000, 1500, 500);
    expect(host().querySelector('.progress')?.textContent?.trim()).toBe('');
});

it('shows reserve, consumed and available markers in bar colors', () => {
    render(3000, 1500, 500);
    const markers = host().querySelectorAll('.legend-marker');
    expect(markers.length).toBe(3);
    expect(markers[0].classList).toContain('legend-marker-reserve');
    expect(markers[1].classList).toContain('bg-success');
    expect(markers[2].classList).toContain('legend-marker-available');
});

it('consumed marker and required bar are red without reserve', () => {
    render(3000, 2800, 500);
    expect(host().querySelectorAll('.legend-marker')[1].classList).toContain('bg-danger');
    expect(host().querySelector('.required-bar')?.classList).toContain('bg-danger');
});

it('required bar spans reserve and consumed from the start', () => {
    render(3000, 1500, 500); // scale 3000, required 2000
    const wrapper = rect('.combined_wrapper');
    const required = rect('.required-bar');
    expect(required.left).toBeCloseTo(wrapper.left, 0);
    expect(required.width / wrapper.width).toBeCloseTo(2000 / 3000, 2);
});

it('available, required and tank remaining bars have the same height', () => {
    render(3000, 1500, 500);
    const wrapper = rect('.combined_wrapper');
    expect(rect('.available-bar').height).toBeCloseTo(wrapper.height, 0);
    expect(rect('.required-bar').height).toBeCloseTo(wrapper.height, 0);
});

it('reserve is the orange line at reserve position spanning the frame', () => {
    render(3000, 1500, 500); // reserve at 1/6 of scale
    const frame = host().querySelector('.gas-bar') as HTMLElement;
    const frameRect = frame.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(frame).borderTopWidth);
    const wrapper = rect('.combined_wrapper');
    const line = host().querySelector('.reserve-bar') as HTMLElement;
    const lineRect = line.getBoundingClientRect();
    expect(getComputedStyle(line).borderRightColor).toBe('rgb(255, 140, 0)');
    expect(getComputedStyle(line).borderRightWidth).toBe('4px');
    expect(lineRect.width / wrapper.width).toBeCloseTo(500 / 3000, 2);
    expect(lineRect.top).toBeCloseTo(frameRect.top + border, 0);
    expect(lineRect.bottom).toBeCloseTo(frameRect.bottom - border, 0);
});

it('paints required bar over available and line over both', () => {
    render(3000, 1500, 500);
    const wrapper = rect('.combined_wrapper');
    const y = wrapper.top + wrapper.height / 2;
    // inside required bar, right of the reserve line
    const insideRequired = document.elementFromPoint(wrapper.left + wrapper.width * 0.5, y);
    expect(insideRequired?.classList).toContain('required-bar');
    // right of required bar, inside available
    const insideAvailable = document.elementFromPoint(wrapper.left + wrapper.width * 0.9, y);
    expect(insideAvailable?.classList).toContain('available-bar');
    // on the reserve line's right border
    const line = rect('.reserve-bar');
    const onLine = document.elementFromPoint(line.right - 2, y);
    expect(onLine?.classList).toContain('reserve-bar');
});

it('red required bar extends past available without reserve', () => {
    render(3000, 2800, 500); // scale 3300
    expect(rect('.required-bar').width).toBeGreaterThan(rect('.available-bar').width);
});
```

- [x] **Step 2: Run the tests and confirm they fail**

Run: `npx ng test planner --no-watch --include='**/gas-chart.component.spec.ts'`
Expected: the new tests FAIL.

- There are no markers, no `.required-bar`, `.combined_wrapper` or `.reserve-bar` yet.
- The progress text contains `500` / `1,500`.

- [x] **Step 3: Update `gas-chart.component.html`.**
  - Add the three legend markers.
  - Replace the content of `.progress.gas-bar` with the three bars listed under Interfaces, with no text inside them.
  - Leave the header and legend rows otherwise unchanged.

- [x] **Step 4: Update `gas-chart.component.scss`** to contain only the two rules listed under Interfaces.

- [x] **Step 5: Run the tests and confirm they pass**

Run: `npx ng test planner --no-watch --include='**/gas-chart.component.spec.ts'`
Expected: all tests PASS, including the existing metric and imperial tests.

- [x] **Step 6: Visual check (Review Focus 1, 3, 4).** Run `npm start` and open the results with both charts visible, using one gas with a reserve and one without. Check the following:
  - The liters bar has the same frame, bar height and rounding as the tank bar.
  - The orange line looks identical in both charts.
  - The red required bar extends past the grey available bar.
  - With 0 consumption, only the line and the grey background are visible, and nothing overflows the frame.
  - Check on both desktop and mobile width.

- [x] **Step 7: Lint and full planner tests**

Run: `npm run lint` and then `npm run test-ci`
Expected: lint is clean and all planner tests pass.

- [x] **Step 8: Commit**

```bash
git add projects/planner/src/app/plan/gas-chart
git commit -m "feat: #124 gas chart legend markers and bars styled like tank chart"
```

---

### Task 3: Gas chart (liters): grey available followed by red missing gas when not enough gas

- [x] Status

User request after the review: when the required gas is higher than the available gas, the left part of the bar shows the grey available gas and the rest up to the required volume is red.

**Files:**

- Modify: `projects/scuba-physics/src/lib/consumption/consumptionByGas.ts`: `ConsumedGas.percentsMissing: number`, the part of the required gas not covered by the available gas in percents of scale (0 with enough gas).
- Test: `projects/scuba-physics/src/lib/consumption/consumptionByGas.spec.ts`
- Modify: `projects/planner/src/app/plan/gas-chart/gas-chart.component.html`, `.scss`
- Test: `projects/planner/src/app/plan/gas-chart/gas-chart.component.spec.ts`

**Interfaces:**

- With enough gas (`consumed.hasReserve`): the green `.required-bar` from 0 to `percentsRequired`, unchanged.
- Without enough gas: no `.required-bar`. A red `.missing-bar` (`progress-bar rounded-progress missing-bar bg-danger`, `position: absolute; top: 0`) with `left: percentsAvailable%` and `width: percentsMissing%`. The orange reserve line stays on top.

- [x] **Step 1: Write the failing tests**: lib tests "Missing is part of required not covered by available" and "No missing gas when available covers required"; planner tests "consumed marker and missing bar are red without reserve", "shows grey available from the start instead of required bar", "red missing bar continues after available to the end", "has no missing bar with enough gas".
- [x] **Step 2: Run them and confirm they fail** (missing property; no `.missing-bar`).
- [x] **Step 3: Implement `percentsMissing`, run `npm run build-lib`, then update the template and scss.**
- [x] **Step 4: Run the tests and confirm they pass**, then visual check at 45 m depth.
- [x] **Step 5: Lint, `npm run test-lib-ci` and `npm run test-ci`.**
- [x] **Step 6: Commit** `feat: #124 gas chart shows missing gas in red after available gas`
