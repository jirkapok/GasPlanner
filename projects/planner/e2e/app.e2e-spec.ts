import { AppPage } from './app.po';

describe('planner App', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    // TODO fix to meaning full e2e test
    it('should show calculated rock bottom', async () => {
        await page.navigateTo();
        expect(await page.rockBottom()).toBe('80');
    });
});
