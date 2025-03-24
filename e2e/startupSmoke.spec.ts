import { test, expect, Page, type Locator, BrowserContext } from '@playwright/test';

class DiveInfoPage {
    private readonly timeValueSelector = '#total-dive-time-value';
    private readonly waypointRowsSelector = '#dive-waypoints-table tbody tr';

    constructor(private page: Page) {}

    async navigate() {
        await this.page.goto('/');
    }

    getTimeValue(): Locator {
        return this.page.locator(this.timeValueSelector);
    }

    getWaypointRows(): Locator {
        return this.page.locator(this.waypointRowsSelector);
    }
}
class SacCalculatorPage {
    private readonly calculatorsMenuSelector = '#calculators-menu';
    private readonly rmvSacOptionSelector = 'a[routerLink="/sac"]';
    private readonly diveTimeInputSelector = '#dive-time-input';
    private readonly rmvValueSelector = '#total-rmv-valuesac';

    constructor(private page: Page) {}

    async navigateToRmvSacCalculator() {
        await this.page.goto('/');
        await this.page.locator(this.calculatorsMenuSelector).click();
        await this.page.locator(this.rmvSacOptionSelector).click();
    }

    async setDiveTime(value: string) {
        await this.page.locator(this.diveTimeInputSelector).fill(value);
    }

    getRMVValue(): Locator {
        return this.page.locator(this.rmvValueSelector);
    }
}

test.describe('Dive planner smoke tests', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    test('should show total dive time and display six waypoint rows', async () => {

        const diveInfoPage = new DiveInfoPage(page);
        await diveInfoPage.navigate();

        const timeValue = diveInfoPage.getTimeValue();
        await expect(timeValue).toBeVisible();
        await expect(timeValue).toHaveText('21:00');

        const waypointRows = diveInfoPage.getWaypointRows();
        await expect(waypointRows).toHaveCount(6);
    });

    test('should go to RMV/SAC calculator and calculate RMV after changing dive time', async() => {
        const sacCalculatorPage = new SacCalculatorPage(page);

        await sacCalculatorPage.navigateToRmvSacCalculator();
        await sacCalculatorPage.setDiveTime('60');

        await expect(sacCalculatorPage.getRMVValue()).toBeVisible();
        await expect(sacCalculatorPage.getRMVValue()).toHaveValue('15');
    });
});
