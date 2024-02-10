# Speeds (Dive options)

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
