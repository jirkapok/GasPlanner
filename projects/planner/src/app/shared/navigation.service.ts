import { Injectable } from '@angular/core';

@Injectable()
export class Urls {
    public static readonly notAvailable = 'not-available';
    private static readonly rootUrl = 'https://github.com/jirkapok/GasPlanner';
    private static readonly assetsDoc = 'assets/doc/';

    public get projectUrl(): string {
        return Urls.rootUrl;
    }

    public helpMarkdownUrl(fileName: string): string {
        return Urls.assetsDoc + `${fileName}.md`;
    }

    public helpUrl(document: string, anchor?: string): string {
        const anchorPath = anchor ?? '';
        return `/help/${document}/${anchorPath}`;
    }

    public imageUrl(imageName: string): string {
        imageName = imageName.replace('./', '');
        return Urls.assetsDoc + imageName;
    }
}
