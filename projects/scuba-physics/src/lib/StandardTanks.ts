/**
 *  Unit dependent default cylinder values
 *  https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities
 */
export class TankConstants {
    // TODO move tank constants to lib
    /** HP117 124 cuft tank as default single cylinder */
    public static imperialTankSize = 124.1;

    /** HP117 3442 PSI default working pressure default single cylinder */
    public static imperialTankWorkPressure = 3442;

    /** S80 cuft tank size for stage cylinder */
    public static imperialStageSize = 80.1;

    /** S80 aluminum 3000 PSI default working pressure for stage cylinder */
    public static imperialStageWorkPressure = 3000;

    /** 15L steel cylinder default single tank cylinder */
    public static mertricTankSize = 15;

    /** S80 aluminum 11L cylinder default single tank cylinder */
    public static metricStageSize = 11.1;

    // TODO depth constants see levels in lib
    /** 20 ft depth as 6 m imperial alternative */
    public static imperial3mDepth = 10;
}
