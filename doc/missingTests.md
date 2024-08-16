# TODO missing test cases

* Add tests for Diver.ts
* PersistenceService:
  * Save and load AppSettings from store (density, warnings, tank reserve)
  * AppSettings not saved yet, default value is loaded
* LoadFromUrl:
  * Loads app settings (density, warnings, tank reserve) with no change
  * Loads and saves stressRmv and rmv
  * Loads default stressRmv, if not present in URL
* ProfileEvents: Generates correct events based on maxDensity
* NormalizationService: rounds values to correct range of settings when switching units
  * What are the values to test?
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
