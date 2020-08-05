export class Time {

    /* One minute is 60 seconds */
    public static readonly oneMinute = 60;

    /**
     * Converts duration in minutes to seconds
     *
     * @param current duration in minutes
     *
     * @returns amount seconds calculated from current duration
     */
    public static toSeconds(current: number): number {
        return current * Time.oneMinute;
    }

    /**
     * Converts duration in minutes to seconds
     *
     * @param current duration in minutes
     *
     * @returns amount seconds calculated from current duration
     */
    public static toMinutes(current: number): number {
        return current / Time.oneMinute;
    }
}
