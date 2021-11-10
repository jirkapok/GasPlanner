# Help

## Calculations Background

* Ascent speed 10m/min. and 20m/min. descend speed is used.
* When calculating ascent time 2 minutes are always added, to resolve immediate issues in depth.
* Safety stop in 3 meters for 3 minutes is always added as last stop.

## Theoretical model

* All calculations are done in metric units (and than converted to imperial units when requested)
* Internally `Buhlmanns ZHL-16C` algorithm is implemented.

### Constants used and calculation behavior

For some calculations it is necessary to measure precise values. Earths physical model is simulated, but not to all details. In such cases some constants are used.
Together with different rounding during the calculations, this is why diving software implementations differ and mainly also why some simplifications was used during your scuba diving courses.
For example we count with sea level atmospheric pressure 1.01325 bar, but usually everybody counts with 1 bar only, which makes 1.325% deviation.

* [Fahrenheit  scale](https://en.wikipedia.org/wiki/Fahrenheit) - temperature measure based on [brine](https://en.wikipedia.org/wiki/Brine) (salt water)
* [Celsius scale](https://en.wikipedia.org/wiki/Celsius) temperature measure based on 0 °C for the freezing point of water and 100 °C for the boiling point of water at 1 atm pressure

### Altitude

### Salinity

Because salinity of water changes its density and it means also pressure of the water column at depth. In result it affects the tissues loading. See also wiki for [brine](https://en.wikipedia.org/wiki/Brine). Eg. 22 meters corresponds to 3.222 bar

### Depth

### No decompression time limit

## Settings

### Diver

### Load/Save defaults

Used to save current settings to be able use them in later planning. This stores the content of dive planning including settings to cookies in your local computer.

## Plan

* Bottom time [minutes]: The time diver stays under water until he starts to scent. This includes also decent.
* Depth [meters]: The deepest depth reached during the dive.
* Water type: Water can be switched in dive plan from fresh (default) to salt water (switched on). This affects salinity used for calculation.
* Strategy: Allows to define, how much gas will be preserved for emergency. Available options are
  * All usable: for recreational dives without overhead environment. All remaining gas can be reserved.
  * Half usable: for environment (including both overhead and without overhead), where diver needs to return to point where he is able to ascent (swim back to boat from reef barrier).
  * Third usable: for overhead environment, like deep decompression dives or cave diving.

### Gases

* Size [Liters]: The volume of the tank used during the dive. Size of the tank impacts how long you can stay under water under the same conditions.
* Percent O2 [Percents]: Select precise value when measured or pickup one of predefined standard gases.
* Start pressure [bars]: The pressure the tanks is filled in with the gas as red on the pressure gauge. This value is usually represented as full tank. Keep in mind to subtract cca 10 bars in colds water, since temperature will reduce the pressure immediately after you enter the water.

### Gradient Factors

* All calculations currently count with gradients 100/100.
* TODO https://www.diverite.com/articles/gradient-factors/

### Diver breathing rate

* TODO SAC, RMV and impact on calculation

## Calculated results (Dive)

* Time to surface (TTS) [minutes]: Total duration of ascent from critical point of dive in case of emergency. Two minutes are added to ascent duration to be able respond to situation at depth as recommended during scuba trainings.
* Maximum bottom time [minutes]: The longest time diver can stay at required depth considering provided conditions
* Rock bottom [bars]: Minimum amount of gas required for safe ascent in case of emergency for two divers under stress. This counts with 60 liters/minute breathing rate for both divers.
* Turn time [minutes]: Time since start of the dive, when the diver should start end of dive by swimming to exit. This is the sme moment like shown using `turn pressure`.
* Turn pressure [bars]: Amount of gas in the tank shown on pressure gauge, when the diver should start end of th dive by swimming to exit. This is the sme moment like shown using `turn time`.

## Dive way points

Table showing details about profile changes during the dive. Each row represents one event.

* Symbol: Represents action executed for each row. Following values are available:
  * Arrow down: Descent (end depth is higher then start depth). This is always at least first row.
  * Arrow right: Swim at current depth
  * Arrow up: Ascent (end depth is lower than start depth, ending with 0 at surface). This is always e.g. last row representing ascent to surface.
* Depth [meters]: Target depth to which this lead to.
* Duration [minutes]: Duration of this transition since previous row.
* Run time [minutes]: Absolute time since the dive started till end of current row. Calculated as total sum of all previous lines.

## Dive profile

Graphical representation how the calculated depth changes in time. This corresponds to precise values shown in the way points table.
