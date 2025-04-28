# Dive info table

* `Total dive time` [minutes]: Total duration of the dive from the descent to the surfacing.
* `Time to surface (TTS)` [minutes]: Total duration of ascent from critical point of dive in case of emergency. Problem solving duration minutes are added to ascent duration to be able respond to situation at depth as recommended during scuba trainings.
* `Average depth` [meters]: Average depth of whole profile at end of the dive.
* `Rock bottom at` [minutes]: The moment at which the emergency ascent is calculated used to calculate the rock bottom. It is the last moment at highest depth.
* `No decompression time` [minutes]: The longest time diver can stay at required depth where direct ascent to the surface is considered to be safe. There may be small deco, which disappears during the ascent.
* `Maximum bottom time` [minutes]: The longest time diver can stay at required depth considering provided gases. Even, it may lead to decompression dive.
* `Highest gas density` [gram/liter]: The highest breathed gas density in the lungs during the dive. It depends on the gas and depth at the moment. 
* `Surface gradient` [percents]: Gradient factor at moment user surfaces. This can be used to identify risks when planning emergency profiles or identify relative state of the tissues after the dive. 
* `Off gasing start` [minutes/depth]: The moment during the dive, at which the 5th theoretical tissue starts to off gas. This is guessed moment, where decompression starts.

> **Emergency ascent may differ from calculated ascent**, because it is calculated at different time during the dive.

## Oxygen toxicity

There are usually two types of oxygen toxicity considered:

* Central Nervous System toxicity (CNS): manifests as symptoms such as visual changes (especially tunnel vision), ringing in the ears (tinnitus), nausea, twitching (especially of the face), behavioral changes (irritability, anxiety, confusion), and dizziness. This unit is measured in percents from exposure time limits.
* Pulmonary oxygen toxicity (OTU): Pulmonary toxicity symptoms result from an inflammation that starts in the airways leading to the lungs and then spreads into the lungs (tracheobronchial tree). The symptoms appear in the upper chest region (substernal and carinal regions). This begins as a mild tickle on inhalation and progresses to frequent coughing. If breathing increased partial pressures of oxygen continues, patients experience a mild burning on inhalation along with uncontrollable coughing and occasional shortness of breath (dyspnea).

See also [Oxygen toxicity at wiki](https://en.wikipedia.org/wiki/Oxygen_toxicity#Underwater). For both units there is a NOAA recommendation which our application follows. If any of these units reaches 80 % of its limit a warning is shown.
