# Help

## Calculations Background

For some calculations it is necessary to measure precise values. Earths physical model is simulated, but not to all details. In such cases some constants are used. Together with different rounding during the calculations, this is why diving software implementations differ and mainly also why some simplifications was used during your scuba diving courses. For example we count with sea level atmospheric pressure 1.01325 bar, but usually everybody counts with 1 bar only, which makes 1.325% deviation. We use such simplifications only in Nitrox calculator. Similar results you se in this application you should see in other applications or dive computers.

## Theoretical model

* All calculations are done in metric units (and than converted to imperial units when requested)
* Internally `Bühlmanns ZHL-16C` algorithm is implemented.

## Screen structure

To be able calculate dive profile you need to enter Gases used during the dive, depth and calculation options, each of these is placed within its own box. Every time you change any option new profile is calculated. We distinguish two kinds of view.

* `Simple`: For simple dives, faster to get results. Only one target depth and time with only one tank is available. Som options aren't visible and are simplified (e.g. you are unable to set precise gradient factors). If it is not enough use Extended view.
* `Extended`: Allows you define unlimited number of tanks and depth levels. You are free to customize details of the profile calculations.

### Depth

* `Bottom time` [minutes]: The time diver stays under water until he starts to scent. This includes also decent.
  * `Max`: TODO
  * `No deco`: TODO
* `Depth` [meters]: The deepest depth reached during the dive.
  * `Max`: TODO

### Gases

* `Size` [Liters]: The volume of the tank used during the dive. Size of the tank impacts how long you can stay under water under the same conditions. See also SAC/RMV calculations.
* `Percent O2` [Percents]: Select precise value when measured or pickup one of predefined standard gases. Always provide value rounded up.
  * `MOD`: TODO
  * `Switch`: TODO
* `Start pressure` [bars]: The pressure the tanks is filled in with the gas as red on the pressure gauge. This value is usually represented as full tank. Keep in mind to subtract cca 10 bars in colds water, since temperature will reduce the pressure immediately after you enter the water.

## Options

For faster customization or to be able reset options to default values, you can use two buttons.

* `Recreational`: Options taught in basic open water courses for most training agencies. This will switch e.g. safety stop to 5 meters and ascent speeds to 9 meters/minute.
* `Recommended`: We strongly encourage you to use these values instead of recreational values, because we thing they are safer and they are the default values for this application. This sets e.g. slower ascent closer to surface.

### Environment

* `Salinity`: Because salinity of water changes its density and it means also pressure of the water column at depth. In result it affects the tissues loading. See also wiki for [brine](https://en.wikipedia.org/wiki/Brine). Eg. 22 meters corresponds to 3.222 bar in salt water. You can choose from fresh water, salt (sea) water and Brackish water. Brackish water is somewhere between salt and fresh. It is used by some computers as the only one option (Suunto). In case your dive computer doesn't contain Brackish water use salt water or value with higher content of salt.

| Salinity | Location | Salinity [gram/liter] | Density [kg/m3] |
| --- | --- | --- | --- |
| Salt | Red sea, Mediterranean sea | 38 | 1028 |
| Brackish (EN13319) | Black sea, Baltic sea | 28 | 1020 |
| Fresh | Lakes | 0.1 | 1000 |

* `Altitude`: Similar effect on decompression like salinity has diving at higher altitude. The higher you are, the lower is the atmospheric pressure around you. 0 m.a.s.l. means sea level, e.g. 1.0132 bar. Diving at higher altitude results in higher decompression (e.g. shorten no decompression limit).

| Altitude [m.a.s.l.] | Air pressure [bar] |
| --- | --- |
| 0 | 1.01 |
| 400 | 0.97 |
| 700 | 0.93 |
| 2000 | 0.79 |

### Conservatism - Gradient Factors

* TODO https://www.diverite.com/articles/gradient-factors/
Default values correspond with Shearwater, how it impacts the calculation

### Stops

TODO

### Speeds

TODO

## Calculated results (Dive info)

* `Time to surface (TTS)` [minutes]: Total duration of ascent from critical point of dive in case of emergency. Two minutes are added to ascent duration to be able respond to situation at depth as recommended during scuba trainings.
* `No decompression time` [minutes]: The longes time diver can stay at required depth where direct ascent to the surface is considered to be safe.
* `Maximum bottom time` [minutes]: The longest time diver can stay at required depth considering provided gases
* `Rock bottom at` time: Moment at which the emergency ascent is calculated used to calculate the rock bottom. It is the last moment at highest depth.

> **Emergency ascent may differ from calculated ascent**, because it is calculated at different time during the dive.

### Consumed gas charts

* `Rock bottom` [bars]: Minimum amount of gas (reserve) required for safe ascent in case of emergency for two divers under stress. This counts with 60 liters/minute breathing rate for both divers. It is shown for each defined tank. These values are calculated at "Rock bottom at" time.

TODO: How reserve for all usable is calculated
1. Simple UI - Ascent is calculated and is from deepest point - we can count with it
2. Complex multilevel dive with or without user segments up to the surface
  - based on deco and all available gases, even the gases aren't used in
  any user defined segment - emergency ascent from last deepest point
- describe how reserve is distributed across multiple tanks
### Dive way points

Table showing details about profile changes during the dive. Each row represents one event.

* `Symbol`: Represents action executed for each row. Following values are available:
  * `Arrow down`: Descent (end depth is higher then start depth). This is always at least first row.
  * `Arrow right`: Swim at current depth
  * `Arrow up`: Ascent (end depth is lower than start depth, ending with 0 at surface). This is always e.g. last row representing ascent to surface.
  * `Switch`: Gas switch, showing level at which you stay to open Oxygen window (TODO link to wiki) after changing to gas with different mix
* `Depth` [meters]: Target depth to which this lead to.
* `Duration` [minutes]: Duration of this transition since previous row.
* `Run time` [minutes]: Absolute time since the dive started till end of current row. Calculated as total sum of all previous lines.

## Dive profile

Graphical representation how the calculated depth changes in time. This corresponds to precise values shown in the way points table. Move mouse over the chart to focus related row in the waypoints table.

## Application settings

### Edit

TODO

* `SAC`: How it relates to RMV and impact on calculation
* `Maximum ppO2`:
* `Maximum deco ppO2`:

### Load/Save defaults

Used to save current settings to be able use them in later planning. This stores the content of dive planning including settings to your browser cookies in your local computer.

## Calculators

TODO

### Nitrox

TODO

### RMV/SAC

TODO
