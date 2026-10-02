# Rebreather

Besides open circuit, you can plan dives with a rebreather. Select the breathing apparatus in the dropdown in the header of the `Tanks` card.

> Rebreathers are available only in the Extended (Trimix) view. Switching to the simple view returns the dive to open circuit.

Supported types:

* `Open circuit` (default): You breathe directly from the tank assigned to the depth level.
* `pSCR`: Passive semi-closed rebreather.

When a rebreather is selected, the `Tanks` card shows two tabs:

* `Tanks`: The same list of tanks as for open circuit. You assign tanks to depth levels the same way as for open circuit. The same tanks also define the bailout gases.
* `Rebreather`: Options of the selected rebreather type.

## pSCR

A passive semi-closed rebreather dumps a fixed part of every breath and replaces it with fresh gas from the tank. The tank assigned to a depth level is the **supply gas** for that level.

The gas you breathe from the loop is leaner than the supply gas, because your body consumes oxygen from it. The loop oxygen fraction is calculated as a steady state:

`fO2 loop = (fO2 supply × V − VO2) / (V − VO2)`, where `V = RMV × ambient pressure / injection ratio`.

* `Injection ratio`: Ratio of breathed volume to dumped volume. E.g. 8 means 1/8 of each breath is replaced with fresh supply gas. Range 4 - 20, default 8.
* `Metabolic O2 [l/min]`: Oxygen consumed by your body. Range 0.5 - 3 l/min, default 1 l/min.

The loop gas gets leaner when you ascend, because less fresh gas is added at lower ambient pressure. At shallow depths the loop may become hypoxic, even with a nitrox supply gas. In such case the planner shows `Low ppO2` warning.
The decompression, oxygen toxicity (CNS, OTU), gas density and narcotic depth are calculated from the loop gas.

Gas consumption of the supply tank is `RMV × ambient pressure / injection ratio`, which is much lower than for open circuit.

## Bailout and reserve

The emergency ascent used to calculate the rock bottom reserve is always calculated as **open circuit** from the tanks, using the stress RMV and the same rules as for open circuit dives (see [Tanks](./tanks.md)).

> The bottom part of the emergency ascent is also calculated as open circuit, not from the loop gas. For pSCR this may underestimate the decompression of the bailout ascent.

## Limits

* Only `pSCR` is available now. Manual and electronic closed circuit rebreathers will follow.
* The loop gas is calculated as a steady state. Changes of the loop after depth or gas change are not modeled.
* A hypoxic loop (ppO2 below 0.18 bar) is shown as `Low ppO2` warning. A loop with too high ppO2 isn't reported yet, the high ppO2 warning is evaluated for the supply gas.
