# Computer example templates

TODO

* Some computers do not support trimix dives. How to prevent to select such computer?
* Do we need different screen layout in case of warning?
* Show some Text with supported values/Unsupported dive types (air/trimix/nitrox, number of gases, gas source OC/CCR)

## Aberrations/ Matrix

* GTR - Gas time remaining in minutes at current depth until the reserve is reached
* PSI, BAR - current tank pressure in pressure units
* NDL - no decompression limit in meters
* Max - maximum depth till BT
* BT, DT - bottom time, dive time currently elapsed time
* AVG - average depth till now in meters
* TTS - current total time to surface in minutes (needs to be calculated for every moment)
* Stop - remaining time of the safety or mandatory stop
* Asc - current ascent speed
* Tissues - loading of the leading tissue, 100 % = NDL reached

TODO to implement

* Shearwater like values - GF99, SurfGF, "@+5", "Δ+5"
* GTR, Current pressure

## Warnings

* Switch - proposed gas switch to concrete/next gas
* Ceil - Descent bellow ceiling
* Hight/low ppO2 - high or low oxygen content
* Slow down - ascent speed higher than maximum
* Gas reserve

## Aqualung i770r

Screen 1: Main

* Left upper corner (FT) - current depth, white
* right corner bellow NODECO - NDL, green
* Bellow PSI - current tank pressure, azure
* Bellow GTR - GTR, green
* Bellow Dive-t - DT, white
* right to FO2 - current gas name, white
* Warnings: bottom line color background box.
  * "DECO ENTRY" - after ndl finished, red bgd, white text
  * "SWITCH TO FO2: {XX}%" - bgd yellow, text black
  * "DOWN TO STOP" - Broken ceiling
  * "ALARM" - high ppO2, white text, red bgd
  * "TOO FAST" - White text, red bgd


Screen 2: More data
Rows self explanatory, white


## Mares Quad CI

Screen 1: Full Display

* left upper row: current depth, white
* right upper row: maximum depth, white
* right middle row: NDL, white
* left bottom row: DT
* right bottom row: Main GF
* Warnings:
  * "SLOW!" - Asc speed, white text, red bgd
  * "DECO STOP!" - Broken ceiling
  * "MOD EXCEEDED!" - high ppO2, white text, red bgd
  * "SWITCH TO xx% MOD {xx} m" - Gas switch, 2/3 screen bgd Cyan, white text 

Screen 2: E-Z Display

* First row: current depth
* Second row left: DT
* Second row rigth: Ndl
* Warnings: Screen 1 right bottom corner


## Shearwater peregrine

Screen 1: Recreational

* Left upper corner: current depth, white
* Bellow time: DT, white
* right bellow safety stop: remaining time of the safety stop, white, TODO what to show outside of the sfety stop
* bellow NDL: NDL, white
* Left to NDL: TODO
* left bottom row: gas name "NxXX", white
* middle bottom row: average depth, white
* right bottom row: TTS, white
* bellow temperature: current time of the day, white
* Warnings: whole last row
  * "LOW PPO2" - high ppO2
  * "LOW PPO2" - low ppo2, bgd black, yellow text
  * "MISSED DECO STOP" - Yellow text, gbd black
  * "FAST ASCENT" - Asc speed, Yellow text, gbd black
  * "NX{XX}" - gas switch, Yellow bgd, black text


## Shearwater Petrel/Perdix

Screen 1: Recreational = Peregrine Screen 1

Screen 2: OC Tech

Screen 3: CCR



## Garmin x50/x30

TODO

## Suunto Nautic

TODO

## Divesoft Freedom+

TODO

## Ratio ix3M

TODO

## To consider

* Apex DSX
* Halcyon Symbios
* ScubaPro Galileo G2
* Suunto Eon Steel/Core
* OSTC
