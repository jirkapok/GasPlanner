import { Gas } from '../gases/Gases';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Precision } from '../common/precision';

/**
 * Defines what the diver really breathes from the assigned gas source (tank or diluent).
 * Allows the algorithm, toxicity and consumption to work the same way for open circuit and rebreathers.
 */
export interface BreathingModel {
    /** True, if the algorithm may switch to better deco gas during ascent */
    readonly usesGasSwitching: boolean;
    /** True, if air breaks may be applied when breathing oxygen */
    readonly usesAirBreaks: boolean;
    /**
     * Gas really breathed by the diver.
     * @param sourceGas gas assigned to the segment (tank gas, diluent or supply gas)
     * @param depth in meters
     * @param isAscent true, if the segment is part of the calculated ascent
     */
    inspiredGas(sourceGas: Gas, depth: number, isAscent: boolean): Gas;
    /**
     * Oxygen partial pressure in bars breathed by the diver.
     * @param sourceGas gas assigned to the segment
     * @param depth in meters
     * @param isAscent true, if the segment is part of the calculated ascent
     */
    ppO2(sourceGas: Gas, depth: number, isAscent: boolean): number;
    /**
     * Liters consumed from the segment source tank.
     * @param rmvPerSecond liters/second
     */
    consumedLiters(segment: Segment, rmvPerSecond: number): number;
}

/** Diver breathes directly from the tank. Used also for the generated part of every emergency (bailout) ascent. */
export class OpenCircuitBreathing implements BreathingModel {
    public readonly usesGasSwitching = true;
    public readonly usesAirBreaks = true;

    constructor(private depthConverter: DepthConverter) { }

    public inspiredGas(sourceGas: Gas): Gas {
        return sourceGas;
    }

    public ppO2(sourceGas: Gas, depth: number): number {
        return sourceGas.fO2 * this.depthConverter.toBar(depth);
    }

    public consumedLiters(segment: Segment, rmvPerSecond: number): number {
        const averagePressure = this.depthConverter.toBar(segment.averageDepth);
        const duration = Precision.roundTwoDecimals(segment.duration);
        const consumed = duration * averagePressure * rmvPerSecond;
        return consumed;
    }
}

/**
 * Emergency ascent: the user defined part of the dive (including the deepest point) is breathed using the primary model,
 * the calculated ascent is breathed from the bailout model (open circuit).
 */
export class BailoutBreathing implements BreathingModel {
    private bailout: BreathingModel;

    constructor(private primary: BreathingModel, depthConverter: DepthConverter) {
        // bailout is always open circuit, when machine fails.
        this.bailout = new OpenCircuitBreathing(depthConverter);
    }

    /** Gas switching happens only during the ascent */
    public get usesGasSwitching(): boolean {
        return this.bailout.usesGasSwitching;
    }

    /** Air breaks happen only during the ascent */
    public get usesAirBreaks(): boolean {
        return this.bailout.usesAirBreaks;
    }

    public inspiredGas(sourceGas: Gas, depth: number, isAscent: boolean): Gas {
        return this.modelFor(isAscent).inspiredGas(sourceGas, depth, isAscent);
    }

    public ppO2(sourceGas: Gas, depth: number, isAscent: boolean): number {
        return this.modelFor(isAscent).ppO2(sourceGas, depth, isAscent);
    }

    /** Only the emergency ascent is consumed, which is always the bailout */
    public consumedLiters(segment: Segment, rmvPerSecond: number): number {
        return this.bailout.consumedLiters(segment, rmvPerSecond);
    }

    private modelFor(isAscent: boolean): BreathingModel {
        return isAscent ? this.bailout : this.primary;
    }
}
