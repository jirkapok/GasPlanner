# Gas planner

This is a web based application, which allows **recreational** scuba divers to do their simple gas planning calculations. Purpose of the application is to provide easy to use calculations.

> **NOTE:** Running instance is available at [http://gasplanner.azurewebsites.net](http://gasplanner.azurewebsites.net)

## Disclaimer

None of the authors, contributors, administrators, vandals, or anyone else connected with this project, in any way whatsoever, can be responsible for your use of the information contained in or linked from these web pages.

## Calculations Background

* Only one safety stop 3min. in 5 meters is currently supported (No deep stops nor GUE ascent stops).
* The safety stop is required for dives below 20 m
* Ascent speed 10m/min. is used
* When calculating ascent time 2 minutes are always added, to resolve immediate issues in depth.

## Prerequisites

To work on the application install NodeJs, AngularCli 6.0 and TypeScript. Recommended development environment is Visual Studio Code.

## Build

To compile the application compile it by `npm run build` and deploy `dist` directory. To start the app use `npm run start`. For debugging purpose

## Running the tests

Angular recommended testing environment is used, to run test use `npm run test` or `npm run e2e`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
