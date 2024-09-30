# TODO missing test cases

* GasBlenderComponent
* Diver.component.ts: Add tests for rmv and stressRmv save and load
* AppSettingsComponent:
  * Density Precision and Step for imperial units
  * Density Precision and Step for metric units
  * Values are reloaded after switch to and from imperial units and click Use button
  * Values are Saved to PreferencesStore after clicking Use button
  * Values are loaded from PreferencesStore after component initialization
  * Reset to default
  * Change of maxDensity triggers schedule calculation
* All other components without tests (currently have only smoke tests)
* Gases: airBreakGas
* Verify which gases can be switched from/to by IDC warning (extend current tests)
