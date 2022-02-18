import { Options } from './Options';

export class OptionExtensions {
    public static createOptions(gfLow: number, gfHigh?: number, maxPpO2?: number, maxDecoPpO2?: number, isFreshWater?: boolean): Options {
        const options = new Options(gfLow, gfHigh, maxPpO2, maxDecoPpO2, isFreshWater);
        OptionExtensions.applySimpleSpeeds(options);
        return options;
    }

    public static applySimpleSpeeds(options: Options): void {
        options.ascentSpeed6m = 10;
        options.ascentSpeed50percTo6m = 10;
        options.ascentSpeed50perc = 10;
        options.descentSpeed = 20;
    }
}
