# TODO missing test cases

* Dive Schedule.label is rounded
* Test IgnoredIssuesService.ts
* ProfileEvents: Generates correct events based on maxDensity
* PlannerService: 
  * MaxGasDensity is used when calling task
  * Consumption task uses tanks reserve
  * Events are filtered by AppSettings
* Scheduler or AppSettingsComponent: Change of maxDensity triggers schedule calculation
* Diver.component.ts: Add tests for rmv and stressRmv save and load
* AppSettingsComponent:
  * Density Precision and Step for imperial units
  * Density Precision and Step for metric units
  * Values are reloaded after switch to and from imperial units and click Use button
  * Values are Saved to PreferencesStore after clicking Use button
  * Values are loaded from PreferencesStore after component initialization
  * Reset to default
* All other components without tests (currently have only smoke tests)
