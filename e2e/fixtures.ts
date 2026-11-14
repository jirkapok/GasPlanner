import { test as base, expect } from '@playwright/test';

interface ConsoleProblem {
    text: string;
    url: string;
}

const failedResourcePrefix = 'Failed to load resource';

/**
 * GitHub Pages has no SPA rewrites, it serves deep links (e.g. /sac) via 404.html with HTTP status 404.
 * The page renders fine, but the browser reports the document as a failed resource.
 */
const isSpaFallbackDocument = (problem: ConsoleProblem, fallbackDocuments: Set<string>): boolean =>
    problem.text.includes(failedResourcePrefix) && fallbackDocuments.has(problem.url);

/**
 * Page which fails the test, when the browser console contains an error or an Angular NG0 warning.
 * Use this test instead of the Playwright one in all E2E specs.
 */
export const test = base.extend({
    page: async ({ page }, use) => {
        const problems: ConsoleProblem[] = [];
        const fallbackDocuments = new Set<string>();

        page.on('response', response => {
            if (response.status() === 404 && response.request().isNavigationRequest()) {
                fallbackDocuments.add(response.url());
            }
        });
        page.on('console', message => {
            const isError = message.type() === 'error';
            const isAngularWarning = message.type() === 'warning' && message.text().includes('NG0');

            if (isError || isAngularWarning) {
                problems.push({ text: `${message.type()}: ${message.text()}`, url: message.location().url });
            }
        });
        page.on('pageerror', error => problems.push({ text: `page error: ${error.message}`, url: '' }));

        await use(page);

        const reported = problems
            .filter(problem => !isSpaFallbackDocument(problem, fallbackDocuments))
            .map(problem => problem.text);
        expect(reported, 'Browser console contains errors or Angular warnings').toEqual([]);
    }
});

export { expect };
