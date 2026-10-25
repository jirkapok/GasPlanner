import { Salinity } from '../physics/pressure-converter';
import { Options } from './Options';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';

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

    /** Open circuit breathing using the same depth converter as the algorithm for the options */
    public static openCircuit(options: Options): OpenCircuitBreathing {
        return new OpenCircuitBreathing(new DepthConverterFactory(options).create());
    }
}
