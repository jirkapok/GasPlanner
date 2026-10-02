import { Gas } from '../gases/Gases';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Precision } from '../common/precision';
import { Time } from '../physics/Time';
import { BreathingModel } from './BreathingModel';
import { RebreatherOptions } from './RebreatherOptions';
import { LoopGas } from './LoopGas';
import { Rebreathers } from './Rebreathers';

/**
 * Passive semi-closed rebreather. The tank assigned to the segment is the supply gas.
 * The diver breathes steady state loop gas, which is leaner than the supply gas.
 */
export class PscrBreathing implements BreathingModel {
    public readonly usesGasSwitching = true;
    public readonly usesAirBreaks = false;

    /**
     * @param options rebreather options with injection ratio and metabolic oxygen consumption
     * @param rmv diver respiratory minute volume in liters/minute
     * @param depthConverter converts depth to absolute pressure
     */
    constructor(private options: RebreatherOptions, private rmv: number, private depthConverter: DepthConverter) { }

    public inspiredGas(sourceGas: Gas, depth: number): Gas {
        const ambientPressure = this.depthConverter.toBar(depth);
        return LoopGas.pscrSteadyState(ambientPressure, sourceGas, this.rmv, this.options.injectionRatio, this.options.metabolicO2);
    }

    public ppO2(sourceGas: Gas, depth: number): number {
        const loop = this.inspiredGas(sourceGas, depth);
        return loop.fO2 * this.depthConverter.toBar(depth);
    }

    public consumedLiters(segment: Segment, rmvPerSecond: number): number {
        const averagePressure = this.depthConverter.toBar(segment.averageDepth);
        const duration = Precision.roundTwoDecimals(segment.duration);
        const rmvPerMinute = Time.toSeconds(rmvPerSecond);
        const supplyPerMinute = Rebreathers.pscrSupplyRate(averagePressure, rmvPerMinute, this.options.injectionRatio);
        return Time.toMinutes(supplyPerMinute) * duration;
    }
}
