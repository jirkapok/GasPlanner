# Road map

Following list of features and improvements ordered by priority is under development or consideration.

Known issues:

* Gas oxygen content spinner shows not rounded number, where it shouldn't
* Reserve counts only non user defined segments as emergency ascent (Doesn't handle all multilevel scenarios): Fix rock bottom calculation case where part of the ascent is user defined: air 24L/200bar, S80 EAN50, 18m/120 min. +ascent to 6m on air. The rock bottom ISNT 200bar for EAN50.
* Profile is not recalculated after diver SAC is updated
* Fix Nitrox calculator to use Simple depth converter

Improvements:

* UI tweaks
  * Dive info: Add total deco, if any - sum of all stops where ceiling is not 0 m
* Update the documentation to latest state of the application
* Add TRIMIX support and calculator
  * Add general option to enable/disable Nitrox or Trimix
  * Add option to define maximum narcotic depth
  * Add option to count oxygen in narcotic gas in narcotic depth calculation
  * Add air breaks
  * Don't switch to gas with higher content of Nitrox warning - <https://en.wikipedia.org/wiki/Isobaric_counterdiffusion>
  * Add END calculator
* Events:
  * Add time to the events warning/error messages
  * Add narcotic depth exceeded warning event
  * Add more events from algorithm: end of NDL, exceeded max. stop duration, safety stop
* Add imperial units option
  * Liter: <https://en.wikipedia.org/wiki/Cubic_foot>
    * [Nominal volume](https://en.wikipedia.org/wiki/Diving_cylinder#Nominal_volume_of_gas_stored)
    * [Z factor](https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities)
  * Meter: <https://en.wikipedia.org/wiki/Metre_sea_water>
  * bar: <https://en.wikipedia.org/wiki/Pound_per_square_inch> (S80 - 11.1L 206.8428 bar = 3000 psi working pressure)
* UI Tweaks
  * Tanks
    * Add Dropdown for well known tank sizes
    * Add max. narc. depth to the Gas label
  * Profile
    * Add option to reduce plan table only to list of stops
    * Add other events to profile chart like gas switch
  * Settings
    * Unify dive settings and default settings
* Help
  * Add help to the UI as side bar
    * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
    * <https://www.npmjs.com/package/ngx-markdown>
    * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
* Add option to define repetitive dives
* Add no deco table
* Add localization
* Add all settings as url parameters so user can share the profile using an url (<https://angular.io/guide/router#link-parameters-array>)
* Add CNS and OTU calculations
  * <https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf>
  * <https://gue.com/blog/pulmonary-oxygen-toxicity-expanding-our-understanding-with-two-new-models/>
  * <https://thetheoreticaldiver.org/wordpress/index.php/tag/oxygen/>
* Allow user to compare multiple plans side by side
