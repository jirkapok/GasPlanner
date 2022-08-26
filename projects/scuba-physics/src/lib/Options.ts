import { DepthOptions } from './depth-converter';
import { DepthLevelOptions } from './DepthLevels';
import { GasOptions } from './Gases';
import { Salinity } from './pressure-converter';
import { SpeedOptions } from './speeds';


export enum SafetyStop {
    never = 1,
    auto = 2,
    always = 3
}

// See Options for values meaning
export class OptionDefaults {
    public static readonly altitude = 0;
    public static readonly saltWater = Salinity.salt;
    public static readonly roundStopsToMinutes = false;
    public static readonly gasSwitchDuration = 2;
    public static readonly problemSolvingDuration = 1;
    public static readonly lastStopDepth = 3;
    public static readonly lastStopDepthRecre = 5;
    public static readonly safetyStopRecre = SafetyStop.auto;
    public static readonly decoStopDistance = 3;
    public static readonly minimumAutoStopDepth = 10;

    public static readonly addSafetyStop = true;
    public static readonly maxEND = 30;
    public static readonly oxygenNarcotic = true;

    public static readonly ascentSpeed6m = 3;
    public static readonly ascentSpeed50percTo6m = 6;
    public static readonly ascentSpeed50perc = 9;
    public static readonly descentSpeed = 18;

    public static readonly gfLow = 0.4;
    public static readonly gfHigh = 0.85;
    public static readonly maxPpO2 = 1.4;
    public static readonly maxDecoPpO2 = 1.6;

    public static setMediumConservatism(options: Options): void {
        options.gfLow = OptionDefaults.gfLow;
        options.gfHigh = OptionDefaults.gfHigh;
    }

    public static useRecreational(options: Options): void {
        OptionDefaults.useGeneralRecommended(options);
        options.ascentSpeed50perc = OptionDefaults.ascentSpeed50perc;
        options.ascentSpeed50percTo6m = OptionDefaults.ascentSpeed50perc;
        options.ascentSpeed6m = OptionDefaults.ascentSpeed50perc;
        options.lastStopDepth = OptionDefaults.lastStopDepthRecre;
    }

    public static useRecommended(options: Options): void {
        OptionDefaults.useGeneralRecommended(options);
        options.ascentSpeed50perc = OptionDefaults.ascentSpeed50perc;
        options.ascentSpeed50percTo6m = OptionDefaults.ascentSpeed50percTo6m;
        options.ascentSpeed6m = OptionDefaults.ascentSpeed6m;
        options.lastStopDepth = OptionDefaults.lastStopDepth;
    }

    private static useGeneralRecommended(options: Options): void {
        options.safetyStop = OptionDefaults.safetyStopRecre;
        options.roundStopsToMinutes = OptionDefaults.roundStopsToMinutes;
        options.gasSwitchDuration = OptionDefaults.gasSwitchDuration;
        options.descentSpeed = OptionDefaults.descentSpeed;
        options.oxygenNarcotic = OptionDefaults.oxygenNarcotic;
        options.maxEND = OptionDefaults.maxEND;
    }
}

/** All the units defined here need to be used only in metric system */
export class Options implements GasOptions, DepthOptions, DepthLevelOptions, SpeedOptions {
    /**
     * meters above see level, 0 for see level (default)
     */
    public altitude = OptionDefaults.altitude;

    /** If true (default) deco stops are rounded up to whole minutes (I.e. longer ascent).
     *  Otherwise, length of stops is not rounded and profile generates precise stops in seconds .  */
    public roundStopsToMinutes = OptionDefaults.roundStopsToMinutes;

    /** Gas switch stop length in minutes */
    public gasSwitchDuration = OptionDefaults.gasSwitchDuration;

    /**
     * If configured, adds 3 minutes to last stop in 3 meters.
     * In case Auto, adds the stop, only if the maximum depth defined by minimumAutoStopDepth.
     */
    public safetyStop = OptionDefaults.safetyStopRecre;

    /**
     * Depth in meters where to execute the last stop, should be 3-6 m (default 3 m).
     */
    public lastStopDepth = OptionDefaults.lastStopDepth;

    /**
     * Depth difference between two deco stops in metres.
     * Default 3 meters
     */
    public decoStopDistance = OptionDefaults.decoStopDistance;

    /** Depth in meters, default 10 meters */
    public minimumAutoStopDepth = OptionDefaults.minimumAutoStopDepth;

    /**
     * Maximum equivalent air narcotic depth in meters, default 30 meters
     */
    public maxEND = OptionDefaults.maxEND;

    /** True, if oxygen fraction should be considered narcotic, otherwise false */
    public oxygenNarcotic = true;

    /**
     * Usual Ascent speed of diver swim in depths below 6 meters in metres/minute, default 3 meters/minute.
     */
    public ascentSpeed6m = OptionDefaults.ascentSpeed6m;

    /**
     * Usual Ascent speed of diver swim in depths from 50% of average depth in metres/minute up to 6 meters, default 6 meters/minute.
     */
    public ascentSpeed50percTo6m = OptionDefaults.ascentSpeed50percTo6m;

    /**
     * Usual Ascent speed of diver swim in depths between 50% average depth and 6 meters in metres/minute, default 9  meters/minute.
     */
    public ascentSpeed50perc = OptionDefaults.ascentSpeed50perc;

    /**
     * Usual descent speed used by the diver in metres/minute, default 18 meters/minute.
     */
    public descentSpeed = OptionDefaults.descentSpeed;

    /** In case of problem how long does it take to solve the problem in minutes.
     * This time is added to consumption on bottom when calculating rock bottom */
    public problemSolvingDuration = OptionDefaults.problemSolvingDuration;

    constructor(
        // Gradient factors in Shearwater
        // Low (45/95)
        // Med (40/85)
        // High (35/75)

        /**
         * Low gradient factor  in range 0-1 (e.g 0-100%), default 0.4
         */
        public gfLow: number = OptionDefaults.gfLow,

        /**
         * Hight gradient factor in range 0-1 (e.g 0-100%), default 0.85
         */
        public gfHigh: number = OptionDefaults.gfHigh,

        /**
         * Maximum pp02 to be used during the dive in range 0.21-1.6, default 1.4
         */
        public maxPpO2: number = OptionDefaults.maxPpO2,

        /**
         * Maximum pp02 to be used during decompression in range 0.21-1.6, default 1.6
         */
        public maxDecoPpO2: number = OptionDefaults.maxDecoPpO2,

        /**
         * Water type used to distinguish depth converter based on density, default salt.
         */
        public salinity: Salinity = OptionDefaults.saltWater
    ) {
        this.gfLow = gfLow || OptionDefaults.gfLow;
        this.gfHigh = gfHigh || OptionDefaults.gfHigh;
        this.maxPpO2 = maxPpO2 || OptionDefaults.maxPpO2;
        this.maxDecoPpO2 = maxDecoPpO2 || OptionDefaults.maxDecoPpO2;
        this.salinity = salinity || OptionDefaults.saltWater;
    }

    public loadFrom(other: Options): void {
        // gases
        this.gfLow = other.gfLow || this.gfLow;
        this.gfHigh = other.gfHigh || this.gfHigh;
        this.maxPpO2 = other.maxPpO2 || this.maxPpO2;
        this.maxDecoPpO2 = other.maxDecoPpO2 || this.maxDecoPpO2;
        this.oxygenNarcotic = other.oxygenNarcotic;

        // environment
        this.salinity = other.salinity || this.salinity;
        // altitude is the only one property, which accepts 0;
        this.altitude = (other.altitude || other.altitude === 0) ? other.altitude : this.altitude;
        this.roundStopsToMinutes = other.roundStopsToMinutes || this.roundStopsToMinutes;
        this.gasSwitchDuration = other.gasSwitchDuration || this.gasSwitchDuration;
        this.problemSolvingDuration = other.problemSolvingDuration || this.problemSolvingDuration;

        // depths
        this.lastStopDepth = other.lastStopDepth || this.lastStopDepth;
        this.decoStopDistance = other.decoStopDistance || this.decoStopDistance;
        this.minimumAutoStopDepth =  other.minimumAutoStopDepth || this.minimumAutoStopDepth;
        this.safetyStop = other.safetyStop || this.safetyStop;
        this.maxEND = other.maxEND || this.maxEND;

        // speeds
        this.ascentSpeed6m = other.ascentSpeed6m || this.ascentSpeed6m;
        this.ascentSpeed50percTo6m = other.ascentSpeed50percTo6m || this.ascentSpeed50percTo6m;
        this.ascentSpeed50perc = other.ascentSpeed50perc || this.ascentSpeed50perc;
        this.descentSpeed = other.descentSpeed || this.descentSpeed;
    }
}
