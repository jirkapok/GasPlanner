# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Fix the duplicate load needed when accessing the page as pwa - Clear browser cache
* Fix wrong time format message in console created by plotly - requires more customization and additional reference to d3, wan't fix

## Improvements / Features

* Add documentation about altitude calculator
* Add option to define repetitive dives
* Allow user to compare multiple plans side by side
* Add gas depth range/properties/trimix calculator at depth (fN2, ppN2, ppHe, ppO2, total pp, minOD, MOD, MND, density)
* Fix PWA issues https://www.pwabuilder.com/
  * Add standalone app support for iPhone https://love2dev.com/pwa/add-to-homescreen/
* UI Tweaks
  * Profile:
    * Waypoints table: add switch in case user is switching to tank with the same gas
  * Recommended and recreational buttons still calculated even with invalid altitude (or any other control not in the same form)
  * Add limitation for shallow dives below 10 meters, that max. duration is limited to no deco limit and longer dives are saturation dives and this calculator does not work for them.
* Add undo/redo to all pages
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

## Compare dives specification

* Design and implement comparison of two different complex dive profiles including consumed gas based on reserve calculation strategy. From the presented results, diver should be able identify potential risks associated with the difference and needs to be able apply safe decisions.
* Analyze possible options from use ability perspective and responsiveness and design responsive UI.
* Measure and compare implemented algorithms performance and propose memory and CPU optimizations.
* Provide screenshots from consumption diff in concurrent apps

* Business scenarios:
  * 1. Dive > user surface rest (minutes delay/surface interval) > 2. dive
  * I want to plan a dive and choose from two plans
    (or I have a plan and i want to plan emergency ascent)

```javascript
DiveToCompare {
  wayPoint/Segment[]
  TankBound/Tank[]
  Info {}
}
```
