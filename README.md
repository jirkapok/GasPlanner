# Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations. Purpose of the application is to provide easy to use calculations. Works also on mobile devices in offline mode.

> **NOTE:** Running instance is available at [https://jirkapok.github.io/GasPlanner/](https://jirkapok.github.io/GasPlanner/)

## Disclaimer

None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

## Features - Road map

* Open circuit only multi-level dives
* Multiple nitrox and Trimix/Helitrox gases/tanks
* Decompression calculated using Bühlmann ZHL-16C algorithm
* Conservatism using Gradient factors
* Calculation of consumed gas and rock bottom for each tank
* Environment using water salinity and altitude options
* Ascent plan using table and chart with list of warnings
* Share dive plan using url address
* Nitrox and RMV/SAC calculators
* No decompression limits table
* See more in **[Application help](./doc/help.md)**
* See also [Road map of planned features](./doc/roadmap.md)

## Donate

Keep the project Alive!

[![$25](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X28G9FEYUN6CJ)

## Prerequisites

To work on the application install NodeJs, AngularCli and TypeScript. Recommended development environment is Visual Studio Code. Use `instalEnvironment.ps1` to get initial environment tools and packages.

## Build

To compile the application compile, first you need to install the dependency from local directory. To do so run `npm run build-lib`.
Than compile solution by `npm run build` to deploy `dist` directory. To start the app use `npm run start` for debugging purpose. See also `build.ps1` build script.
Development state of the art can also be checked using Github Actions:

[![Build status](https://github.com/jirkapok/GasPlanner/actions/workflows/main.yml/badge.svg)](https://github.com/jirkapok/GasPlanner/actions)

## Running the tests

Angular recommended testing environment is used, to run test use `npm run test-lib`, `npm run test`. To test the progressive web application behavior use `npm run start-pwa`.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
