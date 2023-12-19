import { Time } from 'scuba-physics';

export class DateFormats {
    /**
     *  Chart formatting
     *  Not showing days in chart, because it consumes lot of space
     *  https://github.com/d3/d3-time-format/blob/main/README.md
    */
    public static selectChartTimeFormat(seconds: number): string {
        if (DateFormats.hasHoursRuntime(seconds)) {
            return '%H:%M:%S';
        }

        return '%M:%S';
    }

    /**
     *  Angular formatting for waypoints table
     *  https://angular.io/api/common/DatePipe
     */
    public static selectTimeFormat(seconds: number): string {
        if (DateFormats.hasHoursRuntime(seconds)) {
            return 'mm:ss';
        }

        return 'm:ss';
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
        result += newValue.getHours() * Time.oneHour;
        return result;
    }

    // TODO add tests for surface interval formatting
    /**
     * Converts string in form "HH:MM" to number of seconds.
     * Returns null, if value cant be parsed.
     */
    public static parseToShortTime(newValue?: string | null): number | null {
        const timeFormat = /(\d{2})[:](\d{2})/;
        // the only way how set first dive is by using the applyFirst method
        const candidate = newValue || '00:00';
        const parsed = candidate.match(timeFormat);
        if(parsed) {
            const newHours = Number(parsed[1]) * Time.oneHour;
            const newMinutes = Number(parsed[2]) * Time.oneMinute;
            const newSeconds = newHours + newMinutes;
            return newSeconds;
        }

        return null;
    }

    /**
     *  Converts to number of seconds to string in form "HH:MM".
     */
    public static formatShortTime(seconds: number): string {
        const resultHours = Math.floor(seconds / (Time.oneHour));
        const resultHoursPad = resultHours.toString().padStart(2, '0');
        const resultMinutes = (seconds % (Time.oneHour)) / Time.oneMinute;
        const resultMinutesPad = resultMinutes.toString().padStart(2, '0');
        const result = `${resultHoursPad}:${resultMinutesPad}`;
        return result;
    }

    private static hasHoursRuntime(seconds: number): boolean {
        const hoursCount = Time.toHours(seconds);
        return hoursCount >= 1;
    }
}
