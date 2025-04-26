import { Injectable } from '@angular/core';

@Injectable()
export class Urls {
    public static readonly notAvailable = 'not-available';
    public static readonly learnSections = 'assets/learn/questions.json';

    private static readonly rootUrl = 'https://github.com/jirkapok/GasPlanner';
    private static readonly rootHelpUrl = Urls.rootUrl + '/blob/master/doc';
    private static readonly assetsLearn = 'assets/learn/';
    private static readonly assetsDoc = 'assets/doc/';

    public get projectUrl(): string {
        return Urls.rootUrl;
    }

    public helpMarkdownUrl(fileName: string): string {
        return Urls.assetsDoc + `${fileName}.md`;
    }

    public helpUrl(document: string, anchor: string | undefined): string {
        const anchorPath = anchor ?? '';
        return `/help/${document}/${anchorPath}`;
    }

    public imageUrl(imageName: string): string {
        imageName = imageName.replace('./', '');
        return Urls.assetsDoc + imageName;
    }

    public quizUrl(fileName: string): string {
        return Urls.assetsLearn + fileName + 'Quiz.json';
    }
}
