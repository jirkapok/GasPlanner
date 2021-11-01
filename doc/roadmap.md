# Raoad map

Following list of features and improvements ordered by priority is under development or consideration.

Known issues:

* Fix calculation of max. bottom time in case of two flat user defined levels
* Fix validation of duration and depth in depths table
* Improve validation of altitude bellow 0 m.a.s.l.
* Improve validation of speeds, because low speed may cause never ending calculation

Improvements:

* UI tweaks
  * Add to dive info: total deco, if any
  * Add button to apply max dive time
  * Add button to apply max depth in to simple depths
  * Add option to reduce plan table only to list of stops
* Allow to define multiple levels
  * Allow to define multiple ascent speeds
  * Add option to define last stop/safety stop range
  * Allow no safety stop below 10m dives in simple mode
* Events:
  * Add time to the events warning/error messages
  * Add more events as errors from algorithm: end of NDL, exceeded max. stop duration, fast ascent or descent, safety stop, narcotic depth
* Add imperial units option
* Add no deco table
* Add trimix support and calculator
  * Add option to define maximum narcotic depth
  * Add option to count oxygen in narcotic gas in narcotic depth calculation
  * Add air breaks
* Add help to all variables
* Add localization
* Add option to define repetitive dives
  * Unify dive settings and default settings
* Add CNS and OTU calculations
* Add option to define deep stops
