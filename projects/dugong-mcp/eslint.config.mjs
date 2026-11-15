// @ts-check
import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config.mjs';

/** Node built-ins the transport independent core must not use, only src/stdio.ts and src/cli.ts may */
const nodeOnlyModules = ['node:*', 'fs', 'fs/*', 'path', 'os', 'child_process', 'process', 'url', 'stream', 'buffer'];

export default defineConfig([...rootConfig, {
    files: ['**/*.ts'],

    languageOptions: {
        parserOptions: {
            project: ['projects/dugong-mcp/tsconfig.json'],
        },
    },
}, {
    files: ['**/dugong-mcp/src/core/**/*.ts'],

    rules: {
        'no-restricted-imports': ['error', {
            patterns: [
                { group: ['@angular/*'], message: 'The MCP core must not depend on Angular.' },
                { group: nodeOnlyModules, message: 'Node APIs belong to src/stdio.ts or src/cli.ts only.' },
            ],
        }],
        'no-restricted-globals': ['error', 'process', 'require', 'Buffer', '__dirname', '__filename',
            // stdout carries the MCP protocol, the root config allows console.log
            { name: 'console', message: 'stdout carries the MCP protocol, return the output instead.' }],
    },
}]);
