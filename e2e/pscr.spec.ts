import { test, expect, Page, BrowserContext } from '@playwright/test';

class RebreatherPlannerPage {
    constructor(private page: Page) {}

    public async setBottomTime(minutes: string): Promise<void> {
        await this.page.locator('#duration').fill(minutes);
    }

    public async switchToComplexView(): Promise<void> {
        await this.page.locator('#isComplex').check({ force: true });
    }

    public async selectPscr(): Promise<void> {
        await this.page.locator('#circuitType').click();
        await this.page.locator('#circuitPscr').click();
    }

    public async openRebreatherTab(): Promise<void> {
        await this.page.locator('#rebreatherTab').click();
    }

    public totalTime(): ReturnType<Page['locator']> {
        return this.page.locator('#total-dive-time-value');
    }

    public injectionRatio(): ReturnType<Page['locator']> {
        return this.page.locator('#injectionRatio');
    }
}

test.describe('pSCR rebreather', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();

        await page.goto('/');
        await page.evaluate(() => {
            // TODO remove dirty hack to close the learn popup, after we replace the popups
            localStorage.setItem('quizShown', 'confirmed');
        });
        await page.reload();
    });

    test('should calculate pSCR dive with different runtime than open circuit', async () => {
        const planner = new RebreatherPlannerPage(page);
        const totalTime = planner.totalTime();
        await expect(totalTime).toHaveText('21:00');
        // long enough dive, so the leaner loop gas needs longer decompression
        await planner.setBottomTime('40');
        await expect(totalTime).not.toHaveText('21:00');
        const openCircuitTime = await totalTime.innerText();

        await planner.switchToComplexView();
        await planner.selectPscr();
        await planner.openRebreatherTab();

        await expect(planner.injectionRatio()).toHaveValue('8');
        await expect(totalTime).not.toHaveText(openCircuitTime);
    });
});
