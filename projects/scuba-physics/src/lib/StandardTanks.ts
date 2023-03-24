import { ImperialUnits } from './units';
import { Precision } from './precision';

/**
 *  Unit dependent default cylinder values
 *  https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities
 */
export class TankConstants {
    /** HP117 124 cuft tank as default single cylinder */
    public static readonly imperialTankSize = 124.1;

    /** HP117 3442 PSI default working pressure default single cylinder */
    public static readonly imperialTankWorkPressure = 3442;

    /** S80 cuft tank size for stage cylinder */
    public static readonly imperialStageSize = 80.1;

    /** S80 aluminum 3000 PSI default working pressure for stage cylinder */
    public static readonly imperialStageWorkPressure = 3000;

    /** 15L steel cylinder default single tank cylinder */
    public static readonly mertricTankSize = 15;

    /** S80 aluminum 11L cylinder default single tank cylinder */
    public static readonly metricStageSize = 11.1;

    /** Default working pressure in bars for single cylinder */
    public static readonly metricTankWorkPressure = TankConstants.fromImperial(TankConstants.imperialTankWorkPressure);

    /** Default working pressure in bars for stage cylinder */
    public static readonly metricStageWorkPressure = TankConstants.fromImperial(TankConstants.imperialStageWorkPressure);

    // TODO depth constants see levels in lib
    /** 20 ft depth as 6 m imperial alternative */
    public static readonly imperial3mDepth = 10;

    /**
     * Template for calculating rounded metric working pressure from imperial in psi.
     * Returns bars rounded to 3 decimals.
     **/
    public static fromImperial(sourcePsi: number): number {
        const units = new ImperialUnits();
        const bars = units.toBar(sourcePsi);
        return Precision.round(bars, 3);
    }
}
