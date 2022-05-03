# Calculated results (Dive info)

* `Time to surface (TTS)` [minutes]: Total duration of ascent from critical point of dive in case of emergency. Problem solving duration minutes are added to ascent duration to be able respond to situation at depth as recommended during scuba trainings.
* `No decompression time` [minutes]: The longes time diver can stay at required depth where direct ascent to the surface is considered to be safe.
* `Maximum bottom time` [minutes]: The longest time diver can stay at required depth considering provided gases
* `Rock bottom at` time: The moment at which the emergency ascent is calculated used to calculate the rock bottom. It is the last moment at highest depth.

> **Emergency ascent may differ from calculated ascent**, because it is calculated at different time during the dive.

## Events causing errors and warnings

In case of any issue with the plan, Notification messages are shown bellow the dive table colored by red for errors and yellow for warnings. Warning should be understood so that the dive isn't optimal and there is low risk of problems. Error means, that the plan doesn't make sense or probably will end in dead. There are also informative messages

| Event | Risk | Solution |
| --- | --- | --- |
| Not enough gas | Easy, right? | Provide more tanks, use larger tank or reduce planned depth or duration |
| High ppO2 | High content of oxygen increase risk of oxygen toxicity which may cause convulsions, drowning or dead | Use gas with lower oxygen content or reduce planned depth |
| Low ppO2 | At that point the gas is hypoxic and may cause drowning or dead, in case partial pressure of oxygen is bellow 0.18 | Use gas with higher oxygen content at these depths |
| High ascent speed | User defined part of the dive with high risk of micro-bubbles which cause higher risk of DCS | Enlarge the ascent duration |
| High descent speed | Higher risk of ear (or other cavities) barotrauma | Enlarge the descent duration |
| Broken ceiling | In user defined part of the dive profile you reach lower depth than current ceiling, which increases risk of DCS | Fix the profile, so always stay bellow the ceiling |
| Narcotic depth exceeded | Even the gas is breathe able at this depth, there is higher risk of gas narcotic effects. Usually this applies to deep air dives | Plan shallower dive or use gas for higher depths (Trimix) |
| Switch to gas with higher N2 content | There is a risk of Isobaric counter diffusion | Choose another decompression gas with lower nitrogen content |

> This is the main purpose of this application: to reduce these risks!

Read more about

* [Decompression sickness](https://en.wikipedia.org/wiki/Decompression_sickness) (DCS)
* [Cavities bartrauma](https://en.wikipedia.org/wiki/Barotrauma)
* [Oxygen toxicity](https://en.wikipedia.org/wiki/Oxygen_toxicity#Underwater)
* [Hypooxia](https://en.wikipedia.org/wiki/Hypoxia_(medical))
* [Isobaric counter diffusion](https://en.wikipedia.org/wiki/Isobaric_counterdiffusion)

## Consumed gas charts

![Tank consumed and reserve](./tank_consumption_reserve.png)

* `Gas remaining`: The consumed gas is extracted from tank Start pressure. Example shows not enough gas to realize the dive. Only 97 bars are remaining from 200 bars. But the reserve is 104 bars, which should be still present in the tank after you reach the surface from dive without any issue.
* `Rock bottom` [bars]: Minimum amount of gas (reserve) required for safe ascent in case of emergency for two divers under stress. It is shown for each defined tank. These values are calculated at "Rock bottom at" time.

> If diver defines 20 Liters/minute his RMV, than the Rock bottom counts with 60 liters/minute breathing rate for both divers during emergency ascent.

How reserve is calculated? Currently only all usable strategy is implemented.

1. Simple view: Ascent is automatically calculated from deepest point at end of the planned time. In this case the rock bottom is gas needed for proper ascent to the surface.
2. Complex multilevel dive with or without user defined parts of the profile up to the surface. Again we use all available tanks even they aren't used by user. Emergency ascent is calculated at end of deepest point, since rest of the profile is considered as decompression ascent.

In case of multiple tanks

* Consumed gas is extracted in reverse order from last tank up to the first tank
* Reserve for first tak remains always at least 30 bars
* For all other tanks, there is no reserve required as technical minimum, until the reserve isn't larger than capacity of the first tank.
* In case of multiple tanks with the same bottom gas, to consume from both tanks and distribute the reserve, you need manually create segments and assing the tanks in Extended view.

## Dive way points

Table showing details about profile changes during the dive. Each row represents one event.

* `Symbol`: Represents action executed for each row. Following values are available:
  * `Arrow down`: Descent (end depth is higher then start depth). This is always at least first row.
  * `Arrow right`: Swim at current depth
  * `Arrow up`: Ascent (end depth is lower than start depth, ending with 0 at surface). This is always e.g. last row representing ascent to surface.
  * `Switch`: Gas switch, showing level at which you stay to change tank with different mix
* `Depth` [meters]: Target depth to which current action leads to.
* `Duration` [minutes]: Duration of this transition since previous row.
* `Run time` [minutes]: Absolute time since the dive started till end of current row. Calculated as total sum of all previous lines.

## Dive profile

Graphical representation how the calculated depth changes in time. This corresponds to precise values shown in the way points table. Move mouse over the chart to focus related row in the waypoints table.

* `Dive profile`: Blue line showing diver depth at each moment during the dive.
* `Ceiling`: Orange line showing minimum depth at which diver needs to stay to decompress before he continues with ascent.
* `Average depth`: Dotted line showing average depth at each moment of the dive. This is useful for consumption calculations.

Why is deco shown in the chart, if profile is still considered a no deco?
In some plans you already reach small amount of ceiling, which disappears during the ascent even without any decompression stop. So you are still free to ascent directly to the surface. These kind of dives are still considered as no decompression.

> In the chart profile, the blue line should never cross the orange line!

