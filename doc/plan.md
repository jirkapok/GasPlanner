# Dive plan

## Depth

![Target depth](./target_depth_properties.png)

* `Bottom time` [minutes]: The time diver stays under water until he starts to scent. This includes also decent.
  * `Max`: Applies the maximum estimated bottom time to the plan
  * `No deco`: Applies the maximum no decompression limit time to the plan
* `Depth` [meters] (ft): The deepest depth reached during the dive.
  * `Max`: Based on selected options applies maxim depth based on narcotic depth selected gas (for nitrox mixes always 30 meters / 100 ft)
  * `Best mix`: Shows best content of nitrox mix for selected depth based on maximum partial pressure of oxygen (ppO2)

## Tanks

* `Size` [Liters] (cuft): The volume of the tank used during the dive. Size of the tank impacts how long you can stay under water under the same conditions. See also SAC/RMV calculations.
* `Percent O2` [Percents]: Select precise value when measured or pickup one of predefined standard gases. Always provide value rounded up the precisely measured value.
  * `MOD`: Shows maximum operational depth in meters calculated from configured maximum ppO2 (see also Nitrox calculator)
  * `Switch`: Shows maximum depth in meters at which you can switch to this gas for decompression purposes. It is calculated from configured maximum decompression ppO2
* `Start pressure` [bars] (psi): The pressure the tanks is filled in with the gas as red on the pressure gauge. This value is usually represented as full tank. Keep in mind to subtract cca 10 bars (150 psi) in colds water, since temperature will reduce the pressure immediately after you enter the water.
* `Working pressure` [psi]: Used to calculate real water volume tank size from tank size. This value is available only in imperial units.

![Tank properties](./tank_properties.png)

> Why is switch always deeper than MOD? Because maximum ppO2 for deco gas is usually higher than for bottom gas.

Example: Maxim deco ppO2 is 1.6, for bottom gas is maximum ppO2 only 1.4. For Ean50 (50 % oxygen) MOD is calculated as 18 meters (60 ft) for bottom gas max. ppO2, but 21 meters (70 ft) for max. deco ppO2. On real dive, you don't want to push your oxygen toxicity stress to high value for long time. But when switching to decompression gas during the ascent you want to open oxygen window at higher ppO2, but only for short period of time, expecting that you continue ascending after the switch (See also gas switch duration option).

> To access **TRIMIX** gases switch to Extended view!

### Trimix/Helitrox

[Trimix or Helitrox](https://en.wikipedia.org/wiki/Trimix_(breathing_gas)) are gas mixtures, which add Helium as third significant component into the mixture. So the gas typically consist of oxygen, helium and nitrogen. These gases are usually expensive because of helium price. It is the reason why usually deeper dives are done nowadays using closed circuit (CCR). Our planner currently supports planning only for open circuit (OC). We distinguish all the gases by amount of oxygen.

| Category  | Oxygen content | Example      |
| ---       | ---            |--------------|
| Hypoxic   | < 18 %         | Trimix 15/55 |
| Normooxic | 18 - 21 %      | Air          |
| Hyperoxic | > 21 %         | EAN50        |

> We recommend to choose from one of the commonly used gases and use the same gases for all team members! See [Standard gases](./standard_gases.md)

To be able distinguish the content, we call the gases using only its oxygen and helium parts. E.g. Trimix 18/48 consists of 18 % oxygen, 45% of helium and the rest is nitrogen. To be able select correct mix, we need to know depth range at which the gas can be used. The range is limited by:

* `MOD`: Maximum depth defined by its oxygen toxicity. Exceeding this depth increases risks, which may cause drowning or dead. The value is usually limited by maximum partial pressure of oxygen (See nitrox calculator). E.g. 25/25 has MOD 46 meters (150 ft) for ppO2 1.4.
* `Minimum ppO2`: If the partial pressure of O2 is low there is not enough oxygen for the body. We call such gas hypoxic. This happens usually at low depths 0 - 10 meters (0 - 33 ft). Therefore we generate low ppO2 warning. It is usually true for gases targeting highest depths with low oxygen content and high helium content like 12/60 etc. In such case you need add travel gas to your plan to cover low depths. This depth is calculated the same way as MOD. E.g. 15/55 has minimum usable depth 2 meters (6 ft) defined by minimal ppO2 .18. This value can't be configured.
* `Equivalent narcotic depth` (END): Depth at which the gas mixture has equivalent narcotic effect as breathing air. The narcosis has similar effect like drinking alcohol. Nitrox mixtures contain always only oxygen and nitrogen and both are usually considered as narcotic. Exceeding the END increases risk of the narcosis and therefore it is recommended to replace some part of the mix with helium. Recommended maximum value is 30 meters (100 ft). This value can be configured in Gases section in Options. See also wiki [Equivalent narcotic depth](https://en.wikipedia.org/wiki/Equivalent_narcotic_depth).
* `Maximum narcotic depth` (MND): Is calculated as a depth at which you reach your limit for equivalent narcotic depth. Usually you want to keep your planned depth below this value.

We choose lower depth from MND and MOD as maximum depth for the gas mixture.

```text
Example: You plan a dive to 45 meters (5.5 bar) and consider Air narcotic for depths below 30 meters (4 bar) and usable gas in range 0.18 - 1.4 ppO2. Team selects Trimix 21/35 as an option.
Minimum depth = Minimum ppO2 / oxygen fraction = 0.18 / 0.21 = 0.86 < 1 bar i.e. up to the surface
MOD = Maximum ppO2 / oxygen fraction = 1.4 / 0.21 = 6.6 bar => 56 meters
Equivalent narcotic depth = (1 - Helium fraction) * depth = 0.65 * 5.5 = 3.58 bar => 25.8 meters
Maximum narcotic depth = depth limit / (1 - Helium fraction) = 4 / 0.65 = 6.15 bar => 51.5 meters
Result: Selected gas is good choice for target depth 45 meters, because its range is 0 - 51.5 m.
```

General recommendations when planning deep dives:

* We don't recommend deep dives on AIR!
* You should always use Trimix for depths bellow maximum narcotic depth!
* Consider not switching to gas with higher nitrogen content because of [Isobaric counter diffusion](https://en.wikipedia.org/wiki/Isobaric_counterdiffusion). We generate warning following the 1/5 rule: Any increase in gas fraction of nitrogen in the decompression gas should be limited to 1/5 of the decrease in gas fraction of helium.
* Use separate argon bottle for dry suit inflation. This is not calculated in to the gases consumption
* Keep in mind also [High pressure nervous syndrome](https://en.wikipedia.org/wiki/High-pressure_nervous_syndrome) (HPNS)
* Because of high amount of oxygen consumed during deep dives, watch your [Oxygen toxicity](https://en.wikipedia.org/wiki/Oxygen_toxicity#Underwater) (CNS/OTU)
