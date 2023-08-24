import { Injectable } from '@angular/core';

@Injectable()
export class Urls {
    private static readonly rootUrl = 'https://github.com/jirkapok/GasPlanner';
    private static readonly rootHelpUrl = Urls.rootUrl + '/blob/master/doc';

    public get projectUrl(): string {
        return Urls.rootUrl;
    }

    public get standardGases(): string {
        return Urls.rootHelpUrl + '/standard_gases.md';
    }

    public get helpUrl(): string {
        return Urls.rootHelpUrl +'/readme.md';
    }
}
