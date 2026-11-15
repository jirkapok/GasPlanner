import { test, expect } from './fixtures';
import { Page, type Locator } from '@playwright/test';

class AiIntegrationPage {
    constructor(private readonly page: Page) {}

    public menuItem(): Locator {
        return this.page.getByRole('link', { name: 'Use with AI', exact: true }).first();
    }

    public heading(): Locator {
        return this.page.getByRole('heading', { level: 1, name: 'Use with AI' });
    }

    public downloadLink(name: string): Locator {
        return this.page.getByRole('link', { name: `Download ${name}`, exact: true });
    }
}

test.describe('AI integration', () => {
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

    test('should open AI integration help from the menu with both downloads', async () => {
        const aiPage = new AiIntegrationPage(page);
        await aiPage.menuItem().click();

        await expect(page).toHaveURL(/\/help\/ai/);
        await expect(aiPage.heading()).toBeVisible();
        await expect(aiPage.downloadLink('dugong.mcpb')).toHaveAttribute('href', /\/?ai\/dugong\.mcpb$/);
        await expect(aiPage.downloadLink('dugong-skill.zip')).toHaveAttribute('href', /\/?ai\/dugong-skill\.zip$/);
    });
});
