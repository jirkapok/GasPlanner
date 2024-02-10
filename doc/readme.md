# Application help

* [Supported platforms](./readme.md#supported-platforms)
* [Theoretical model](./readme.md#theoretical-model)
* [Calculations Background](./readme.md#calculations-background)
* [Limitations](./readme.md#limitations)
* [Screen structure](./readme.md#screen-structure)
* Plan
    * [Tanks](./tanks.md)
    * [Standard gases](./standard_gases.md) 
    * [Depths](./depths.md)
    * [Options](./plan_options.md)
      * [Environment](./environment.md)
      * [Conservatism](./gradient_factors.md)
      * [Gases](./plan_options.md#gases)
      * [Stops](./stops.md)
      * [Speeds](./speeds.md)
      * [Diver](./plan_options.md#diver)
* Results
  * [Dive info table](./diveinfo.md)
  * [Oxygen toxicity](./diveinfo.md#oxygen-toxicity)
  * [Events causing errors and warnings](./events.md)
  * [Consumed gas charts](./consumed.md)
  * [Dive way points table](./waypoints_table.md)
  * [Dive profile chart](./profile_chart.md)
* [Application settings](./settings.md)
* [Calculators](./calculators.md)
    * [RMV/SAC](./sac.md)
    * [Nitrox](./nitrox.md)
    * [No decompression limits (NDL) table](./calculators.md#no-decompression-limits)
    * [Altitude](./calculators.md#altitude)
    * [Weight](./calculators.md#weight)
    * [Gas properties](./calculators.md#gas-properties)
    * [Redundancies](./calculators.md#redundancies)
* [External reading](./links.md)

## Supported platforms

This application works in Edge, Chrome, Safari and doesnt work in Firefox and Opera. Currently you can use it offline mode using "Add to home screen" in Edge or Chrome browsers. On mobile devices this feature works only on Android.

## Theoretical model

* All calculations are done in metric units (and than converted to imperial units when requested)
* Internally `Bühlmanns ZHL-16C` algorithm without any modification and with gradient factors is implemented.

## Calculations Background

For some calculations it is necessary to measure precise values. Earths physical model is simulated, but not to all details. In such cases some constants are used. Together with different rounding during the calculations, this is why diving software implementations differ and mainly also why some simplifications was used during your scuba diving courses. For example we count with sea level atmospheric pressure 1.01325 bar, but usually everybody counts with 1 bar only, which makes 1.325% deviation. We use such simplifications only in Nitrox calculator. Similar results you see in this application you should see in other applications or dive computers.

## Limitations

* TODO

## Screen structure

To be able calculate dive profile you need to enter Gases used during the dive, depth and calculation options, each of these is placed within its own box. Every time you change any option new profile is calculated. We distinguish two kind of views.

![Extended view switch](./extended_view_switch.png)

* `Simple`: For simple dives, faster to get results. Only one target depth and time with only one tank is available. Some options aren't visible and are simplified (e.g. you are unable to set precise gradient factors). If it is not enough use Extended view.
* `Extended (Trimix)`: Allows you define unlimited number of tanks and depth levels. You are free to customize details of the profile calculations. Switch back to simple resets some values, mainly depth levels and gases.


