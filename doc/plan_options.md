# Plan options

For faster customization or to be able reset options to default values, you can use two buttons.

* `Recreational`: Options taught in basic open water courses for most training agencies. This will switch e.g. safety stop to 5 meters (15 ft) and ascent speeds to 9 meters/minute (30 ft/min).
* `Recommended`: We strongly encourage you to use these values instead of recreational values, because we thing they are safer and they are the default values for this application. This sets e.g. slower ascent closer to surface.

## Environment

* `Salinity`: Because salinity of water changes its density and it means also pressure of the water column at depth. In result it affects the tissues loading. See also wiki for [brine](https://en.wikipedia.org/wiki/Brine). Eg. 22 meters (73 ft) corresponds to 3.222 bar (46.7 psi) in salt water. You can choose from fresh water, salt (sea) water and Brackish (EN13319) water. Brackish water is somewhere between salt and fresh. It is used by some computers as the only one option (Suunto). In case your dive computer doesn't contain Brackish water use salt water (value with higher content of salt).

| Salinity | Location | Salinity [gram/liter] | Density [kg/m3] |
| --- | --- | --- | --- |
| Salt | Red sea, Mediterranean sea | 38 | 1028 |
| Brackish (EN13319) | Black sea, Baltic sea | 28 | 1020 |
| Fresh | Lakes | 0.1 | 1000 |

* `Altitude`: Similar effect on decompression like salinity has diving at higher altitude. The higher you are, the lower is the atmospheric pressure around you. 0 m.a.s.l. means sea level, e.g. 1.0132 bar. Diving at higher altitude results in higher decompression (e.g. shorten no decompression limit).

| Altitude [m.a.s.l.] | Imperial [f.a.s.l.] | Air pressure [bar] |
| ---  | ---  | ---  |
| 0    | 0    | 1.01 |
| 400  | 1312 | 0.97 |
| 700  | 2297 | 0.93 |
| 2000 | 6562 | 0.79 |

## Conservatism - Gradient Factors

This is the key options which defines the generated profile curve. For more details about this option see [Gradient factors article](https://www.diverite.com/articles/gradient-factors/) by Dive rite.
You can use predefined group of values, which correspond with values used by Shearwater dive computers. Both values are in range 10-100 %. Where 100 % means pure Bühlmann with no gradient factors. Today it is generally considered as not safe enough. The lower the value is, the more safety you get by reducing allowed maximum tissue pressure (supersaturation level). But the price is longer ascent. So the correct behavior is to find sme compromise. Here is simple explanation how it works.

* `Gradient factor Low` (GF Low): Is applied on depths range. It defines moment at which we first time reach the maximum supersaturation level. I.e. it defines depth of first stop. Low value means the first stop will be at higher depth. More about deep stops in [this article](https://thetheoreticaldiver.org/wordpress/index.php/2019/06/16/short-comment-on-doolettes-gradient-factors-in-a-post-deep-stops-world/)

* `Gradient factor High` (GF High): Is applied on tissue supersaturation level. The higher value you define, the higher allowed pressure in body tissues you allow when surfacing. The moment at which you surface is defined by duration of last stop, which this value controls. The higher value you define, the shorter will be the last stop duration.

Following chart shows how different gradient factors apply to ascent profile. Legend shows gradients as GFLow/GFHigh. As you can see gf Low 20 % starts stops deeper, than GF Low 40 %. Similar GF High 70 % means longer stop at 3 meters (10 ft) than GF High 90 %, in which case you reach the surfaces faster. 100/100 means pure Bühlmann, with no additional safety margin.

![Gradient factors comparison chart](./gf_profile_comparison.png)

Which values to apply? Here are recommended values explained:

| Gradient factors | Recommendation |
| --- | --- |
| Low (45/95) | Shallow dive, good conditions, fit and healthy diver |
| Medium (40/85) | Repetitive dive, average conditions |
| High (30/75) | Deep dives, decompression dives, hard conditions |

## Gases

* `Maximum narcotic depth` [m]: Limits, at which depth gas mixture is considered to be narcotic. Exceeding this depth means the risk of narcosis significantly increases. Default value is 30 meters (100 ft). Increasing this values allows you to use also nitrox mixes to higher depth, which is not recommended.
* `Is oxygen narcotic`: If enabled (default), counts also oxygen as narcotic gas, otherwise only nitrogen is considered to be narcotic. Most agencies count both oxygen and nitrogen as narcotic gases. Disabling this option allows to you to use gases deeper, but is less safer.

## Stops

* `Problem solving duration` [min]: Usually 1-2 minutes added to the bottom time to solve issues causing emergency ascent. This value is used only for Rock bottom calculation.
* `Gas switch duration` [min]: Usually 1-3 minutes added as stop for gas switch. During this time the body has time to start consume less nitrogen under high pressure causing higher volume of nitrogen to be released from tissues and start [oxygen window](https://en.wikipedia.org/wiki/Oxygen_window).
* `Round deco stops to minutes`: By default stops are calculated in seconds. In case you wan't them rounded up to minutes, enable this options. This affects only stops duration not ascent between stops.
* `Last stop depth` [m]: Allows 3-6 meters (10-20 ft), depending on conditions. Most agencies train to do 3 minutes stop at 5 meters (15 ft), which doesn't have to be precise enough for more complex dives. E.g. In higher waves you want the stop at deeper depth. At the other hand some dive site conditions require you to do the stop close to the surface at 3 m depth.
* `Add 3 min safety stop`: You can choose when the algorithm adds additional 3 minutes to last decompression stop. The safety stop is always added to the last stop duration (if any) at depth of defined last stop (see above).
  * `Never`: The safety stop is not added, the last stop is only controlled by decompression
  * `Auto (> 10m)`: The safety stop is added only in case the planned depth is deeper than 10 meters. This option is default and is suitable for recreational divers.
  * `Always` : Even you train in shallow pool without decompression stops, you may want to add the safety stop as additional safety margin. This enforces the safety stop at end of the ascent

> Configuration of safety stop always applies also to rock bottom calculation in case of emergency ascent.
> When the algorithm allows ascent to next decompression or safety stop? Currently the easiest solution is implemented (not optimal). You wait at the stop, until the ceiling is shallower than next stop. Than you can start ascent to next stop.

## Speeds

* `Descent speed` [m/min]: Used in case user defines target depth only. In such case this value is used to calculate the descent.
* `Ascent up to 50% depth` [m/min]: Is speed used to calculate ascent from target depth up to 50% of average depth.
* `Ascent up to 6 m depth` [m/min]: Is speed used to calculate ascent from 50% average depth up to 6 m (20 ft).
* `Ascent 6 m to surface` [m/min]: Is speed used to calculate ascent from 6 m (20 ft) up to the surface.

> All the ascent speeds are used for both planned ascent and emergency ascent used to calculate the rock bottom.

All the speeds are used also in user defined ascents or descents by checking, if the plan is within the speeds range.
Change of ascent speeds apply at 3 m intervals, the same applies to decompression stops. It is recommended to use lower values closer to the surface. Use Recommended button to apply default values 9, 6 and 3 meters/min. For recreational dives used by most agencies, all are set to 9 meters/min.

Following table shows example dive to 30 meters (100 ft) with average depth 28.6 meters (94 ft) and recommended speeds at moment the diver starts ascent. 50 % of average depth is rounded to 12 meters.

| Depth range [m] | Depth range [ft]  | Ascent speed [m/min] | Ascent speed [ft/min] |
| ---             | ---                 | ---                  | ---                 |
| 30 - 12         | 100 - 40            | 9                    | 30                  |
| 12 - 6          | 40 - 20             | 6                    | 20                  |
| 6 - 0           | 20 - 0              | 3                    | 10                  |
