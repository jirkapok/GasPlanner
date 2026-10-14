# Rebreather

Besides open circuit, you can plan dives with a rebreather. Select the breathing apparatus in the dropdown in the header of the `Tanks` card.

> Rebreathers are available only in the Extended (Trimix) view. Switching to the simple view returns the dive to open circuit.

Supported types:

* `Open circuit` (default): You breathe directly from the tank assigned to the depth level.
* `pSCR`: Passive semi-closed rebreather.
* `mCCR`: Manual closed circuit rebreather.

When a rebreather is selected, the `Tanks` card shows two tabs:

* `Tanks`: The same list of tanks as for open circuit. You assign tanks to depth levels the same way as for open circuit. The same tanks also define the bailout gases.
* `Rebreather`: Options of the selected rebreather type. Each type shows only its own options.

## pSCR

A passive semi-closed rebreather dumps a fixed part of every breath and replaces it with fresh gas from the tank. The tank assigned to a depth level is the **supply gas** for that level.

The gas you breathe from the loop is leaner than the supply gas, because your body consumes oxygen from it. The loop oxygen fraction is calculated as a steady state:

`fO2 loop = (fO2 supply × V − VO2) / (V − VO2)`, where `V = RMV × ambient pressure / injection ratio`.

* `Injection ratio`: Ratio of breathed volume to dumped volume. E.g. 8 means 1/8 of each breath is replaced with fresh supply gas. Range 4 - 20, default 8.
* `Metabolic O2 [l/min]`: Oxygen consumed by your body. Range 0.5 - 4 l/min, default 1 l/min.

The loop gas gets leaner when you ascend, because less fresh gas is added at lower ambient pressure. At shallow depths the loop may become hypoxic, even with a nitrox supply gas. In such case the planner shows `Low ppO2` warning.
The decompression, oxygen toxicity (CNS, OTU), gas density and narcotic depth are calculated from the loop gas.

Gas consumption of the supply tank is `RMV × ambient pressure / injection ratio`, which is much lower than for open circuit.

## mCCR

A manual closed circuit rebreather adds oxygen to the loop by a needle valve with constant mass flow. Its flow is usually set slightly below your metabolic oxygen consumption. You watch the ppO2 displays and hold the loop at your target ppO2: you add oxygen manually, when the ppO2 drops, or flush the loop with diluent, when it rises. The rebreather doesn't control the ppO2 by itself.

* `Target ppO2 [bar]`: The ppO2 you hold in the loop during the whole dive. The planner uses it for decompression, oxygen toxicity (CNS, OTU), gas density and narcotic depth. Range 0.4 - 1.6 bar, default 1.3 bar.
* `O2 flow [l/min]`: Constant mass flow of the needle valve. It defines only the oxygen consumption. Range 0.3 - 3 l/min, default 0.8 l/min.
* `Loop volume [l]`: Volume of the breathing loop, used to calculate the diluent added during descent. Range 2 - 10 l, default 6 l.
* `Metabolic O2 [l/min]`: Oxygen consumed by your body. Range 0.5 - 4 l/min, default 1 l/min.

The loop can't hold a ppO2 lower than the diluent ppO2 at the current depth (diluent flush), nor higher than the ambient pressure (pure oxygen at shallow depth). In such case the planner uses the reachable ppO2. There are no gas switches and no air breaks during the dive, you stay on the loop until the surface.

### Tanks

* Tank 1 is the **diluent**. You can change its gas.
* Tank 2 is the **oxygen**. Its gas is always 100 % oxygen, you can change only its size and pressure.
* Both tanks can't be removed. All other tanks are bailout tanks.

When you switch to mCCR, the planner prepares the tanks without overwriting any of them: an existing oxygen tank is moved to position 2, otherwise a new 3 l/200 bar oxygen tank is added as tank 2. Switching back to open circuit keeps the order of the tanks.
If tank 2 doesn't contain oxygen (e.g. in a shared link), the dive can't be calculated and the planner shows an error.

### Consumption

* Oxygen: The higher of the O2 flow and the metabolic O2 for the whole dive. If the flow is lower than your consumption, the rest is added manually.
* Diluent: Only the loop volume added during descent, `loop volume × pressure difference`. The diluent used for flushing the loop isn't calculated.

## Bailout and reserve

The emergency ascent is used to calculate the rock bottom reserve. The user defined part of the dive, including the deepest point, is breathed from the loop. The diver bails out at the start of the generated ascent, and only this ascent is breathed as **open circuit** from the bailout tanks. For mCCR all tanks are bailout gases, including the diluent and the oxygen tank. Because the leaner loop gas loads the tissues more, the bailout ascent may need longer decompression than the same dive on open circuit. The ascent is consumed using the stress RMV and the same rules as for open circuit dives (see [Tanks](./tanks.md)).

## Limits

* Electronic closed circuit rebreathers will follow.
* The pSCR loop gas is calculated as a steady state. Changes of the loop after depth or gas change are not modeled.
* A hypoxic loop (ppO2 below 0.18 bar) is shown as `Low ppO2` warning. A loop with too high ppO2 isn't reported yet, the high ppO2 warning is evaluated for the supply gas (pSCR) or diluent (mCCR).
