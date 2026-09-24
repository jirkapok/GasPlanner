import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../shared/language.service';

@Pipe({
    name: 'number',
    pure: false
})
export class LocaleNumberPipe implements PipeTransform {
    constructor(private languages: LanguageService) {}

    public transform(value: number | string | null | undefined, digitsInfo?: string): string | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        return this.languages.formatNumber(Number(value), digitsInfo);
    }
}
