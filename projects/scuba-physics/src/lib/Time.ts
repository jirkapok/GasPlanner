export class Time {

    /** One seconds as base unit of decompression calculation. */
    public static readonly oneSecond = 1;

    /* One minute is 60 seconds */
    public static readonly oneMinute = 60;

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
     * Converts duration in seconds to Date structure
     *
     * @param seconds duration in seconds
     *
     * @returns amount seconds calculated from current duration
     */
    public static toDate(seconds: number): Date {
        // we don't care about UTC, because we handle date, only relative time
        return new Date(1970, 1, 1, 0, 0, seconds, 0);
    }
}
