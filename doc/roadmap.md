# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Fix the duplicate load needed when accessing the page as pwa - Clear browser cache
* Fix wrong time format message in console created by plotly - requires more customization and additional reference to d3, won't fix
* Main menu overlaps the tabs, when text is wrapped on two rows (and some other responsiveness glitches)
* Loading of simple dive URL with segment shorter than 60 seconds (simple dive to 15 m) shows no validation issue
* Air breaks result in overlapping gas switch text in profile chart
* Gas consumption calculates duplicate gas reserve for deco tanks 

## Improvements / Features

* Fix PWA support for iPhone (offline mode and Add to Home screen)
* Add tissues heat map
  * to the profile chart
  * Show tissues after amount of time spend at surface
  * Add to results and diff:
    * TTS is not longer (offgassing start): Moment/depth during ascent at which all tissues saturation is equal or lower than the current ambient pressure
    * Add Surface GF
* UI Tweaks
  * Tanks complex view: Add check box to be able enable or disable tanks
  * Add clone dive button
  * Mouse middle button click removes dive
  * Add option to define custom distance between deco stops
  * Rounding to minutes should round also the ascent time, not only the deco stops
  * Profile comparison: Add option to compare dives aligned by the end of dive
  * Read only fields should be distinguish able
  * Tanks complex view: Add check box to be able enable or disable tanks
  * Add clone dive button
  * Mouse middle button click removes dive
  * Add option to define custom distance between deco stops
  * Rounding to minutes should round also the ascent time, not only the deco stops
* Add CCR support
* Gas consumption:
  * Clarify: Dive to 30 m in extended view and reduce depth on second segment to 29 m - reserve is 200 b, should be around 80
  * Clarify another test case: https://dugong.online/?t=1-24-0-200-0.209-0,2-11.1-0-200-0.5-0&de=0-50-168-1,50-50-900-1&di=20&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&ao=1,0
  * Restore 1/2 and 1/3 reserve strategies
  * Adjust consumption by Z factor: <https://en.wikipedia.org/wiki/Cubic_foot>
    * Fix RMV/SAC calculator based on Nominal volume
    * [Nominal volume](https://en.wikipedia.org/wiki/Diving_cylinder#Nominal_volume_of_gas_stored)
    * [Z factor](https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities)
    * <https://youtu.be/OI4ZzqJLQjw>
* Add undo/redo to all pages
* Add localizations
* Add calculation trainings
* Add help to the UI as side bar
  * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
  * <https://www.npmjs.com/package/ngx-markdown>
  * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
  * <https://stackoverflow.com/questions/53416871/routing-to-static-html-page-in-angular-6>
* Add export of the plan to pdf
* Import/Export dive to compare from well known file format see also <https://www.npmjs.com/package/xml-js>
* Add more variables to weight calculator (suits, BMI, tank material, water type)
* Gas blender: Add use case to identify mix when adding only top mix without adding he or oxygen
* Thalmann algorithm for deeper depths (https://indepthmag.com/thalmann-algorithm/)

## Bachelor/Master's thesis topic proposals

* Embedded help - Show reach help in offline mode as part of the application (created from markup files)
* Gamification/Training - add training part in form of questions, including topic/formula explanation and evaluation of solution
* Implement calculation of consumption strategies
* Implement logbook of dive profiles from dive computer using [libdivecomputer](https://github.com/libdivecomputer/libdivecomputer>) library 
