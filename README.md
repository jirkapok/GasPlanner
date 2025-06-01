# Dugong Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations.
Purpose of the application is to provide easy to use calculations and help scuba divers to learn diving theory and formulas.
Works also on mobile devices in offline mode. [Why Dugong?](./doc/whydugong.md)

> **NOTE:** Running instance is available at **[https://dugong.online/](https://dugong.online/)**

## Disclaimer

None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

## Features

* **Share dive plan** using url address
* **Compare dives**
* Consumed gas charts
* List of warnings with explanation
* Open circuit repetitive multi-level dives
* Multiple nitrox and Trimix/Helitrox gases/tanks
* Environment using water salinity and altitude options
* Bühlmann ZHL-16C algorithm with Gradient factors
* Lot of calculators: RMV/SAC, Nitrox, Trimix properties, Cylinder Balancing, NDL table ...
* See more in **[Application help](./doc/readme.md)**

## Donate

Keep the project Alive!

[![$25](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X28G9FEYUN6CJ)

## Prerequisites

To work on the application install NodeJs, AngularCli and TypeScript. Recommended development environment is Visual Studio Code. On Windows you can use `build/installEnvironment.ps1` to get initial environment tools and packages, or you can use Github Codespaces for a ready-to-go hosted development environment.

## Build

To compile the application, first you need to install the dependencies from local directory. To do so run `npm run build-lib`.
Than compile solution by `npm run build` to deploy `dist` directory. To start the app use `npm start` for debugging purpose. See also `build/build.ps1` build script on Windows.
Development state of the art can also be checked using Github Actions:

[![Build status](https://github.com/jirkapok/GasPlanner/actions/workflows/main.yml/badge.svg?branch=develop)](https://github.com/jirkapok/GasPlanner/actions)

## Running the tests

Angular recommended testing environment is used, to run test use `npm run test-lib`, `npm test`. To test the progressive web application behavior use `npm run start-pwa`.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
