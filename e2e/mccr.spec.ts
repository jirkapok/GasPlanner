import { test, expect, Page, BrowserContext } from '@playwright/test';

class MccrPlannerPage {
    constructor(private page: Page) {}

    public async setBottomTime(minutes: string): Promise<void> {
        await this.page.locator('#duration').fill(minutes);
    }

    public async switchToComplexView(): Promise<void> {
        await this.page.locator('#isComplex').check({ force: true });
    }

    public async selectMccr(): Promise<void> {
        await this.page.locator('#circuitType').click();
        await this.page.locator('#circuitMccr').click();
    }

    public async openRebreatherTab(): Promise<void> {
        await this.page.locator('#rebreatherTab').click();
    }

    public async setTargetPpO2(value: string): Promise<void> {
        await this.page.locator('#setpoint').fill(value);
    }

    public totalTime(): ReturnType<Page['locator']> {
        return this.page.locator('#total-dive-time-value');
    }

    public oxygenTankRole(): ReturnType<Page['locator']> {
        return this.page.locator('#tankRole-1');
    }
}

test.describe('mCCR rebreather', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();

        await page.goto('/');
    });

    test('should calculate mCCR dive with oxygen tank and different runtime than open circuit', async () => {
        const planner = new MccrPlannerPage(page);
        const totalTime = planner.totalTime();
        await expect(totalTime).toHaveText('21:00');
        // long enough dive, so the loop gas changes the decompression
        await planner.setBottomTime('40');
        await expect(totalTime).not.toHaveText('21:00');
        const openCircuitTime = await totalTime.innerText();

        await planner.switchToComplexView();
        await planner.selectMccr();
        await expect(planner.oxygenTankRole()).toHaveText('Oxygen');

        await planner.openRebreatherTab();
        await planner.setTargetPpO2('1.2');

        await expect(totalTime).not.toHaveText(openCircuitTime);
    });
});
