import { Time } from 'scuba-physics';

export class DateFormats {
    public static hasHoursRuntime(seconds: number): boolean {
        const duration = Time.toDate(seconds);
        const hasHours = duration.getHours() > 0;
        return hasHours;
    }

    public static selectChartTimeFormat(seconds: number): string {
        if (DateFormats.hasHoursRuntime(seconds)) {
            return '%H:%M:%S';
        }

        return '%M:%S';
    }

    public static selectTimeFormat(seconds: number): string {
        if (DateFormats.hasHoursRuntime(seconds)) {
            return 'H:m:ss';
        }

        return 'm:ss';
    }
}
