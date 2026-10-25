import { defineConfig } from 'vitest/config';

// Merged by the Angular unit-test builder with its own configuration, see "runnerConfig" in angular.json
export default defineConfig({
    test: {
        // the same as jasmine, spies created by vi.spyOn are removed after each test
        restoreMocks: true
    }
});
