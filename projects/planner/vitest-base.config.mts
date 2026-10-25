import { defineConfig } from 'vitest/config';

// Merged by the Angular unit-test builder with its own configuration, see "runnerConfig" in angular.json
export default defineConfig({
    resolve: {
        // the same as application build, e.g. qrcode (used by angularx-qrcode) maps its node entry to browser version
        mainFields: ['browser', 'es2020', 'module', 'main']
    },
    test: {
        // junit results are published by the CI build, see .github/workflows/main.yml
        reporters: ['default', ['junit', { suiteName: 'planner' }]],
        outputFile: { junit: 'test-results/planner/junit.xml' },
        // the same as jasmine, spies created by vi.spyOn are removed after each test
        restoreMocks: true
    }
});
