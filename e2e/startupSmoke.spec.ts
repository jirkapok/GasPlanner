import { test, expect, Page, type Locator, BrowserContext } from '@playwright/test';

class DiveInfoPage {
    private readonly timeValueSelector = '#total-dive-time-value';
    private readonly waypointRowsSelector = '#dive-waypoints-table tbody tr';

    constructor(private page: Page) {}

    public async navigate() {
        await this.page.goto('/');
    }

    public getTimeValue(): Locator {
        return this.page.locator(this.timeValueSelector);
    }

    public getWaypointRows(): Locator {
        return this.page.locator(this.waypointRowsSelector);
    }
}

class SacCalculatorPage {
    private readonly diveTimeInputSelector = '#dive-time-input';
    private readonly rmvValueSelector = '#total-rmv-valuesac';

    constructor(private page: Page) {}

    public async navigate(): Promise<void> {
        await this.page.goto('/sac');
    }

    public async setDiveTime(value: string): Promise<void> {
        await this.page.locator(this.diveTimeInputSelector).fill(value);
    }

    public getRMVValue(): Locator {
        return this.page.locator(this.rmvValueSelector);
    }
}

class GasPlannerPage {
    private readonly bottomTimeInputSelector = '#duration';
    private readonly addDiveButton = '#add-dive';

    constructor(private page: Page) {}

    public async navigate(): Promise<void> {
        await this.page.goto('/');
        await expect(this.page.locator(this.bottomTimeInputSelector)).toBeVisible();
    }

    public async addSecondDive(): Promise<void> {
        await this.page.locator(this.addDiveButton).last().click({ force: true });
    }

    public async setSecondDiveDuration(value: string): Promise<void> {
        await this.page.locator(this.bottomTimeInputSelector).fill(value);
    }
}

class ComparisonPage {
    private readonly totalTimeDiffSelector = '#total-time-diff';

    constructor(private page: Page) {}

    public async navigate(): Promise<void> {
        await this.page.goto('/diff');
    }

    public getTotalTimeDifference(): Locator {
        return this.page.locator(this.totalTimeDiffSelector);
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

    test('should go to RMV/SAC calculator and calculate RMV after changing dive time', async () => {
        const sacCalculatorPage = new SacCalculatorPage(page);
        await sacCalculatorPage.navigate();
        await sacCalculatorPage.setDiveTime('60');

        await expect(sacCalculatorPage.getRMVValue()).toBeVisible();
        await expect(sacCalculatorPage.getRMVValue()).toHaveValue('15');
    });

    test('should go to planner, add second dive, change duration and see difference in compare dives', async () => {
        const gasPlannerPage = new GasPlannerPage(page);
        await gasPlannerPage.navigate();
        await gasPlannerPage.addSecondDive();
        await gasPlannerPage.setSecondDiveDuration('30');

        const diffPage  = new ComparisonPage(page);
        await diffPage.navigate();
        const totalDiff = diffPage.getTotalTimeDifference();
        await expect(totalDiff).toBeVisible();
        await expect(totalDiff).not.toHaveText('');
    });
});
