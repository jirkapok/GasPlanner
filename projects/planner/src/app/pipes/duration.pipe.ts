import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateFormats } from '../shared/formaters';
import { Time } from 'scuba-physics';

@Pipe({
    name: 'duration'
})
export class DurationPipe implements PipeTransform {
    constructor(private datePipe: DatePipe) {}

    transform(value: number | undefined, maxValue: number): string {
        if(!value) {
            return '';
        }

        value = Math.abs(value);
        maxValue = Math.abs(maxValue);
        const duration = DateFormats.toDate(value);
        const format = DateFormats.selectTimeFormat(maxValue);
        const minutesPart = this.datePipe.transform(duration, format) || '';
        let hours = Time.toHours(value);
        hours = Math.trunc(hours);

        if(hours >= 1) {
            return `${hours}:${minutesPart}`;
        }

        return minutesPart;
    }
}
