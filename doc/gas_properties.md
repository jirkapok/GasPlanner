# Gas properties

This calculator uses simple depth converter, where 1 ATM equals 1 bar to simplify the results understanding. This calculator extends properties shown by Nitrox calculator. By adding helium to gas mixture (trimix) you are able to choose gas for higher depths range and more properties come to account. It helps to understand gas properties under higher pressure at depth.
Following table explains meaning and usage of the listed properties:

* `Oxygen partial pressure` (ppO2): Current partial pressure of the oxygen gas content at selected depth. The higher this number is, the higher is risk of [oxygen toxicity](./diveinfo.md#oxygen-toxicity). If the oxygen pressure is bellow 0.18 it may cause hypoxia. Common maximum recommended value is 1.4 for bottom gases and 1.6 for decompression gases. It also defines maximum operating depth of the gas. See also maximum and minimum depth.
* `Helium partial pressure`: Current partial pressure of the helium gas content at selected depth. The value complements oxygen and nitrogen parts.
* `Nitrogen partial pressure`: Current partial pressure of the nitrogen gas content at selected depth. The higher this value is, the more dangerous are the narcotic effects, which may reduce diver cognitive behavior and ability to react a make meaningful decisions. Its value also affect Maximum narcotic depth. Maximum recommended value is 3.2.
* `Total partial pressure`: It is sum of all oxygen, helium and nitrogen partial pressures and corresponds with pressure at selected depth.
* `Minimum ppO2`: This value can't be configured, we use 0.18. If the partial pressure of O2 is low there is not enough oxygen for the body. We call such gas hypoxic. This happens usually at low depths 0 - 10 meters (0 - 33 ft). Therefore we generate low ppO2 warning. It is usually true for gases targeting highest depths with low oxygen content and high helium content like 12/60 etc. In such case you need add travel gas to your plan to cover low depths. This depth is calculated the same way as MOD. E.g. 15/55 has minimum usable depth 2 meters (6 ft) defined by minimal ppO2 0.18.
* `Minimum depth` [m]: It is calculated as depth at which the gas oxygen partial pressure is 0.18. If the oxygen partial pressure is low, the gas is not breath able and may cause hypoxia bellow this depth.
* `Maximum depth` (MOD) [m]: It is calculated as depth at which the gas oxygen partial pressure reaches value defined in maximum ppO2. Maximum depth defined by its oxygen toxicity. Exceeding this depth increases risks, which may cause drowning or dead. The value is usually limited by maximum partial pressure of oxygen E.g. 25/25 has MOD 46 meters (150 ft) for ppO2 1.4. This value is also calculated in nitrox calculator.
* `Equivalent air depth` (EAD) [m]: This value is available only for nitrox gases (0 % of helium). It is the depth at which the nitrox part of the gas has approximately the same `decompression` as breathing air. See also [Nitrox calculator](./nitrox.md).
* `Equivalent narcotic depth` (END) [m]: The depth at which the nitrox part of the gas has the same `narcotic effect` as breathing air at selected depth. This the value differs from EAD. The narcosis has similar effect like drinking alcohol. Nitrox mixtures contain always only oxygen and nitrogen and both are usually considered as narcotic. Exceeding the END increases risk of the narcosis and therefore it is recommended to replace some part of the mix with helium. Recommended maximum value is 30 meters (100 ft). This value can be configured in Planner Options, Gases section. See also wiki [Equivalent narcotic depth](https://en.wikipedia.org/wiki/Equivalent_narcotic_depth).
* `Maximum narcotic depth` (MND) [m]: Maximum depth at which the nitrox part of the gas reaches the same effect as breathing air at configured maximum narcotic depth, usually 30 m (100 ft). The `Oxygen is narcotic` switch affects, if not only the nitrogen, but also the oxygen is counted as narcotic. Most agencies count oxygen as narcotic.  Is calculated as a depth at which you reach your limit for equivalent narcotic depth. Usually you want to keep your planned depth below this value.
* `Gas density` [m]: The total gas density of the mixture at selected depth. The higher the value is, the more work of breathing the diver needs to use to feel conformable, otherwise it may cause hypoxia. Recommended maximum value is 5.7 [g/l].


```text
Example: You plan a dive to 45 meters (5.5 bar) and consider Air narcotic for depths below 30 meters (4 bar) and usable gas in range 0.18 - 1.4 ppO2. Team selects Trimix 21/35 as an option.
Minimum depth = Minimum ppO2 / oxygen fraction = 0.18 / 0.21 = 0.86 < 1 bar i.e. up to the surface
MOD = Maximum ppO2 / oxygen fraction = 1.4 / 0.21 = 6.6 bar => 56 meters
Equivalent narcotic depth = (1 - Helium fraction) * depth = 0.65 * 5.5 = 3.58 bar => 25.8 meters
narcotic depth limit = 30 m => 4 b
Maximum narcotic depth = narcotic depth limit / (1 - Helium fraction) = 4 / 0.65 = 6.15 bar => 51.5 meters
Result: Selected gas is good choice for target depth 45 meters, because its range is 0 - 51.5 m.
```

## Gases by Oxygen content

| Category  | Oxygen content | Example      |
| ---       | ---            |--------------|
| Hypoxic   | < 18 %         | Trimix 15/55 |
| Normooxic | 18 - 21 %      | Air          |
| Hyperoxic | > 21 %         | EAN50        |


The key understandings are:

* Don't breath gas with higher density than 5.7 g/l. see also <https://gue.com/blog/density-discords-understanding-and-applying-gas-density-research/> and <https://www.thoughtco.com/how-to-calculate-density-of-a-gas-607847>
* Stay within limit of maximum narcotic depth (`MND`), maximum depth (`MOD`) and minimum depth.
* Equivalent narcotic depth (`END`) is affected by both nitrox and oxygen depending on your understanding if oxygen is narcotic or not.
* Maximum partial pressure limits maximum depth by oxygen content.

The results shown in the table respect all options defined in this form. More details about all of the are described in Nitrox calculator chapter or in [events](./events.md).
