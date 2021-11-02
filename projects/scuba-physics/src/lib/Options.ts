import { DepthOptions } from './depth-converter';
import { GasOptions } from './Gases';

export class Options implements GasOptions, DepthOptions {
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
    public addSafetyStop: boolean;

    /**
     * Usual Ascent speed used by the diver in metres/minute, default 10 meters/minute.
     */
    public ascentSpeed: number;

    /**
     * Usual descent speed used by the diver in metres/minute, default 20 meters/minute.
     */
    public descentSpeed: number;

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
         * Maximum equivalent air narcotic depth in meters, default 30 meters
         */
        public maxEND: number,

        /**
         * Select water salinity, default false (salt water)
         */
        public isFreshWater: boolean,

        /**
         * If true, adds 3 minutes to last stop in 3 meters
         */
        addSafetyStop?: boolean,

        /**
         * Usual Ascent speed used by the diver in metres/minute, default 10 meters/minute.
         */
        ascentSpeed?: number,

        /**
         * Usual descent speed used by the diver in metres/minute, default 20 meters/minute.
         */
        descentSpeed?: number,

        /**
         * meters above see level, 0 for see level (default)
         */
        altitude?: number
    ) {
        this.gfLow = gfLow || 0.4;
        this.gfHigh = gfHigh || 0.85;
        this.maxPpO2 = maxPpO2 || 1.4;
        this.maxDecoPpO2 = maxDecoPpO2 || 1.6;
        this.maxEND = maxEND || 30;
        this.isFreshWater = isFreshWater || false;
        this.addSafetyStop = addSafetyStop || false;
        this.ascentSpeed = ascentSpeed || 10;
        this.descentSpeed = descentSpeed || 20;
        this.altitude = altitude || 0;
    }
}
