export class Time {

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
        const miliseconds = seconds * 1000;
        return new Date(miliseconds);
    }
}
