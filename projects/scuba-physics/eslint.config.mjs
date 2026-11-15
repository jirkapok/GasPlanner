// @ts-check
import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config.mjs';

export default defineConfig([...rootConfig, {
    files: ['**/*.ts'],

    languageOptions: {
        parserOptions: {
            project: [
                'projects/scuba-physics/tsconfig.lib.json',
                'projects/scuba-physics/tsconfig.spec.json',
            ],
        },
    },

    rules: {
        '@angular-eslint/directive-selector': ['error', {
            type: 'attribute',
            prefix: 'lib',
            style: 'camelCase',
        }],

        '@angular-eslint/component-selector': ['error', {
            type: 'element',
            prefix: 'lib',
            style: 'kebab-case',
        }],

        // the library is shared with the MCP server and the Skill, which run without Angular, also outside of Node
        'no-restricted-imports': ['error', {
            patterns: [
                { group: ['@angular/*'], message: 'scuba-physics must not depend on Angular.' },
                {
                    group: ['node:*', 'fs', 'fs/*', 'path', 'os', 'child_process', 'process', 'url', 'stream', 'buffer'],
                    message: 'scuba-physics must not use Node-only APIs.'
                },
            ],
        }],
        'no-restricted-globals': ['error', 'process', 'require', 'Buffer', '__dirname', '__filename'],
    },
}]);
