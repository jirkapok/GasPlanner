import { DepthOptions } from './depth-converter';
import { GasOptions } from './Gases';
import { SpeedOptions } from './speeds';

export class Options implements GasOptions, DepthOptions, SpeedOptions {
    /**
     * meters above see level, 0 for see level (default)
     */
    public altitude = 0;

    /** If true (default) deco stops are rounded up to whole minutes (I.e. longer ascent).
     *  Otherwise, length of stops is not rounded and profile generates precise stops in seconds .  */
    public roundStopsToMinutes = true;

    /** Gas switch stop length in minutes */
    public gasSwitchDuration = 1;

    /**
     * If true, adds 3 minutes to last stop in 3 meters
     */
    public addSafetyStop = false;

    /**
     * Maximum equivalent air narcotic depth in meters, default 30 meters
     */
    public maxEND = 30;

    /**
     * Usual Ascent speed of diver swim in depths below 6 meters in metres/minute, default 3 meters/minute.
     */
    public ascentSpeed6m = 10;
    // TODO apply default values

    /**
     * Usual Ascent speed of diver swim in depths from 50% of average depth in metres/minute up to 6 meters, default 6 meters/minute.
     */
    public ascentSpeed50percTo6m = 10;

    /**
     * Usual Ascent speed of diver swim in depths between 50% average depth and 6 meters in metres/minute, default 9  meters/minute.
     */
    public ascentSpeed50perc = 10;

    /**
     * Usual descent speed used by the diver in metres/minute, default 20 meters/minute.
     */
    public descentSpeed = 20;

    constructor(
        // Gradient factors in Shearwater
        // Low (45/95)
        // Med (40/85)
        // High (35/75)

        /**
         * Low gradient factor  in range 0-1 (e.g 0-100%), default 0.4
         */
        public gfLow: number,

        /**
         * Hight gradient factor in range 0-1 (e.g 0-100%), default 0.85
         */
        public gfHigh: number,

        /**
         * Maximum pp02 to be used during the dive in range 0.21-1.6, default 1.4
         */
        public maxPpO2: number,

        /**
         * Maximum pp02 to be used during decompression in range 0.21-1.6, default 1.6
         */
        public maxDecoPpO2: number,

        /**
         * Select water salinity, default false (salt water)
         */
        public isFreshWater: boolean
    ) {
        this.gfLow = gfLow || 0.4;
        this.gfHigh = gfHigh || 0.85;
        this.maxPpO2 = maxPpO2 || 1.4;
        this.maxDecoPpO2 = maxDecoPpO2 || 1.6;
        this.isFreshWater = isFreshWater || false;
    }

    public loadFrom(other: Options): void {
        this.gfLow = other.gfLow || this.gfLow;
        this.gfHigh = other.gfHigh || this.gfHigh;
        this.maxPpO2 = other.maxPpO2 || this.maxPpO2;
        this.maxDecoPpO2 = other.maxDecoPpO2 || this.maxDecoPpO2;
        this.isFreshWater = other.isFreshWater || this.isFreshWater;

        this.altitude = other.altitude || this.altitude;
        this.roundStopsToMinutes = other.roundStopsToMinutes || this.roundStopsToMinutes;
        this.gasSwitchDuration = other.gasSwitchDuration || this.gasSwitchDuration;
        this.addSafetyStop = other.addSafetyStop || this.addSafetyStop;
        this.maxEND = other.maxEND || this.maxEND;

        this.ascentSpeed6m = other.ascentSpeed6m || this.ascentSpeed6m;
        this.ascentSpeed50percTo6m = other.ascentSpeed50percTo6m || this.ascentSpeed50percTo6m;
        this.ascentSpeed50perc = other.ascentSpeed50perc || this.ascentSpeed50perc;
        this.descentSpeed = other.descentSpeed || this.descentSpeed;
    }
}
