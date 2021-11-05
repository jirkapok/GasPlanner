# Raoad map

Following list of features and improvements ordered by priority is under development or consideration.

Known issues:

* Reserve counts only non user defined segments as emergency ascent (Doesn't handle all multilevel scenarios)
* Fix Save/Reload of default settings

Improvements:

* Allow to define multiple levels
  * Allow to define multiple ascent speeds
  * Add option to define last stop/safety stop range
  * Don't include safety stop below 10m dives in simple mode, because user has no option to choose
* UI tweaks
  * Add to dive info: total deco, if any
  * Add option to reduce plan table only to list of stops
  * Add other events to profile chart like gas switch
  * Replace final average depth by continuous average depth in graph
* Events:
  * Add time to the events warning/error messages
  * Add more events as errors from algorithm: end of NDL, exceeded max. stop duration, safety stop, narcotic depth
* Add imperial units option
* Add no deco table
* Add TRIMIX support and calculator
  * Add option to define maximum narcotic depth
  * Add option to count oxygen in narcotic gas in narcotic depth calculation
  * Add air breaks
* UI tweaks
  * Add max. narc. depth to the Gas label
  * Add button to apply best mix for selected depth
* Add help to all variables
* Add localization
* Add option to define repetitive dives
  * Unify dive settings and default settings
* Add CNS and OTU calculations
* Add option to define deep stops
* Allow user to compare multiple plans side by side
