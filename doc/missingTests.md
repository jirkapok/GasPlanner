# TODO missing test cases

* Add tests for Diver.ts
* PersistenceService:
  * Save and load AppSettings from store (density)
  * Density not saved yet, default value is loaded
* LoadFromUrl:
  * Loads current density (no change)
  * Loads and saves stressRmv and rmv
  * Loads default stressRmv, if not present in URL
* ProfileEvents: Generates correct events based on maxDensity
* NormalizationService: rounds values to correct range of settings when switching units
  * What are the values to test?
* PlannerService: 
  * MaxGasDensity is used when calling task
  * Events are filtered by AppSettings
* Scheduler: Change of maxDensity triggers schedule calculation
* Diver.component.ts: Add tests for rmv and stressRmv save and load
* AppSettingsComponent:
  * Precision and Step for imperial units
  * Precision and Step for metric units
  * Values are reloaded after switch to and from imperial units and click Use button
  * Values are Saved to PreferencesStore after clicking Use button
  * Values are loaded from PreferencesStore after component initialization
