import { Salinity } from './pressure-converter';
import { Options } from './Options';

export class OptionExtensions {
    public static createOptions(gfLow: number, gfHigh?: number, maxPpO2?: number, maxDecoPpO2?: number, salinity?: Salinity): Options {
        const options = new Options(gfLow, gfHigh, maxPpO2, maxDecoPpO2, salinity);
        OptionExtensions.applySimpleSpeeds(options);
        options.gasSwitchDuration = 1;
        return options;
    }

    public static applySimpleSpeeds(options: Options): void {
        options.ascentSpeed6m = 10;
        options.ascentSpeed50percTo6m = 10;
        options.ascentSpeed50perc = 10;
        options.descentSpeed = 20;
    }
}
