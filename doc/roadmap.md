# Road map

Following list of features and improvements ordered by priority is under development or consideration.

## Known issues

* Fix wrong time format message in console created by plotly - requires more customization and additional reference to d3 - Won't fix
* RMV/SAC calculator uses ideal gas law to calculated gas consumption, should use Z-factor and real gas compressibility. - Won`t fix, until requested. 
* Fix the duplicate load needed when accessing the page as pwa - Clear browser cache
* Main menu overlaps the tabs, when text is wrapped on two rows (and some other responsiveness glitches)
* Loading of simple dive URL with segment shorter than 60 seconds (simple dive to 15 m) shows no validation issue
* Air breaks result in overlapping gas switch text in profile chart
* Heatmap is not expanded to correct width on first show

## Improvements / Features

* Gas consumption:
    * Gas consumption calculates duplicate gas reserve for deco tanks
    * Clarify: Dive to 30 m in extended view and reduce depth on second segment to 29 m - reserve is 200 b, should be around 80 -
      The 3th minute is considered as deepest point and rock bottom is calculated from there and the last user defined segment is considered as necessary return.
      It looks like we will something like user defined time at which to calculate the rock bottom.
    * Clarify another test case: https://dugong.online/?t=1-24-0-200-0.209-0,2-11.1-0-200-0.5-0&de=0-50-168-1,50-50-900-1&di=20&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&ao=1,0
      Looks like we need to calculate for the ascent time only the 1x reserve from deco tanks
    * Restore 1/2 and 1/3 reserve strategies
    * Add switch to show consumption in liters grouped by gas content not per tank
    * Adjust consumption by Z-factor:
        * Use in gas blender calculator instead of ideal gas law
        * Use in gas consumed gas calculation task
* Add CCR support
* Fix PWA support for iPhone (offline mode and Add to Home screen)
* UI Tweaks
  * Mouse middle button click removes dive
  * Simplify the UI for mobile devices
  * Tanks complex view: Add check box to be able enable or disable tanks
  * Add clone dive button
  * Add option to define custom distance between deco stops
  * Rounding to minutes should round also the ascent time, not only the deco stops
  * Profile comparison: Add option to compare dives aligned by the end of dive
  * Read only fields should be distinguish able
  * Tissues heatmap: Show tissues after amount of time spend at surface
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

## Bachelor/Master's thesis topic proposals

* Embedded help - Show reach help in offline mode as part of the application (created from markup files)
* Gamification/Training - add training part in form of questions, including topic/formula explanation and evaluation of solution
* Implement calculation of consumption strategies
* Implement logbook of dive profiles from dive computer using [libdivecomputer](https://github.com/libdivecomputer/libdivecomputer>) library 
