import { test, expect } from './fixtures';
import { Page } from '@playwright/test';

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
    let page: Page;

    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;

        await page.goto('/');
    });

    test('should calculate pSCR dive with injection ratio 8 in 2:36:38', async () => {
        const planner = new RebreatherPlannerPage(page);
        const totalTime = planner.totalTime();
        await expect(totalTime).toHaveText('21:00');
        // long enough dive, so the leaner loop gas needs longer decompression
        await planner.setBottomTime('40');
        await expect(totalTime).toHaveText('1:14:41');

        await planner.switchToComplexView();
        await planner.selectPscr();
        await planner.openRebreatherTab();

        await expect(planner.injectionRatio()).toHaveValue('8');
        await expect(totalTime).toHaveText('2:36:38');
    });
});
