import { Options } from '../algorithm/Options';
import { DepthConverter } from '../physics/depth-converter';
import { Tank } from '../consumption/Tanks';
import { BreathingModel, OpenCircuitBreathing } from './BreathingModel';
import { PscrBreathing } from './PscrBreathing';
import { MccrBreathing } from './MccrBreathing';
import { CircuitType } from './RebreatherOptions';

export class BreathingModelFactory {
    /**
     * Creates breathing model based on selected circuit type.
     * @param options dive options including the rebreather options
     * @param rmv diver respiratory minute volume in liters/minute
     * @param tanks all tanks of the dive, the same instances which are consumed
     * @param depthConverter converter for the dive environment
     */
    public static create(options: Options, rmv: number, tanks: Tank[], depthConverter: DepthConverter): BreathingModel {
        // TODO consider send only rebreather options
        switch (options.rebreather.circuit) {
            case CircuitType.pscr:
                return new PscrBreathing(options.rebreather, rmv, depthConverter);
            case CircuitType.mccr:
                return new MccrBreathing(options.rebreather, tanks, depthConverter);
            default:
                return new OpenCircuitBreathing(depthConverter);
        }
    }
}
