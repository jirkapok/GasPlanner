import { Gas } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Segment } from '../depths/Segments';
import { Tank } from '../consumption/Tanks';
import { DepthConverter } from '../physics/depth-converter';
import { Precision } from '../common/precision';
import { Time } from '../physics/Time';
import { Event } from '../algorithm/CalculatedProfile';
import { BreathingModel } from './BreathingModel';
import { RebreatherOptions } from './RebreatherOptions';
import { LoopGas } from './LoopGas';
import { Rebreathers } from './Rebreathers';
import { RebreatherTanks } from './RebreatherTanks';

/**
 * Manual closed circuit rebreather. The tank assigned to the segment is the diluent.
 * The diver manually holds the setpoint, the needle valve adds oxygen from the oxygen tank at constant flow.
 */
export class MccrBreathing implements BreathingModel {
    public readonly usesGasSwitching = false;
    public readonly usesAirBreaks = false;

    /**
     * @param options rebreather options with setpoint, oxygen flow, metabolic oxygen consumption and loop volume
     * @param tanks all tanks of the dive, the second one is the oxygen tank
     * @param depthConverter converts depth to absolute pressure
     */
    constructor(private options: RebreatherOptions, private tanks: Tank[], private depthConverter: DepthConverter) { }

    public get oxygenTank(): Tank | undefined {
        return RebreatherTanks.oxygen(this.tanks);
    }

    public inspiredGas(sourceGas: Gas, depth: number): Gas {
        const ambientPressure = this.depthConverter.toBar(depth);
        return LoopGas.constantPpO2(ambientPressure, sourceGas, this.options.setpoint);
    }

    public ppO2(sourceGas: Gas, depth: number): number {
        const loop = this.inspiredGas(sourceGas, depth);
        return loop.fO2 * this.depthConverter.toBar(depth);
    }

    /** Diluent added to the loop to keep its volume during descent */
    public consumedLiters(segment: Segment): number {
        const startPressure = this.depthConverter.toBar(segment.startDepth);
        const endPressure = this.depthConverter.toBar(segment.endDepth);
        return Rebreathers.diluentForDescent(this.options.loopVolume, startPressure, endPressure);
    }

    public oxygenLiters(segment: Segment): number {
        const duration = Precision.roundTwoDecimals(segment.duration);
        const o2PerMinute = Rebreathers.mccrO2Rate(this.options.o2Flow, this.options.metabolicO2);
        return Time.toMinutes(duration) * o2PerMinute;
    }

    public validate(): Event[] {
        const oxygenTank = this.oxygenTank;

        if (!oxygenTank || !oxygenTank.gas.compositionEquals(StandardGases.oxygen)) {
            return [Event.createError('mCCR needs oxygen in the second tank.')];
        }

        return [];
    }
}
