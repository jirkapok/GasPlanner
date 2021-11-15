# Raoad map

Following list of features and improvements ordered by priority is under development or consideration.

Known issues:

* Reserve counts only non user defined segments as emergency ascent (Doesn't handle all multilevel scenarios)

Improvements:

* Allow to define multiple levels
  * Allow to define multiple ascent speeds
  * Add option to define last stop/safety stop range
  * Don't include safety stop below 10m dives in simple mode, because user has no option to choose
* UI tweaks
  * Add to dive info: total deco, if any
  * Add option to reduce plan table only to list of stops
  * Add other events to profile chart like gas switch
  * Gas oxygen content spinner shows not rounded number, where it shouldn't
* Events:
  * Add time to the events warning/error messages
  * Add narcotic depth exceeded warning event
  * Add more events from algorithm: end of NDL, exceeded max. stop duration, safety stop
* Add imperial units option
* Add no deco table
* Add TRIMIX support and calculator
  * Add option to define maximum narcotic depth
  * Add option to count oxygen in narcotic gas in narcotic depth calculation
  * Add air breaks
* UI tweaks
  * Add max. narc. depth to the Gas label
  * Add button to apply best mix for selected depth
* Help
  * Update the documentation to latest state of the application
  * Add help to the UI as side bar
    * <https://ej2.syncfusion.com/angular/documentation/sidebar/getting-started/>
    * <https://www.npmjs.com/package/ngx-markdown>
    * <https://stackblitz.com/edit/angular-azjfgh?file=src%2Fapp%2Fapp.component.html>
* Add localization
* Add all settings as url parameters so user can share the profile using an url (<https://angular.io/guide/router#link-parameters-array>)
* Add option to define repetitive dives
  * Unify dive settings and default settings
* Add CNS and OTU calculations
* Add option to define deep stops
* Allow user to compare multiple plans side by side
