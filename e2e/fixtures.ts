import { test as base, expect } from '@playwright/test';

/**
 * Page which fails the test, when the browser console contains an error or an Angular NG0 warning.
 * Use this test instead of the Playwright one in all E2E specs.
 */
export const test = base.extend({
    page: async ({ page }, use) => {
        const problems: string[] = [];
        page.on('console', message => {
            const isError = message.type() === 'error';
            const isAngularWarning = message.type() === 'warning' && message.text().includes('NG0');

            if (isError || isAngularWarning) {
                problems.push(`${message.type()}: ${message.text()}`);
            }
        });
        page.on('pageerror', error => problems.push(`page error: ${error.message}`));

        await use(page);

        expect(problems, 'Browser console contains errors or Angular warnings').toEqual([]);
    }
});

export { expect };
