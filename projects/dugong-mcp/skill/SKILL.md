---
name: dugong-dive-planner
description: Plans recreational and technical open circuit scuba dives with the Dugong Gas Planner (Bühlmann ZHL-16C with gradient factors) - decompression stops, runtime, gas consumption and reserve per tank, oxygen toxicity (CNS, OTU), gas density and warnings. Use it when the user asks to plan a dive, check if the gas is enough or which decompression stops a dive needs.
---

# Dugong dive planner

Version: 0.0.0

Calculates a dive plan with the same code as the Dugong Gas Planner application (<https://dugong.online>).
Never calculate the plan yourself, always run the bundled command.

## When to use

- The user wants to plan a single level open circuit scuba dive: depth, bottom time and tanks.
- The user asks about decompression stops, the no decompression limit, gas consumption, reserve or oxygen toxicity of such a dive.

Not supported in this version: multilevel dives, repetitive dives (surface interval), rebreathers (CCR, pSCR) and
the application calculators (SAC, nitrox, blending, ...). Say so instead of guessing.

## How to run

Node.js 20 or newer is required. Write the input JSON to a file and run from this Skill directory:

```bash
node scripts/dugong.mjs plan_dive --input dive.json
```

or pass the JSON on the standard input: `node scripts/dugong.mjs plan_dive < dive.json`.
Exit code 0 prints the plan as JSON, exit code 1 prints `{ "errors": ["field: message", ...] }`: fix the input
(or ask the user) and run again.

## Input

All units are metric. Example: [examples/air-30m.json](examples/air-30m.json).

- `depth` (required): maximum depth in meters, more than 0 up to 350.
- `bottomTime` (required): minutes from the start of the dive (including the descent) to the start of the ascent, 1 - 1440.
- `tanks` (required, at least one): the first tank is the bottom gas, the others are decompression gases.
  - `size`: water volume in liters, 1 - 50 (e.g. 15, or 24 for twin 12 l).
  - `startPressure`: pressure of the filled tank in bars, 1 - 350.
  - `o2`: oxygen content in %, 1 - 100 (21 for air, 32 for EAN32, 50 for EAN50, 100 for oxygen).
  - `he`: helium content in %, 0 - 99, default 0. `o2` + `he` must not exceed 100.
- `options` (optional, defaults are the same as for a new dive in the application):
  - `gfLow`, `gfHigh`: gradient factors in %, 10 - 120, default 40 / 85, `gfLow` must not be higher than `gfHigh`.
  - `salinity`: `fresh` (default), `brackish` or `salt`.
  - `altitude`: altitude of the dive site in meters, 0 - 5000, default 0.
  - `maxPpO2`, `maxDecoPpO2`: maximum oxygen partial pressure at the bottom / during decompression in bars, default 1.4 / 1.6.
  - `ascentSpeed50perc`, `ascentSpeed50percTo6m`, `ascentSpeed6m`, `descentSpeed`: meters/minute, default 9, 3, 3, 18.
  - `lastStopDepth`: last decompression stop in meters, 3 - 6, default 3.
  - `safetyStop`: `never`, `auto` (default, dives deeper than 10 m) or `always`.
  - `gasSwitchDuration`, `problemSolvingDuration`: minutes, 1 - 100, default 2 / 1.
- `diver` (optional): `rmv` respiratory minute volume in liters/minute, 5 - 90, default 20; `stressRmv` default 1.5 x `rmv`.

## Output

- `noDecoDive`, `noDecoLimit` (min), `runtime` (min), `timeToSurface` (min, emergency ascent), `maxDepth`, `averageDepth` (m).
- `decoStops`: `{ depth, duration, gas }` of the ascent incl. gas switches and the safety stop.
- `tanks`: per tank `startPressure`, `endPressure`, `reservePressure` (bar), `consumedVolume` (l), `hasReserve`.
- `cns` (%), `otu`, `maxDensity` (g/l at depth).
- `events`: warnings and errors, e.g. `lowPpO2`, `highPpO2`, `highGasDensity`, `noDecoEnd`, with a message.
- `errors`: the plan was not calculated when not empty.
- `disclaimer`: text to show to the user.

## Rules

- Always show the `disclaimer` to the user with the plan.
- Never present the plan as authoritative: it is for planning and education, the diver verifies it with their training and dive computer.
- Always report tanks with `hasReserve: false` and all `events` to the user.
