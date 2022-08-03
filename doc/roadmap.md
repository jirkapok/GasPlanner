# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Gas content spinners issue: oxygen content spinner shows not rounded number, where it shouldn't, Setting 15/55 trimix sets the helium to unexpected precise value
* When changing altitude, the switch depth changes for EAN50 from 21 m to 24 m. It looks like we need to use simple depth converter for founding switch depth
* Fix wrong time format message in console created by plotly
* Fix the duplicate load needed when accessing the page as pwa

## Improvements / Features

* Add all settings as url parameters so user can share the profile using an url (<https://angular.io/guide/router#link-parameters-array>)
* Add imperial units option
  * Fix all value bindings (depths, options, profile, profile chart, dive info)
  * Provide rounded default values (Settings, Sac, Nitrox, tanks, depths, options)
  * Add test, that with imperial units gas switches will be for oxygen at 10 and Ean50 at 70 feet
  * Add examples to the documentation in Imperial units (Depths, calculators, standard gases)
  * Round the values in data model, after unit switched
  * Liter: <https://en.wikipedia.org/wiki/Cubic_foot>
    * Fix RMV/SAC calculator based on Nominal volume
    * [Nominal volume](https://en.wikipedia.org/wiki/Diving_cylinder#Nominal_volume_of_gas_stored)
    * [Z factor](https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities)
    * <https://youtu.be/OI4ZzqJLQjw>
  * bar: <https://en.wikipedia.org/wiki/Pound_per_square_inch> (S80 - 11.1L 206.8428 bar = 3000 psi working pressure)
* Add no deco table
* Redundancies calculator - when filling one tank from second. What is the target pressure in both.
* Add gas depth range calculator
* Add calculation trainings
* Add CNS and OTU calculations
  * <https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf>
  * <https://gue.com/blog/pulmonary-oxygen-toxicity-expanding-our-understanding-with-two-new-models/>
  * <https://thetheoreticaldiver.org/wordpress/index.php/tag/oxygen/>
* Add weighting calculator, see <https://www.facebook.com/watch/?v=400481725415718> (air weight is 1.225 g/l), see also <https://www.omnicalculator.com/physics/air-density> and <https://en.wikipedia.org/wiki/Density_of_air#Temperature>
* Add gas density calculator (to be able understand to dont breath gas with higher density than 5.7 g/l):
  * <https://www.thoughtco.com/how-to-calculate-density-of-a-gas-607847>
  * <https://gue.com/blog/density-discords-understanding-and-applying-gas-density-research/>
  * Add corresponding event warning
* Events:
  * Add time to all events warning/error messages where it makes sense
  * Add more events from algorithm: end of NDL, exceeded max. stop duration, safety stop
* UI Tweaks
  * Calculation
    * Set dive not calculated, if any field on the form isn't valid
  * Tanks
    * Add Dropdown for well known tank sizes
  * Profile:
    * Add option to reduce waypoints table only to list of stops
    * Waypoints table: add switch in case user is switching to tank with the same gas
    * Add other events to profile chart like gas switch
  * Settings
    * Unify dive settings and default settings
  * UX
    * fix layout, so the fields aren't moving when validation error appears
    * align fields to consume full space
* Help
  * Add help to the UI as side bar
    * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
    * <https://www.npmjs.com/package/ngx-markdown>
    * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
    * <https://stackoverflow.com/questions/53416871/routing-to-static-html-page-in-angular-6>
* Add option to define repetitive dives
* Add localizations
* Allow user to compare multiple plans side by side
* Algorithm
  * Improve ascent to next stop by estimated offgasing during the ascent to reduce the stop length
  * Improve performance when estimating stop length
* Gas consumption: Restore 1/2 and 1/3 reserve strategies
* TRIMIX support
  * Add air breaks
