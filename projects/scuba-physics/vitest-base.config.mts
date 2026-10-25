import { defineConfig } from 'vitest/config';

// Merged by the Angular unit-test builder with its own configuration, see "runnerConfig" in angular.json
export default defineConfig({
    test: {
        browser: {
            // the library has no UI, the screenshot of an empty page doesn't help
            screenshotFailures: false
        }
    }
});
