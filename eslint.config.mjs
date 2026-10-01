// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import importPlugin from 'eslint-plugin-import';
import jasmine from 'eslint-plugin-jasmine';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';

export default defineConfig([{
    files: ['**/*.ts'],

    extends: [
        eslint.configs.recommended,
        tseslint.configs.recommendedTypeChecked,
        angular.configs.tsRecommended,
    ],

    processor: angular.processInlineTemplates,

    plugins: {
        import: fixupPluginRules(importPlugin),
        jasmine,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.jasmine,
        },

        sourceType: 'module',

        parserOptions: {
            project: ['tsconfig.json'],
            tsconfigRootDir: import.meta.dirname,
        },
    },

    rules: {
        ...jasmine.configs.recommended.rules,
        'jasmine/new-line-before-expect': 'off',
        '@angular-eslint/component-class-suffix': 'error',

        '@angular-eslint/component-selector': ['error', {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
        }],

        '@angular-eslint/directive-class-suffix': 'error',

        '@angular-eslint/directive-selector': ['error', {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
        }],

        '@angular-eslint/prefer-standalone': 'warn',
        '@angular-eslint/prefer-inject': 'off',
        '@angular-eslint/prefer-on-push-component-change-detection': 'off',
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/dot-notation': 'off',

        '@typescript-eslint/explicit-member-accessibility': ['off', {
            accessibility: 'explicit',
        }],

        'indent': ['error', 4, { SwitchCase: 1 }],
        'semi': ['error', 'always'],
        'quotes': ['error', 'single'],

        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/naming-convention': ['error',
            // typescript-eslint defaults
            { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
            { selector: 'import', format: ['camelCase', 'PascalCase'] },
            { selector: 'variable', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
            { selector: 'typeLike', format: ['PascalCase'] },
            // lodash is imported as `_`
            { selector: 'import', filter: { regex: '^_$', match: true }, format: null },
        ],
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'error',

        '@typescript-eslint/no-inferrable-types': ['error', {
            ignoreParameters: true,
        }],

        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',

        '@typescript-eslint/no-shadow': ['error', {
            hoist: 'all',
        }],

        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-body-style': 'error',
        'brace-style': ['error', '1tbs'],
        'constructor-super': 'error',
        'object-curly-spacing': ['error', 'always'],
        curly: 'error',
        'eol-last': 'error',
        eqeqeq: ['error', 'smart'],
        'guard-for-in': 'error',
        'id-blacklist': 'off',
        'id-match': 'off',
        'import/no-deprecated': 'warn',

        'max-len': ['error', {
            code: 140,
        }],

        'no-bitwise': 'error',
        'no-caller': 'error',

        'no-console': ['error', {
            allow: [
                'log',
                'warn',
                'dir',
                'timeLog',
                'assert',
                'clear',
                'count',
                'countReset',
                'group',
                'groupEnd',
                'table',
                'dirxml',
                'error',
                'groupCollapsed',
                'Console',
                'profile',
                'profileEnd',
                'timeStamp',
                'context',
            ],
        }],

        'no-debugger': 'error',
        'no-empty': 'off',
        'no-eval': 'error',
        'no-fallthrough': 'error',
        'no-new-wrappers': 'error',
        'no-restricted-imports': ['error', 'rxjs/Rx'],
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-undef-init': 'error',
        'no-underscore-dangle': 'off',
        'no-unused-labels': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        radix: 'error',

        'spaced-comment': ['error', 'always', {
            markers: ['/'],
        }],

        '@typescript-eslint/adjacent-overload-signatures': 'off',
    },
}, {
    files: ['**/*.html'],

    extends: [
        angular.configs.templateRecommended,
    ],

    rules: {},
}]);
