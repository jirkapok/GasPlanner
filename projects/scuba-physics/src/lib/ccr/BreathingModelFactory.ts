import { Options } from '../algorithm/Options';
import { DepthConverter } from '../physics/depth-converter';
import { BreathingModel, OpenCircuitBreathing } from './BreathingModel';
import { PscrBreathing } from './PscrBreathing';
import { CircuitType } from './RebreatherOptions';

export class BreathingModelFactory {
    /**
     * Creates breathing model based on selected circuit type.
     * @param options dive options including the rebreather options
     * @param rmv diver respiratory minute volume in liters/minute
     * @param depthConverter converter for the dive environment
     */
    public static create(options: Options, rmv: number, depthConverter: DepthConverter): BreathingModel {
        if (options.rebreather.circuit === CircuitType.pscr) {
            return new PscrBreathing(options.rebreather, rmv, depthConverter);
        }

        return new OpenCircuitBreathing(depthConverter);
    }
}
