import { test, expect, Page, type Locator, BrowserContext } from '@playwright/test';

class DiveInfoPage {
    private readonly timeLabelSelector = '#total-dive-time';
    private readonly timeValueSelector = '#total-dive-time-value';
    private readonly waypointTableSelector = '#dive-waypoints-table';
    private readonly waypointRowsSelector = '#dive-waypoints-table tbody tr';

    constructor(private page: Page) {}

    async navigate() {
        await this.page.goto('/');
    }

    getTimeLabel(): Locator {
        return this.page.locator(this.timeLabelSelector);
    }

    getTimeValue(): Locator {
        return this.page.locator(this.timeValueSelector);
    }

    getWaypointTable(): Locator {
        return this.page.locator(this.waypointTableSelector);
    }

    getWaypointRows(): Locator {
        return this.page.locator(this.waypointRowsSelector);
    }
}

test.describe('Dive Info Tests', () => {
    let diveInfoPage: DiveInfoPage;
    let context: BrowserContext;
    let page: Page;

    test('should show total dive time and display six waypoint rows', async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();

        diveInfoPage = new DiveInfoPage(page);
        await diveInfoPage.navigate();

        const timeLabel = diveInfoPage.getTimeLabel();
        await expect(timeLabel).toBeVisible();
        await expect(timeLabel).toHaveText('Total dive time [min]:');

        const timeValue = diveInfoPage.getTimeValue();
        await expect(timeValue).toBeVisible();
        await expect(timeValue).toHaveText('21:00');

        const waypointRows = diveInfoPage.getWaypointRows();
        await expect(waypointRows).toHaveCount(6);
    });
});
