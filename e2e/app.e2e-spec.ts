import { AppPage } from './app.po';

describe('planner App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should show calculated rock bottom', () => {
    page.navigateTo();
    page.calculateButton().click();
    expect(page.rockBottom()).toBe('80');
  });
});
