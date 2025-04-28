# Gas properties

This calculator uses simple depth converter, where 1 ATM equals 1 bar to simplify the results understanding. This calculator extends properties shown by Nitrox calculator. By adding helium to gas mixture (trimix) you are able to choose gas for higher depths range and more properties come to account. It helps to understand gas properties under higher pressure at depth.
Following table explains meaning and usage of the listed properties:

* `Oxygen partial pressure`: Current partial pressure of the oxygen gas content at selected depth. The higher this number is, the higher is risk of [oxygen toxicity](./diveinfo.md#oxygen-toxicity). If the oxygen pressure is bellow 0.18 it may cause hypoxia. Common maximum recommended value is 1.6 and defines maximum operating depth of the gas. See also maximum and minimum depth.
* `Helium partial pressure`: Current partial pressure of the helium gas content at selected depth. The value complements oxygen and nitrogen parts.
* `Nitrogen partial pressure`: Current partial pressure of the nitrogen gas content at selected depth. The higher this value is, the more dangerous are the narcotic effects, which may reduce diver cognitive behavior and ability to react a make meaningful decisions. Its value also affect Maximum narcotic depth. Maximum recommended value is 3.2.
* `Total partial pressure`: It is sum of all oxygen, helium and nitrogen partial pressures and corresponds with pressure at selected depth.
* `Minimum depth` [m]: It is calculated as depth at which the gas oxygen partial pressure is 0.18. If the oxygen partial pressure is low, the gas is not breath able and may cause hypoxia bellow this depth.
* `Maximum depth` [m]: It is calculated as depth at which the gas oxygen partial pressure reaches value defined in maximum ppO2.
* `Equivalent narcotic depth` [m]: The depth at which the nitrox part of the gas has the same narcotic effect as breathing air at selected depth. See also [Nitrox calculator](./nitrox.md). This the value is known to nitrox divers as `Equivalent air depth`.
* `Maximum narcotic depth` [m]: Maximum depth at which the nitrox part of the gas reaches the same effect as breathing air at 30 m (100 ft). The `Oxygen is narcotic` switch affects, if not only the nitrogen, but also the oxygen is counted as narcotic. Most agencies count oxygen as narcotic.
* `Gas density` [m]: The total gas density of the mixture at selected depth. The higher the value is, the more work of breathing the diver needs to use to feel conformable, otherwise it may cause hypoxia. Recommended maximum value is 5.7 [g/l].

The key understandings are:

* Don't breath gas with higher density than 5.7 g/l. see also <https://gue.com/blog/density-discords-understanding-and-applying-gas-density-research/> and <https://www.thoughtco.com/how-to-calculate-density-of-a-gas-607847>
* Stay within limit of maximum narcotic depth (`MND`), maximum depth (`MOD`) and minimum depth.
* Equivalent narcotic depth (`END`) is affected by both nitrox and oxygen depending on your understanding if oxygen is narcotic or not.
* Maximum partial pressure limits maximum depth by oxygen content.

The results shown in the table respect all options defined in this form. More details about all of the are described in Nitrox calculator chapter or in [events](./events.md).
