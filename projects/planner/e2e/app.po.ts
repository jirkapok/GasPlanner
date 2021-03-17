import { browser, by, element } from 'protractor';

export class AppPage {
    public async navigateTo(): Promise<any> {
        return browser.get('/');
    }

    public async rockBottom(): Promise<string> {
        return await element(by.css('.progress-bar.bg-warning')).getText();
    }
}
