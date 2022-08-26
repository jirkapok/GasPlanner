export class DateFormats {
    private static readonly secondsPerHour = 3600;
    private static readonly secondsPerDay =  DateFormats.secondsPerHour * 24;
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

    public static hoursDuration(seconds: number): number {
        return seconds / DateFormats.secondsPerHour;
    }

    private static hasHoursRuntime(seconds: number): boolean {
        const hoursCount = DateFormats.hoursDuration(seconds);
        return hoursCount >= 1;
    }
}
