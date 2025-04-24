import { Injectable } from '@angular/core';

@Injectable()
export class Urls {
    public static readonly notAvailable = 'not-available';
    public static readonly learnSections = 'assets/learn/learnSections.json';

    private static readonly rootUrl = 'https://github.com/jirkapok/GasPlanner';
    private static readonly rootHelpUrl = Urls.rootUrl + '/blob/master/doc';
    private static readonly assetsLearn = 'assets/learn/';
    private static readonly assetsDoc = 'assets/doc/';

    public get projectUrl(): string {
        return Urls.rootUrl;
    }

    public get standardGases(): string {
        return Urls.rootHelpUrl + '/standard_gases.md';
    }

    public get helpUrl(): string {
        return Urls.rootHelpUrl +'/readme.md';
    }

    public quizUrl(fileName: string): string {
        return Urls.assetsLearn + fileName + 'Quiz.json';
    }

    public infoUrl(fileName: string): string {
        return Urls.assetsDoc + fileName + '.md';
    }

    public infoImageUrl(imageName: string): string {
        imageName = imageName.replace('./', '');
        return Urls.assetsDoc + imageName;
    }

    public infoFullLinkUrl(fileName: string): string {
        fileName = fileName.replace('./', '');
        return Urls.assetsDoc + fileName;
    }
}
