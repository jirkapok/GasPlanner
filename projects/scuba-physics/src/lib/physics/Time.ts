export class Time {

    /** One seconds as base unit of decompression calculation. */
    public static readonly oneSecond = 1;

    /** One minute is 60 seconds */
    public static readonly oneMinute = 60;

    /** One hour is 3600 seconds */
    public static readonly oneHour = Time.oneMinute * 60;

    /** Maximum deco stop duration one day (86400 seconds) */
    public static readonly oneDay = Time.oneHour * 24;

    /** Default duration of the safety stop */
    public static readonly safetyStopDuration = Time.oneMinute * 3;

    /**
     * Converts duration in minutes to seconds
     *
     * @param minutes duration in minutes
     *
     * @returns amount seconds calculated from current duration
     */
    public static toSeconds(minutes: number): number {
        return minutes * Time.oneMinute;
    }

    /**
     * Converts duration in seconds to minutes
     *
     * @param seconds duration in seconds
     *
     * @returns amount minutes calculated from seconds duration
     */
    public static toMinutes(seconds: number): number {
        return seconds / Time.oneMinute;
    }

    /**
     * Converts duration in seconds to hours
     *
     * @param seconds duration in seconds
     *
     * @returns amount hours calculated from seconds duration
     */
    public static toHours(seconds: number): number {
        return seconds / Time.oneHour;
    }
}
