# Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations. Purpose of the application is to provide easy to use calculations.

> **NOTE:** Running instance is available at [https://jirkapok.github.io/GasPlanner/](https://jirkapok.github.io/GasPlanner/)

## Disclaimer

None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

## Features

* Only open circuit dives can be planned
* No multilevel dive profiles are supported
* No decompression dives
* Only air and nitrox gases are available
* Only one gas tank
* No repetitive dives

## Calculations Background

* Only one safety stop 3min. in 5 meters is currently supported (No deep stops nor GUE ascent stops).
* The safety stop is required for dives below 20 m
* Ascent speed 10m/min. and 20m/min. descend speed is used
* When calculating ascent time 2 minutes are always added, to resolve immediate issues in depth.

## Prerequisites

To work on the application install NodeJs, AngularCli 8.3 and TypeScript. Recommended development environment is Visual Studio Code.

## Build

To compile the application compile it by `npm run build` and deploy `dist` directory. To start the app use `npm run start`. For debugging purpose. To deploy the application to github pages use `angular-cli-ghpages` npm package.

## Running the tests

Angular recommended testing environment is used, to run test use `npm run test` or `npm run e2e`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Other tools resource

Based on following tools:

* https://github.com/archisgore/online-deco-console
* https://github.com/nyxtom/dive
* http://www.lizardland.co.uk/DIYDeco.html
* https://github.com/Subsurface-divelog

At time of development also other implementations are available:

* https://github.com/igaponov/deco-model
* https://github.com/oliverjohnstone/npm-buhlmann-ZH-L16
