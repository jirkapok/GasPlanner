import { defineConfig } from 'vitest/config';

// Merged by the Angular unit-test builder with its own configuration, see "runnerConfig" in angular.json
export default defineConfig({
    test: {
        // junit results are published by the CI build, see .github/workflows/main.yml
        reporters: ['default', ['junit', { suiteName: 'scuba-physics' }]],
        outputFile: { junit: 'test-results/scuba-physics/junit.xml' },
        browser: {
            // the library has no UI, the screenshot of an empty page doesn't help
            screenshotFailures: false
        }
    }
});
