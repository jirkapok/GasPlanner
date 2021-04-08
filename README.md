# Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations. Purpose of the application is to provide easy to use calculations.

> **NOTE:** Running instance is available at [https://jirkapok.github.io/GasPlanner/](https://jirkapok.github.io/GasPlanner/)

## Disclaimer

None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

## Features - Road map

List of current features is part of [application help](./doc/help.md).

Road map of planned features:

* Add more events as errors from algorithm: end of NDL, exceeded max. stop duration, fast ascent or descent, safety stop, narcotic depth
* Allow to define multiple levels
  * Allow to define multiple ascent speeds
  * Add option to define  last stop/safety stop range
  * Allow no safety stop below 10m dives in simple mode
* Add trimix support and calculator
  * Add option to define maximum narcotic depth
  * Add option to count oxygen in narcotic gas in narcotic depth calculation
  * Add air breaks
* Add imperial units option
* Add help to all variables
* Add localization
* Add option to define repetitive dives
  * Unify dive settings and default settings
* Add CNS and OTU calculations

## Donate

Keep the project Alive!

[![$25](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X28G9FEYUN6CJ)

## Prerequisites

To work on the application install NodeJs, AngularCli 11.0 and TypeScript. Recommended development environment is Visual Studio Code. Use `instalEnvironment.ps1` to get initial environment tools and packages.

## Build

To compile the application compile, first you need to install the dependency from local directory. To do so run `npm run build-lib`.
Than compile solution by `npm run build` to deploy `dist` directory. To start the app use `npm run start` for debugging purpose. See also `build.ps1` build script.

## Running the tests

Angular recommended testing environment is used, to run test use `npm run test-lib`, `npm run test` or `npm run e2e`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Other tools resource

Based on following references:

* <https://github.com/archisgore/online-deco-console>
* <https://github.com/nyxtom/dive>
* <http://www.lizardland.co.uk/DIYDeco.html>
* <https://github.com/Subsurface-divelog>
* <https://www.frogkick.nl/files/understanding_m-values.pdf>
* <https://diverclub.ru/File/literatur/Deep_Stops.pdf>
* <https://thetheoreticaldiver.org/wordpress//var/lib/wordpress/wp-content/uploads/2017/11/dekotheorie1.pdf>
* <https://njscuba.net/gear/trng_10_deco.php>
* <https://thetheoreticaldiver.org/wordpress/index.php/2019/01/18/ndl-and-gradient-factors/>
* <http://www.alertdiver.com/altitude_and_decompression_sickness?fbclid=IwAR2iDWh0ZwvB_oRMmkqQnlYaY3lc1W5NrWTX3DQvDR6N8B3lHXbG9aNFiTA>
* <https://gue.com/blog/calculated-confusion-can-o2-get-you-high/?fbclid=IwAR0qxKp2Jt7rrN6YFA9g0QxZLtENi1TjGZQ8pkxSMY5q4VQuaBUZwn5-u0Q>
* <https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf>

At time of development also other implementations are available:

* <https://github.com/igaponov/deco-model>
* <https://github.com/oliverjohnstone/npm-buhlmann-ZH-L16>
