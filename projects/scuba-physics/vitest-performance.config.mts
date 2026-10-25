import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Performance specs, see "test-performance" target in angular.json.
// The target has no "browsers" option, because the browser created by the Angular builder can't receive launch arguments.
export default defineConfig({
    test: {
        browser: {
            enabled: true,
            headless: true,
            // the library has no UI, the screenshot of an empty page doesn't help
            screenshotFailures: false,
            provider: playwright({
                launchOptions: {
                    // precise heap sizes and manual garbage collection for the memory measurement
                    args: ['--enable-precise-memory-info', '--js-flags=--expose-gc']
                }
            }),
            instances: [{ browser: 'chromium' }]
        },
        // the longest dive is calculated synchronously for seconds without reporting any progress
        testTimeout: 30 * 60 * 1000,
        // the default reporter hides console output of passed tests, but the measured values are the result
        reporters: ['verbose']
    }
});
