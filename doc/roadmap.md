# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Gas oxygen content spinner shows not rounded number, where it shouldn't

## Improvements / Features

* Add TRIMIX support and calculator
  * Add general option to enable/disable Nitrox or Trimix
  * Finish Trimix chapter in the documentation
  * Add END calculator
  * Add standard gases table
  * Add air breaks
* Add weighting calculator, see <https://www.facebook.com/watch/?v=400481725415718> (air weight is 1.225 g/l), see also <https://www.omnicalculator.com/physics/air-density> and <https://en.wikipedia.org/wiki/Density_of_air#Temperature>
* Add imperial units option
  * Liter: <https://en.wikipedia.org/wiki/Cubic_foot>
    * Fix RMV/SAC calculator based on Nominal volume
    * [Nominal volume](https://en.wikipedia.org/wiki/Diving_cylinder#Nominal_volume_of_gas_stored)
    * [Z factor](https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities)
  * Meter: <https://en.wikipedia.org/wiki/Metre_sea_water>
  * bar: <https://en.wikipedia.org/wiki/Pound_per_square_inch> (S80 - 11.1L 206.8428 bar = 3000 psi working pressure)
* Events:
  * Add time to the events warning/error messages
  * Add more events from algorithm: end of NDL, exceeded max. stop duration, safety stop
  * Add explanation how to fix the events
* UI Tweaks
  * Tanks
    * Add Dropdown for well known tank sizes
    * Add max. narc. depth to the Gas label
  * Profile:
    * Add option to reduce waypoints table only to list of stops
    * Waypoints table: add switch in case user is switching to tank with the same gas
    * Add other events to profile chart like gas switch
  * Settings
    * Unify dive settings and default settings
  * UX
    * fix layout, so the fields aren't moving when validation error appears
    * add vertical line to chart to highlight current moment
    * align fields to consume full space
    * Hover row in Dive info should focus chart
    * Profile errors should contain explanation how to fix it
* Help
  * Add help to the UI as side bar
    * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
    * <https://www.npmjs.com/package/ngx-markdown>
    * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
    * <https://stackoverflow.com/questions/53416871/routing-to-static-html-page-in-angular-6>
* Add option to define repetitive dives
* Add no deco table
* Add localization
* Add all settings as url parameters so user can share the profile using an url (<https://angular.io/guide/router#link-parameters-array>)
* Add CNS and OTU calculations
  * <https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf>
  * <https://gue.com/blog/pulmonary-oxygen-toxicity-expanding-our-understanding-with-two-new-models/>
  * <https://thetheoreticaldiver.org/wordpress/index.php/tag/oxygen/>
* Allow user to compare multiple plans side by side
