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
        result += newValue.getHours() * Math.pow(Time.oneMinute, 2);
        return result;
    }

    private static hasHoursRuntime(seconds: number): boolean {
        const hoursCount = Time.toHours(seconds);
        return hoursCount >= 1;
    }
}
