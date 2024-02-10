# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Fix the duplicate load needed when accessing the page as pwa - Clear browser cache
* Fix wrong time format message in console created by plotly - requires more customization and additional reference to d3, wan't fix
* TTS is calculated from last user defined point, not from the deepest point

## Improvements / Features

* Fix documentation: Diver options, redundancies, limitations, multiple depths
* Fix PWA issues https://www.pwabuilder.com/
  * Add standalone app support for iPhone https://love2dev.com/pwa/add-to-homescreen/
  * Fix offline mode:
    * https://progressier.com/
    * https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers
    * https://developers.google.com/codelabs/pwa-training/pwa03--going-offline#1)
* Gas blender calculator
  * Add use case, if we need release some pressure from the tanks, because otherwise we are unable mix
  * Check the real gas blending as replacement of ideal law 
    * https://github.com/atdotde/realblender
    * https://github.com/subsurface/subsurface/blob/master/core/gas-model.c
    * https://thetheoreticaldiver.org/wordpress/index.php/2021/11/16/blending-real-gases/
* Allow user to compare multiple plans side by side
  * I want compare consequences of emergency ascent
  * I want to plan a dive and choose from two following plans or two independent plans
* UI Tweaks
  * Read only fields should be distinguish able
  * Profile:
    * Waypoints table: add switch in case user is switching to tank with the same gas
    * Gas switch is not present in shortened waypoints list
  * Recommended and recreational buttons still calculated even with invalid altitude (or any other control not in the same form)
  * Add limitation for shallow dives below 10 meters, that max. duration is limited to no deco limit and longer dives are saturation dives and this calculator does not work for them.
  * Add warnings to gas properties calc for properties exceeding recommended maximum
  * Allow Gradients over 100%
* Add undo/redo to all pages
* Add calculation trainings
* Help
  * Add help to the UI as side bar
    * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
    * <https://www.npmjs.com/package/ngx-markdown>
    * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
    * <https://stackoverflow.com/questions/53416871/routing-to-static-html-page-in-angular-6>
* Add localizations
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
* Extend application settings:
  * Define custom maximum gas density
  * Custom diver stress sac rate ratio
  * Add option to ignore some warnings
  * Add minimum gas reserve for first tank and for stage
* Add more variables to weight calculator (suits, BMI, tank material, water type)

