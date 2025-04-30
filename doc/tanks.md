# Tanks

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

## Trimix/Helitrox

[Trimix or Helitrox](https://en.wikipedia.org/wiki/Trimix_(breathing_gas)) are gas mixtures, which add Helium as third significant component into the mixture. So the gas typically consist of oxygen, helium and nitrogen. These gases are usually expensive because of helium price. It is the reason why usually deeper dives are done nowadays using closed circuit (CCR). Our planner currently supports planning only for open circuit (OC). We distinguish all the gases by amount of oxygen.

> We recommend to choose from one of the commonly used gases and use the same gases for all team members! See [Standard gases](./standard_gases.md)

To be able distinguish the content, we call the gases using only its oxygen and helium parts. E.g. Trimix 18/48 consists of 18 % oxygen, 45% of helium and the rest is nitrogen. To be able select correct mix, we need to know depth range at which the gas can be used. 
The range is limited by `MOD`,  `Minimum ppO2`, `Equivalent narcotic depth` (END for nitrox gases) and `Maximum narcotic depth` (MND).
We choose lower depth from MND and MOD as maximum depth for the gas mixture.

> Select gas using [Gas properties](./gas_properties.md) calculator

General recommendations when planning deep dives:

* We don't recommend deep dives on AIR!
* You should always use Trimix for depths bellow maximum narcotic depth!
* Consider not switching to gas with higher nitrogen content because of [Isobaric counter diffusion](https://en.wikipedia.org/wiki/Isobaric_counterdiffusion). We generate warning following the 1/5 rule: Any increase in gas fraction of nitrogen in the decompression gas should be limited to 1/5 of the decrease in gas fraction of helium.
* Use separate argon bottle for dry suit inflation. This is not calculated in to the gases consumption
* Keep in mind also [High pressure nervous syndrome](https://en.wikipedia.org/wiki/High-pressure_nervous_syndrome) (HPNS)
* Because of high amount of oxygen consumed during deep dives, watch your [Oxygen toxicity](https://en.wikipedia.org/wiki/Oxygen_toxicity#Underwater) (CNS/OTU)
