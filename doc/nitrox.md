# Nitrox

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

