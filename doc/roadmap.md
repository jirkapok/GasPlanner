# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Fix the duplicate load needed when accessing the page as pwa - Clear browser cache
* Fix wrong time format message in console created by plotly - requires more customization and additional reference to d3, wan't fix
* Altitude doesn't refresh units in dive options after units are changed

## Improvements / Features

* Add option to define repetitive dives
* Settings
  * Create default dive options
    * Add button to dive options
    * Put diver under all other options
    * restore load adn save defaults in menu
* Add gas depth range/properties/trimix calculator
* UI Tweaks
  * Profile:
    * Waypoints table: add switch in case user is switching to tank with the same gas
  * Recommended and recreational buttons still calculated even with invalid altitude (or any other control not in the same form)
  * Add limitation for shallow dives below 10 meters, that max. duration is limited to no deco limit and longer dives are saturation dives and this calculator does not work for them.
* Add undo/redo to all pages
* Add weighting calculator, see <https://www.facebook.com/watch/?v=400481725415718> (air weight is 1.225 g/l), see also <https://www.omnicalculator.com/physics/air-density> and <https://en.wikipedia.org/wiki/Density_of_air#Temperature>
* Add gas density calculator (to be able understand to don't breath gas with higher density than 5.7 g/l):
  * <https://www.thoughtco.com/how-to-calculate-density-of-a-gas-607847>
  * <https://gue.com/blog/density-discords-understanding-and-applying-gas-density-research/>
  * Add corresponding event warning
* Redundancies calculator - when filling one tank from second. What is the target pressure in both.
* Add calculation trainings
* Help
  * Add help to the UI as side bar
    * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
    * <https://www.npmjs.com/package/ngx-markdown>
    * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
    * <https://stackoverflow.com/questions/53416871/routing-to-static-html-page-in-angular-6>
* Add localizations
* Allow user to compare multiple plans side by side
* Fix PWA issues https://www.pwabuilder.com/
* Add export of the plan to pdf
* Import/Export dive to compare from well known file format see also <https://www.npmjs.com/package/xml-js>
* Gas consumption:
  * Restore 1/2 and 1/3 reserve strategies
  * Add setting for minimum reserve for both main tank and deco tanks
  * Adjust consumption by Z factor: <https://en.wikipedia.org/wiki/Cubic_foot>
    * Fix RMV/SAC calculator based on Nominal volume
    * [Nominal volume](https://en.wikipedia.org/wiki/Diving_cylinder#Nominal_volume_of_gas_stored)
    * [Z factor](https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities)
    * <https://youtu.be/OI4ZzqJLQjw>
* TRIMIX support
  * Add air breaks
* Add CCR support
* Add option to define custom maximum gas density
