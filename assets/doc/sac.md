# RMV/SAC

To be able calculate remaining gas and reserve for planned dive, you need to know your consumption, where this calculator steps into the game. Read more on [Gas planning wiki](https://en.wikipedia.org/wiki/Scuba_gas_planning) or on [Diving cylinder wiki](https://en.wikipedia.org/wiki/Diving_cylinder). We are talking about two measures with different meaning:

* `Respiratory minute volume` (RMV): as volume of gas consumed by diver at surface per minute. This value is not dependent on tank size, so you can use it later to update your consumption when using different tank size. So its unit is Liter/minute or cubic feet/minute. See also [RMV on wiki](https://en.wikipedia.org/wiki/Minute_ventilation)
* `Surface air consumption` (SAC): Amount of gas consumed by diver at surface from given tank. Instead of RMV here the unit is bar/minute (or psi/minute), which is more suitable for diver during the dive, since pressure gauges usually show gas in bars or psi.

These calculations can help you to answer following questions:

* `RMV`: What was my RMV or SAC during last dive?
* `Duration`: How long can i stay at given depth with this tank available gas?
* `Used`: How much gas will be consumed during planned dive?

Formulas used to calculate RMV and SAC:

```text
SAC = consumed gas / (average depth in bars * duration)
RMV = SAC * tank size

Example: During dive where average depth was 15 meters for 45 minutes i consumed 150 bars from 15 liter tank. What is my SAC and RMV?
depth in bars =  15 / 10 + 1 = 2.5 bar (simplified depth conversion)
SAC = 150 / (2.5 * 45) = 1.333 bar/minute
RMV = 1.333 * 15 = 20 liters/minute
```

