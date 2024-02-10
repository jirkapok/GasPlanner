# Calculators

* [RMV/SAC](./sac.md)
* [Nitrox](./nitrox.md)
* [No decompression limits (NDL) table](./calculators.md#no-decompression-limits)
* [Gas properties (Trimix)](./calculators.md#gas-properties)
* [Altitude](./calculators.md#altitude)
* [Weight](./calculators.md#weight)
* [Redundancies](./calculators.md#redundancies)

## No decompression limits

Use the same options like when planning normal dive. The shown No decompression limits (NDL) table represents for each depth maximum bottom time (including descent) after which diver reaches no decompression limit.
The table shows only depths between 12 - 42 m (40 - 130 ft), because below these depths no decompression limits are hard to reach or the dive becomes saturation dive. Maximum depth is limited by the oxygen percents and maximum partial pressure (ppO2) content as they define the maximum operational depth for selected gas mixture. Eg. for Ean32 and 1.4 ppO2 the maximum operational depth is 33 m (110 ft). And that is why the table does not show higher depths for this settings.
The values calculated here can be used as replacement for tables used by you agency. But you dont have pressure groups and remaining nitrogen, so it can be used only for first dive.

## Gas properties

This calculator uses simple depth converter, where 1 ATM equals 1 bar to simplify the results understanding. This calculator extends properties shown by Nitrox calculator. By adding helium to gas mixture (trimix) you are able to choose gas for higher depths range and more properties come to account. It helps to understand gas properties under higher pressure at depth. 
Following table explains meaning and usage of the listed properties:

* `Oxygen partial pressure`: Current partial pressure of the oxygen gas content at selected depth. The higher this number is, the higher is risk of [oxygen toxicity](./diveinfo.md#oxygen-toxicity). If the oxygen pressure is bellow 0.18 it may cause hypoxia. Common maximum recommended value is 1.6 and defines maximum operating depth of the gas. See also maximum and minimum depth. 
* `Helium partial pressure`: Current partial pressure of the helium gas content at selected depth. The value complements oxygen and nitrogen parts. 
* `Nitrogen partial pressure`: Current partial pressure of the nitrogen gas content at selected depth. The higher this value is, the more dangerous are the narcotic effects, which may reduce diver cognitive behavior and ability to react a make meaningful decisions. Its value also affect Maximum narcotic depth. Maximum recommended value is 3.2.
* `Total partial pressure`: It is sum of all oxygen, helium and nitrogen partial pressures and corresponds with pressure at selected depth.
* `Minimum depth` [m]: It is calculated as depth at which the gas oxygen partial pressure is 0.18. If the oxygen partial pressure is low, the gas is not breath able and may cause hypoxia bellow this depth.  
* `Maximum depth` [m]: It is calculated as depth at which the gas oxygen partial pressure reaches value defined in maximum ppO2.
* `Equivalent narcotic depth` [m]: The depth at which the nitrox part of the gas has the same narcotic effect as breathing air at selected depth. See also [Nitrox calculator](./nitrox.md).
* `Maximum narcotic depth` [m]: Maximum depth at which the nitrox part of the gas reaches the same effect as breathing air at 30 m (100 ft). The Oxygen is narcitic switch affects, if not only the nitrogen, but also the oxygen is counted as narcotic. Most agencies count oxygen as narcotic.
* `Gas density` [m]: The total gas density of the mixture at selected depth. The higher the value is, the more work of breathing the diver needs to use to feel conformable, otherwise it may cause hypoxia. Recommended maximum value is 5.7 [g/l]. 

The key understandings are:

* Don't breath gas with higher density than 5.7 g/l. see also <https://gue.com/blog/density-discords-understanding-and-applying-gas-density-research/> and <https://www.thoughtco.com/how-to-calculate-density-of-a-gas-607847>
* Stay within limit of maximum narcotic depth (`MND`), maximum depth (`MOD`) and minimum depth.
* Equivalent narcotic depth (`END`) is affected by both nitrox and oxygen depending on your understanding if oxygen is narcotic or not.
* Maximum partial pressure limits maximum depth by oxygen content.

The results shown in the table respect all options defined in this form. More details about all of the are described in Nitrox calculator chapter or in [events](./events.md).

## Altitude

The altitude diving calculator helps to estimate altitude from the current air pressure and based on the provided actual depth helps to estimate current depth. Eg. you are going to dive at altitude 300 m (100 ft) to 20 meters and you are going to use air tables for dives at sea level. So you can the use Theoretical sea level depth as adjusted target depth for your planned dive.

## Weight

The weight calculator helps to estimate required additional lead the diver needs to use to compensate weight lost during the dive as gas from provided tank is consumed. This does not count with protection suit weight compensation using additional lead. E.g. if you consume 150 b (2175 psi) from 15 L (125 cuft) tank, you will need to add 2.8 kg (6.1 lb) of lead to be neutrally buoyant. This calculator is based on assumption that 1 liter of dry air at 15 °C weights 1,225 g.

## Redundancies

This calculator allows you to combine gas from two tanks marked as `First tank` and `Second tank` using ideal gas law. Content of th gas does`nt matter, because here we focus on the gas volume only, not its content.
The result of combining the gas volume  is shown in Final pressure. Both tanks will have the same pressure even not the same cylinder volume.
Since we are using ideal gas law for the calculation, keep in mind to combine the gas using slow flow to prevent pressure loses due to temperature increase.  

