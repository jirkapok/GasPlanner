# Application settings

## Units

> We strongly encourage to use metric system, which is easy to use.

In case you prefer to use Imperial units the app will switch to that system and all values will use feet, cubic feet, feet above sea water and psi. The default value is metric system. Keep mind that the app primary uses metric system and different values than expected may be caused by rounding.
See also [this video](https://youtu.be/gYa1bvFO0uk)

## Limits

Here you can find default options used when you open the application and plan new dive. Changing the values apply them immediately to the current plan.

* `SAC`: Provide your own observed average consumption from previous dives. If you don't know use [RMV/SAC calculator](./sac.md) to get this value. Defaults to 20 liters/minute. See rock bottom calculation to see how this value is used for emergency ascent.
* `Maximum ppO2`: Used for bottom time of the profile. Most recreational agencies recommend 1.4, but even lower value should be considered.
* `Maximum deco ppO2`: Used only in case of calculated ascent or in case of rock bottom calculation to choose the best decompression mix. For decompression 1.6 is common recommended value.

> In both cases the ppO2 value should never be higher than 1.6 for recreational divers.


## Ignored issues

Every switch is associated with one type of issue. Here you can disable issues which may disturb you and you are not interested to see them in dive results.


## Action buttons

* `Use`: Used to save current settings to be able to use them in later planning. This stores the content of dive planning including settings to your browser cookies in your local computer.
* `Reset to default`: Used to reset all settings to default values on the screen. This does not apply the settings yet. To apply them use `Use` button.
