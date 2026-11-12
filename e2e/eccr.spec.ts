import { test, expect } from './fixtures';
import { Page, Locator } from '@playwright/test';

class EccrPlannerPage {
    constructor(private page: Page) {}

    public async setDepth(meters: string): Promise<void> {
        await this.page.locator('#depthField').fill(meters);
    }

    public async switchToComplexView(): Promise<void> {
        await this.page.locator('#isComplex').check({ force: true });
    }

    public async selectEccr(): Promise<void> {
        await this.page.locator('#circuitType').click();
        await this.page.locator('#circuitEccr').click();
    }

    public async addTank(): Promise<void> {
        await this.page.locator('#addTank').click();
    }

    /** Large devices layout, index from 0 */
    public async setTankGas(index: number, o2: string, he: string): Promise<void> {
        await this.page.locator(`#o2Item-${index} input:visible`).fill(o2);
        await this.page.locator(`#heItem-${index}`).fill(he);
    }

    public async openRebreatherTab(): Promise<void> {
        await this.page.locator('#rebreatherTab').click();
    }

    public async setSetpoints(descent: string, bottom: string, deco: string): Promise<void> {
        await this.page.locator('#bottomSetpoint').fill(bottom);
        await this.page.locator('#descentSetpoint').fill(descent);
        await this.page.locator('#decoSetpoint').fill(deco);
    }

    /** Dive info switches to issues tab, when the plan has errors (e.g. not enough gas during the setup) */
    public async openResultsTab(): Promise<void> {
        await this.page.getByRole('tab', { name: 'Results' }).click();
    }

    public async openConsumedTab(): Promise<void> {
        await this.page.getByRole('tab', { name: 'Consumed' }).click();
    }

    public totalTime(): Locator {
        return this.page.locator('#total-dive-time-value');
    }

    /** Remaining/start pressure of the tank, id from 1 */
    public tankRemaining(tankId: number): Locator {
        return this.page.locator(`#tankRemaining-${tankId}`);
    }

    /** Rebreather role (Diluent, Oxygen) of the tank in consumed tab, id from 1 */
    public tankRole(tankId: number): Locator {
        return this.page.locator(`#tankChartRole-${tankId}`);
    }

    public diveProfileTab(): Locator {
        return this.page.locator('#waypointsDiveTab');
    }

    public bailoutProfileTab(): Locator {
        return this.page.locator('#waypointsBailoutTab');
    }

    /** Depth column of the last waypoints table row */
    public lastWaypointDepth(): Locator {
        return this.page.locator('#dive-waypoints-table tbody tr').last().locator('td').nth(1);
    }

    public diveTitle(): Locator {
        return this.page.getByText(/^1\. eCCR 60 m, \d+ min$/);
    }
}

test.describe('eCCR rebreather', () => {
    let page: Page;

    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;

        await page.goto('/');
        await page.evaluate(() => {
            // TODO remove dirty hack to close the learn popup, after we replace the popups
            localStorage.setItem('quizShown', 'confirmed');
        });
        await page.reload();
    });

    test('should calculate trimix eCCR dive with bailout tanks', async () => {
        const planner = new EccrPlannerPage(page);
        await expect(planner.totalTime()).toHaveText('21:00');
        await planner.setDepth('60');
        await planner.switchToComplexView();
        await planner.selectEccr();

        // tank 1 diluent, tank 2 CCR oxygen inserted by the eCCR, tanks 3-5 bailout
        await planner.setTankGas(0, '18', '45');
        await planner.addTank();
        await planner.setTankGas(2, '18', '45');
        await planner.addTank();
        await planner.setTankGas(3, '50', '0');
        await planner.addTank();
        await planner.setTankGas(4, '100', '0');

        await planner.openRebreatherTab();
        await planner.setSetpoints('1.1', '1.1', '1.3');

        // values from planner.service.eccr.spec.ts with the same inputs
        // intermediate plans during the setup may switch dive info to issues tab after the results tab is opened
        await expect(async () => {
            await planner.openResultsTab();
            await expect(planner.totalTime()).toHaveText('31:57', { timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await planner.openConsumedTab();
        await expect(planner.tankRemaining(2)).toHaveText('188/200');
        await expect(planner.tankRole(1)).toHaveText('Diluent');
        await expect(planner.tankRole(2)).toHaveText('Oxygen');

        await expect(planner.diveTitle()).toBeVisible();
        await expect(planner.diveProfileTab()).toBeVisible();
        await planner.bailoutProfileTab().click();
        await expect(planner.lastWaypointDepth()).toHaveText('0');
    });
});
