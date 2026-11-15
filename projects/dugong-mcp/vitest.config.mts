import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

// Plain Node project, not run by the Angular unit-test builder
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    // keeps the cache in the ignored root node_modules instead of the project folder
    cacheDir: `${repositoryRoot}node_modules/.vite/dugong-mcp`,
    resolve: {
        // consumes the built library like the planner does (see tsconfig.json paths), requires "npm run build-lib"
        alias: {
            'scuba-physics': `${repositoryRoot}dist/scuba-physics`
        }
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
        restoreMocks: true,
        // junit results are published by the CI build, see .github/workflows/main.yml
        reporters: ['default', ['junit', { suiteName: 'dugong-mcp' }]],
        outputFile: { junit: `${repositoryRoot}test-results/dugong-mcp/junit.xml` },
        coverage: {
            provider: 'istanbul',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.spec.ts', 'src/**/*.testing.ts', 'src/**/testing/**', 'src/stdio.ts', 'src/cli.ts'],
            reportsDirectory: `${repositoryRoot}coverage/dugong-mcp`,
            reporter: ['html', 'text-summary', ['cobertura', { file: 'cobertura.xml' }]]
        }
    }
});
