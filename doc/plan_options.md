# Dive options

For faster customization or to be able reset options to default values, you can use two buttons.

* `Recreational`: Options taught in basic open water courses for most training agencies. This will switch e.g. safety stop to 5 meters (15 ft) and ascent speeds to 9 meters/minute (30 ft/min).
* `Recommended`: We strongly encourage you to use these values instead of recreational values, because we thing they are safer and they are the default values for this application. This sets e.g. slower ascent closer to surface.

> To be able to see and edit all mentioned dive options you need to switch to Extended (Trimix) view.

## Gases

* `Maximum narcotic depth` [m]: Limits, at which depth gas mixture is considered to be narcotic. Exceeding this depth means the risk of narcosis significantly increases. Default value is 30 meters (100 ft). Increasing this values allows you to use also nitrox mixes to higher depth, which is not recommended.
* `Is oxygen narcotic`: If enabled (default), counts also oxygen as narcotic gas, otherwise only nitrogen is considered to be narcotic. Most agencies count both oxygen and nitrogen as narcotic gases. Disabling this option allows to you to use gases deeper, but is less safer.

> How this switches affect gas, see also [Gas properties](./gas_properties.md).

## Diver

Here you can set respiratory minute volume (RMV) and maximum acceptable partial pressure of oxygen (ppO2).

* `RMV [l/min]`: Default value is 20 l/min. This is the amount of gas you consume during the normal part of the dive by one diver. For deco tanks this value is also used during normal ascent.
* `Stress RMV [l/min]`: Default value is 30 l/min. This is the amount of gas you consume during the `emergency ascent part` of the dive. First tank or all other tanks with the same gas mix are used for bottom part as stress consumption for two divers. Deco tanks consumption is accounted only for one diver.
* `Maximum ppO2 [bar]`: Default value is 1.4 bar. This is the maximum acceptable partial pressure of oxygen during normal part of the dive for all tanks. This value is used to calculate maximum depth and generates waring if exceeded.
* `Maximum ppO2 for deco [bar]`: Default value is 1.6 bar. This is the maximum acceptable partial pressure of oxygen during decompression part of the dive for all tanks. This value is used also to identify depth at which user should switch to next deco gas.

## Air breaks

Air breaks are used to reduce oxygen toxicity (CNS, OTU) after heavy use of oxygen enriched gas mixtures during decompression ascent.
They apply only from minimum 6 m depth stops. Breaks are not generated for deeper stops, even the toxicity limit is already reached.
They aren`t enabled by default. Default values are 5 minute break on bottom gas (or next breathable gas) after 20 minutes on oxygen as recommended by UTD. GUE recommends 6 minutes break after 16 minutes on oxygen.

* `Maximum Oxygen stop duration [minutes]`: Maximum time on oxygen during the stop. Default value is 20 minutes. If stop is shorter than this value, no break is generated.
* `Back gas duration [minutes]`: Duration of the break on back gas or next breathable gas. Default value is 5 minutes.
