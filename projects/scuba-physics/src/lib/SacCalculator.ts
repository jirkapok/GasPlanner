import { Precision } from './precision';
import { DepthConverter } from './depth-converter';

/**
 * Surface air consumption formulas
 */
export class SacCalculator {

    constructor(private depthConverter: DepthConverter) {
    }

    /**
     * Calculate surface air consumption in liter/minute
     *
     * @param depth - average depth in meters
     * @param tank - tank size in liters
     * @param used - amount of gas consumed in bars
     * @param duration - duration of the dive at depth in minutes
     * @returns Sac rounded to 0 digits in liter/minute.
     */
    public calculateSac(depth: number, tank: number, used: number, duration: number): number {
        const bars = this.depthConverter.toBar(depth);
        const result = tank * used / duration / bars;
        return Precision.ceilTwoDecimals(result);
    }

    /**
     * Calculates how long given gas can be used at given depth.
     *
     * @param depth - average depth in meters
     * @param tank - tank size in liters
     * @param used - amount of gas consumed in bars
     * @param sac - surface air consumption in liter/minute
     * @returns Duration in minutes
     */
    public calculateDuration(depth: number, tank: number, used: number, sac: number): number {
        const bars = this.depthConverter.toBar(depth);
        const result = tank * used / sac / bars;
        return Precision.ceil(result);
    }

    /**
     * Calculates how much gas is consumed from tank at given depth by diver with given air consumption.
     *
     * @param depth - average depth in meters
     * @param tank - tank size in liters
     * @param duration - duration of the dive at depth in minutes
     * @param sac - surface air consumption in liter/minute
     * @returns Used gas in bars
     */
    public calculateUsed(depth: number, tank: number, duration: number, sac: number): number {
        const bars = this.depthConverter.toBar(depth);
        const result = duration * bars * sac / tank;
        return Precision.ceil(result);
    }
}
