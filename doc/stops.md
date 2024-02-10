# Stops (Dive options)

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
