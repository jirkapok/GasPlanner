# Calculated results

* Consumed gas charts
* Dive way points table
* Dive profile chart



## Dive way points table

Table showing details about profile changes during the dive. Each row represents one event.

* `Symbol`: Represents action executed for each row. Following values are available:
  * `Arrow down`: Descent (end depth is higher then start depth). This is always at least first row.
  * `Arrow right`: Swim at current depth
  * `Arrow up`: Ascent (end depth is lower than start depth, ending with 0 at surface). This is always e.g. last row representing ascent to surface.
  * `Switch`: Gas switch, showing level at which you stay to change tank with different mix
* `Depth` [meters] (ft): Target depth to which current action leads to.
* `Duration` [minutes]: Duration of this transition since previous row.
* `Run time` [minutes]: Absolute time since the dive started till end of current row. Calculated as total sum of all previous lines.

## Dive profile chart

Graphical representation how the calculated depth changes in time. This corresponds to precise values shown in the way points table. Move mouse over the chart to focus related row in the waypoints table.

* `Dive profile`: Blue line showing diver depth at each moment during the dive.
* `Ceiling`: Orange line showing minimum depth at which diver needs to stay to decompress before he continues with ascent.
* `Average depth`: Dotted line showing average depth at each moment of the dive. This is useful for consumption calculations.

Why is deco shown in the chart, if profile is still considered a no deco?
In some plans you already reach small amount of ceiling, which disappears during the ascent even without any decompression stop. So you are still free to ascent directly to the surface. These kind of dives are still considered as no decompression.

> In the chart profile, the blue line should never cross the orange line!

