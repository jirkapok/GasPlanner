import { Injectable } from '@angular/core';

@Injectable()
export class Urls {
    private static readonly rootUrl = 'https://github.com/jirkapok/GasPlanner';
    private static readonly rootHelpUrl = Urls.rootUrl + '/blob/master/doc';
    public static readonly notAvailable = 'not-available';

    public get projectUrl(): string {
        return Urls.rootUrl;
    }

    public helpUrl(fileName: string): string {
        return `assets/doc/${fileName}.md`;
    }

    public imageUrl(imageName: string): string {
        imageName = imageName.replace('./', '');
        return `assets/doc/${imageName}`;
    }
}
