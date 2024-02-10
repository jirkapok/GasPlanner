# Calculators

* [RMV/SAC](./calculators.md#rmv)
* [Nitrox](./calculators.md#nitrox)
* [No decompression limits (NDL) table](./calculators.md#no-decompression-limits)
* [Altitude](./calculators.md#altitude)
* [Weight](./calculators.md#weight)
* [Gas properties](./calculators.md#gas-properties)
* [Redundancies](./calculators.md#redundancies)

## RMV/SAC

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

> Hit `Use` button to apply current RMV to the diver application settings

## Nitrox

Use Nitrox calculator to select correct gas for required dive. This calculator is the example where we use simplified depth conversion considering air pressure at sea level is 1 bar. Nitrox calculations triangle is as follows:

```text
partial pressure O2 = pressure at depth * O2 fraction in mix

Example: What is the partial pressure O2 for Ean50 at 22 meters?
O2 fraction in Ean50 => 50 % O2 => 0.5 bar at surface
22 meters => 22 / 10 + 1 = 3.2 bar
ppO2 = 3.2 * 0.5 = 1.6 bar
```

You can calculate one fo these values by providing the remaining two to answer following questions:

* `MOD`: What is the maximum operational depth (MOD) for given gas? This question considers only oxygen toxicity. Exceeding the MOD means there is higher risk of oxygen toxicity. It doesn't take into the account the nitrogen narcotic effect.
* `Best mix`: What is the best mix at given depth? To able use as much as oxygen to given ppO2 limit at planned depth by reducing the narcotic effect of nitrogen. This value applies only to nitrox mixture in simple view.
* `ppO2`: What is the current partial pressure when breathing the gas at given depth? Always know your partial pressure, so you know limits of your gas. This calculation can be omitted in case of using standard gases, which are defined for each depth range in safe ppO2 limit. Standard gases are used by training agencies like GUE, UTD or ISE.
* `EAD`: Shows [Equivalent Air depth](https://en.wikipedia.org/wiki/Equivalent_air_depth). It is depths at which the nitrox has equivalent narcotic effect of nitrogen as breathing Air. This value is always lower than MOD.

> Even you can use Air at depths higher than 30 meters (100 ft), there is still narcotic effect which increases for most people in depths bellow 30 meters. For such depths gases replacing nitrogen by helium like Trimix should be used.

> Hit the `Use` button to apply current ppO2 to diver application settings.

## No decompression limits

Use the same options like when planning normal dive. The shown No decompression limits (NDL) table represents for each depth maximum bottom time (including descent) after which diver reaches no decompression limit.
The table shows only depths between 12 - 42 m (40 - 130 ft), because below these depths no decompression limits are hard to reach or the dive becomes saturation dive. Maximum depth is limited by the oxygen percents and maximum partial pressure (ppO2) content as they define the maximum operational depth for selected gas mixture. Eg. for Ean32 and 1.4 ppO2 the maximum operational depth is 33 m (110 ft). And that is why the table does not show higher depths for this settings.

## Altitude

The altitude diving calculator helps to estimate altitude from the current air pressure and based on the provided actual depth helps to estimate current depth. Eg. you are going to dive at altitude 300 m (100 ft) to 20 meters and you are going to use air tables for dives at sea level. So you can the use Theoretical sea level depth as adjusted target depth for your planned dive.

## Weight

The weight calculator helps to estimate required additional lead the diver needs to use to compensate weight lost during the dive as gas from provided tank is consumed. This does not count with protection suit weight compensation using additional lead. E.g. if you consume 150 b (2175 psi) from 15 L (125 cuft) tank, you will need to add 2.8 kg (6.1 lb) of lead to be neutrally buoyant. This calculator is based on assumption that 1 liter of dry air at 15 °C weights 1,225 g.

## Gas properties

This calculator uses simple depth converter where 1 ATM equals 1 bar to simplify the results understanding. This calculator extends properties shown by Nitrox calculator. By adding helium to gas mixture (trimix) you are able to choose gas for higher depths range and more properties come to account. It helps to understand gas properties under higher pressure at depth. The key understandings are:

* Don't breath gas with higher density than 5.7 g/l. see also <https://gue.com/blog/density-discords-understanding-and-applying-gas-density-research/> and <https://www.thoughtco.com/how-to-calculate-density-of-a-gas-607847>
* Stay within limit of maximum narcotic depth (`MND`), maximum depth (`MOD`) and minimum depth.
* Equivalent narcotic depth (`END`) is affected by both nitrox and oxygen depending on your understanding if oxygen is narcotic or not.
* Maximum partial pressure limits maximum depth by oxygen content.

The results shown in the table respect all options defined in this form. More details about all of the are described in Nitrox calculator chapter or in [dive results](./results.md).

## Redundancies

* TODO

