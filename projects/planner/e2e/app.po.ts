import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  calculateButton() {
    return element(by.id('calculate'));
  }

  rockBottom() {
    return element(by.css('.progress-bar.bg-warning')).getText();
  }
}
