# Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations. Purpose of the application is to provide easy to use calculations.

> **NOTE:** Running instance is available at [https://jirkapok.github.io/GasPlanner/](https://jirkapok.github.io/GasPlanner/)

## Disclaimer

None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

## Features

List of current features is part of [application help](./doc/help.md). Road map of planned features:

* Add altitude option
* Fix precision of decompression algorithm
  * Fix ceiling calculation during ascent based on gradient factors
* Add option to define gradient factors
* Add option to define safety stop range
* Add imperial units option
* Add switch recreational/technical divers
* Allow define multiple gases
* Allow to define multiple levels
* Add help to all variables
* Add localization
* Add trimix calculator
* Add option to define repetitive dives

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

Based on following tools:

* <https://github.com/archisgore/online-deco-console>
* <https://github.com/nyxtom/dive>
* <http://www.lizardland.co.uk/DIYDeco.html>
* <https://github.com/Subsurface-divelog>
* <https://www.frogkick.nl/files/understanding_m-values.pdf>
* <https://diverclub.ru/File/literatur/Deep_Stops.pdf>
* <https://thetheoreticaldiver.org/wordpress//var/lib/wordpress/wp-content/uploads/2017/11/dekotheorie1.pdf>

At time of development also other implementations are available:

* <https://github.com/igaponov/deco-model>
* <https://github.com/oliverjohnstone/npm-buhlmann-ZH-L16>
