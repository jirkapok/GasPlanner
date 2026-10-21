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
 * Closed circuit rebreather holding a setpoint. The tank assigned to the segment is the diluent,
 * oxygen is added from the oxygen tank (second tank). Rebreather types define only the setpoint and oxygen usage.
 */
export abstract class ClosedCircuitBreathing implements BreathingModel {
    public readonly usesGasSwitching = false;
    public readonly usesAirBreaks = false;
    /** Used in error messages, e.g. 'mCCR' */
    protected abstract readonly circuitName: string;

    /**
     * @param options rebreather options of the dive
     * @param tanks all tanks of the dive, the second one is the oxygen tank
     * @param depthConverter converts depth to absolute pressure
     */
    constructor(protected options: RebreatherOptions, private tanks: Tank[], protected depthConverter: DepthConverter) { }

    public get oxygenTank(): Tank | undefined {
        return RebreatherTanks.oxygen(this.tanks);
    }

    public inspiredGas(sourceGas: Gas, depth: number, isAscent = false): Gas {
        const ambientPressure = this.depthConverter.toBar(depth);
        const setpoint = this.setpoint(depth, isAscent);
        return LoopGas.constantPpO2(ambientPressure, sourceGas, setpoint);
    }

    public ppO2(sourceGas: Gas, depth: number, isAscent = false): number {
        const loop = this.inspiredGas(sourceGas, depth, isAscent);
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
        return Time.toMinutes(duration) * this.oxygenRate();
    }

    public validate(): Event[] {
        const oxygenTank = this.oxygenTank;

        if (!oxygenTank || !oxygenTank.gas.compositionEquals(StandardGases.oxygen)) {
            return [Event.createError(`${this.circuitName} needs oxygen in the second tank.`)];
        }

        return [];
    }

    /**
     * Oxygen partial pressure in bars the rebreather holds in the loop.
     * @param depth in meters
     * @param isAscent true, if the depth is after the deepest point of the dive
     */
    protected abstract setpoint(depth: number, isAscent: boolean): number;

    /** Oxygen consumed from the oxygen tank in liters/minute surface equivalent */
    protected abstract oxygenRate(): number;
}
