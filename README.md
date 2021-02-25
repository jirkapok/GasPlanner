# Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations. Purpose of the application is to provide easy to use calculations.

> **NOTE:** Running instance is available at [https://jirkapok.github.io/GasPlanner/](https://jirkapok.github.io/GasPlanner/)

## Disclaimer

None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

## Features

List of current features is part of [application help](./doc/help.md). 
Road map of planned features:

* Fix precision of decompression algorithm - Im progress
  * Allow max. depth exceeds gas ppO2
  * Add event when algorithm is unable to stay bellow ceiling during long deco stops
  * Fix loading of tissues when tissues are still loaded during ascent
* Allow define multiple gases - Im progress
  * Fix gas switch event label in chart
  * Fix consumed gas calculation
  * Move rock bottom per gas
  * Implement support of multiple tanks with the same gas
  * Add current gas to profile table
* Add option to define safety stop range including no safetystop below 10m dives
* Allow to define multiple levels
  * Allow to define multiple ascent speeds
* Add imperial units option
* Add help to all variables
* Add localization
* Add trimix support and calculator
  * Add air breaks
* Add option to define repetitive dives
  * Unify dive settings and default settings
* Add CNS and OTU calculations

## Prerequisites

To work on the application install NodeJs, AngularCli 8.3 and TypeScript. Recommended development environment is Visual Studio Code. Use `instalEnvironment.ps1` to get initial environment tools and packages.

## Build

To compile the application compile, first you need to install the dependency from local directory. To do so run `npm run build-lib`.
Than compile solution by `npm run build` to deploy `dist` directory. To start the app use `npm run start` for debugging purpose. See also `build.ps1` build script.

## Running the tests

Angular recommended testing environment is used, to run test use `npm run test` or `npm run e2e`

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

At time of development also other implementations are available:

* <https://github.com/igaponov/deco-model>
* <https://github.com/oliverjohnstone/npm-buhlmann-ZH-L16>
