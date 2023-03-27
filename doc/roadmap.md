# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Fix the duplicate load needed when accessing the page as pwa - Clear browser cache
* Fix wrong time format message in console created by plotly - requires more customization and additional reference to d3, wan't fix
* When changing altitude, the switch depth changes for EAN50 from 21 m to 24 m. (It looks like we need to use simple depth converter when searching for switch depth)
* Oxygen at 4 m shows MOD 4 meters, but there is still warning about exceeded MOD. (Consider rule for pure O2 only, to use only deco ppO2 as limit)
* Nitrox calculator - minimum value is 21 % O2, but the MOD doesn't equal EAD, because Oxygen is 20.9 % only.

## Improvements / Features

* Add imperial units option
  * Add working pressure to complex tanks UI
  * AppPreferences are able to restore units as part of saved state
  * Relax tank size precision to 1 decimal when switching units
  * Add test, that with imperial units gas switches will be for oxygen at 10 and Ean50 at 70 feet
  * Add examples to the documentation in Imperial units (Depths, calculators, standard gases)
* Settings
  * UI: Add Dropdown for well known tank sizes (to reduce the work to sort all the fields on the page)
  * Unify dive settings and default settings (app settings only units and language)
  * Apply settings after each change and distinguish from default settings
* Add gas depth range/properties/trimix calculator
* Events:
  * Add time to all events warning/error messages where it makes sense
  * Add more events from algorithm: end of NDL, exceeded max. stop duration, safety stop
* UI Tweaks
  * Profile:
    * Add option to reduce waypoints table only to list of stops
    * Waypoints table: add switch in case user is switching to tank with the same gas
    * Add other events to profile chart like gas switch
  * move the tank and depth validation messages to separate row in complex view
  * Recommended and recreational buttons still calculated even with invalid altitude (or any other control not in the same form)
  * Restore state on all pages from last known
  * Back should navigate to last known view, not only to planner (switch from settings back to nitrox calc)
  * Support screen rotation when installed as pwa
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
* Add option to define repetitive dives
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
