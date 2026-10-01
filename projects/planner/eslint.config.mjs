// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import rootConfig from '../../eslint.config.mjs';

export default defineConfig([globalIgnores([
    // swapped in only by the production build fileReplacements, not part of any tsconfig
    'projects/planner/src/environments/environment.prod.ts',
]), ...rootConfig, {
    files: ['**/*.ts'],

    languageOptions: {
        parserOptions: {
            project: [
                'projects/planner/tsconfig.app.json',
                'projects/planner/tsconfig.spec.json',
                'projects/planner/tsconfig.worker.json',
            ],
        },
    },

    rules: {
        '@angular-eslint/directive-selector': ['error', {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
        }],

        '@angular-eslint/component-selector': ['error', {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
        }],
    },
}]);
