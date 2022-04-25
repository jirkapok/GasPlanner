# Application help

## Calculations Background

For some calculations it is necessary to measure precise values. Earths physical model is simulated, but not to all details. In such cases some constants are used. Together with different rounding during the calculations, this is why diving software implementations differ and mainly also why some simplifications was used during your scuba diving courses. For example we count with sea level atmospheric pressure 1.01325 bar, but usually everybody counts with 1 bar only, which makes 1.325% deviation. We use such simplifications only in Nitrox calculator. Similar results you see in this application you should see in other applications or dive computers.

## Theoretical model

* All calculations are done in metric units (and than converted to imperial units when requested)
* Internally `Bühlmanns ZHL-16C` algorithm with gradient factors is implemented.

## Screen structure

To be able calculate dive profile you need to enter Gases used during the dive, depth and calculation options, each of these is placed within its own box. Every time you change any option new profile is calculated. We distinguish two kind of views.

![Extended view switch](./extended_view_switch.png)

* `Simple`: For simple dives, faster to get results. Only one target depth and time with only one tank is available. Some options aren't visible and are simplified (e.g. you are unable to set precise gradient factors). If it is not enough use Extended view.
* `Extended`: Allows you define unlimited number of tanks and depth levels. You are free to customize details of the profile calculations. Switch back to simple resets some values, mainly depth levels and gases.

## Details

* Plan
  * [Tanks and depths](./plan.md)
  * [Options](./plan_options.md)
  * [Results](./results.md)
* [Application settings](./settings.md)
* [Calculators](./calculators.md)
