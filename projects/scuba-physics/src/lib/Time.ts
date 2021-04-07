export class Time {

    /** One seconds as base unit of decompression calculation. */
    public static readonly oneSecond = 1;

    /** One minute is 60 seconds */
    public static readonly oneMinute = 60;

    /** Maximum deco stop duration one day */
    public static readonly oneDay = 24 * 60 * Time.oneMinute;

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
        // we don't care about UTC, because we don't handle date, only relative time
        return new Date(1970, 1, 1, 0, 0, seconds, 0);
    }

    /**
     * Extracts number of seconds from date parameter
     *
     * @param date text containing data value
     */
    public static secondsFromDate(date: string): number {
        const newValue = new Date(date);
        let result = newValue.getSeconds();
        result += newValue.getMinutes() * Time.oneMinute;
        result += newValue.getHours() * Math.pow(Time.oneMinute, 2);
        return result;
    }
}
