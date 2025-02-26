import { test, expect, Page, type Locator, BrowserContext } from '@playwright/test';

class DiveInfoPage {
    private readonly titleSelector = '#dive-info-title';
    private readonly timeLabelSelector = '#total-dive-time';
    private readonly timeValueSelector = '#total-dive-time-value';
    private readonly waypointTableSelector = '#dive-waypoints-table';
    private readonly waypointRowsSelector = '#dive-waypoints-table tbody tr';

    constructor(private page: Page) {}

    async navigate() {
        await this.page.goto('http://localhost:4200/');
    }

    getTitle(): Locator {
        return this.page.locator(this.titleSelector);
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

    test.beforeEach(async ({ browser }) => {
        context = await browser.newContext();

        page = await context.newPage();

        diveInfoPage = new DiveInfoPage(page);
        await diveInfoPage.navigate();
    });

    test('should show dive info', async () => {
        const title = diveInfoPage.getTitle();
        await expect(title).toBeVisible();
        await expect(title).toHaveText('Dive info');

        const timeLabel = diveInfoPage.getTimeLabel();
        await expect(timeLabel).toBeVisible();
        await expect(timeLabel).toHaveText('Total dive time [min]:');

        const timeValue = diveInfoPage.getTimeValue();
        await expect(timeValue).toBeVisible();
        await expect(timeValue).toHaveText('21:00');
    });

    test('should display six waypoint rows', async () => {
        const waypointTable = diveInfoPage.getWaypointTable();
        await expect(waypointTable).toBeVisible();

        const waypointRows = diveInfoPage.getWaypointRows();
        await expect(waypointRows).toHaveCount(6);
    });
});
