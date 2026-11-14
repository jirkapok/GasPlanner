# Dive way points table

Table showing details about profile changes during the dive. Each row represents one event.

* `Symbol`: Represents action executed for each row. Following values are available:
  * `Arrow down`: Descent (end depth is higher then start depth). This is always at least first row.
  * `Arrow right`: Swim at current depth
  * `Arrow up`: Ascent (end depth is lower than start depth, ending with 0 at surface). This is always e.g. last row representing ascent to surface.
  * `Switch`: Gas switch, showing level at which you stay to change tank with different mix
* `Depth` [meters] (ft): Target depth to which current action leads to.
* `Duration` [minutes]: Duration of this transition since previous row.
* `Run time` [minutes]: Absolute time since the dive started till end of current row. Calculated as total sum of all previous lines.
* `Gas` (Extended view only): Gas breathed in this row. For closed circuit rebreathers (mCCR, eCCR) it is the diluent followed by the setpoint held in the loop, e.g. `Air SP 1.3`. For pSCR it is the supply gas.

## Rebreather profiles

For rebreather dives (see [Rebreather](./rebreather.md)) the table shows two tabs:

* `Rebreather profile`: The planned dive breathed from the loop.
* `Bailout profile`: The planned dive till the deepest point followed by the emergency ascent breathed as open circuit from the bailout tanks. This is the ascent used to calculate the bailout reserve. Selecting this tab also shows the emergency ascent in the dive profile chart.

The selected tab is remembered. The `Filter to show stops only` button applies to both tabs.
