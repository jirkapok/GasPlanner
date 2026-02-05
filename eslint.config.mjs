import { defineConfig } from "eslint/config";
import _import from "eslint-plugin-import";
import angularEslintEslintPlugin from "@angular-eslint/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import html from "eslint-plugin-html";
import jasmine from "eslint-plugin-jasmine";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends(
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:jasmine/recommended",
    ),

    plugins: {
        import: fixupPluginRules(_import),
        "@angular-eslint": angularEslintEslintPlugin,
        "@typescript-eslint": typescriptEslint,
        html,
        jasmine,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.jasmine,
        },
    },
}, {
    files: ["**/*.ts"],

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: ["tsconfig.json"],
        },
    },

    rules: {
        "jasmine/new-line-before-expect": "off",
        "@angular-eslint/component-class-suffix": "error",

        "@angular-eslint/component-selector": ["error", {
            type: "element",
            prefix: "app",
            style: "kebab-case",
        }],

        "@angular-eslint/directive-class-suffix": "error",

        "@angular-eslint/directive-selector": ["error", {
            type: "attribute",
            prefix: "app",
            style: "camelCase",
        }],

        "@angular-eslint/prefer-standalone": "warn",
        "@angular-eslint/prefer-inject": "warn",
        "@angular-eslint/no-input-rename": "error",
        "@angular-eslint/no-output-on-prefix": "error",
        "@angular-eslint/no-output-rename": "error",
        "@angular-eslint/use-pipe-transform-interface": "error",
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/dot-notation": "off",

        "@typescript-eslint/explicit-member-accessibility": ["off", {
            accessibility: "explicit",
        }],

        // Formatting rules - disabled, handled by Prettier
        "indent": "off",
        "semi": "off",
        "quotes": "off",
        "brace-style": "off",
        "eol-last": "off",
        "max-len": "off",
        "no-trailing-spaces": "off",
        "spaced-comment": "off",
        "object-curly-spacing": "off",

        // Downgraded to warnings - pre-existing issues to fix gradually
        "@typescript-eslint/member-ordering": "warn",
        "@typescript-eslint/naming-convention": "warn",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/no-shadow": ["warn", { hoist: "all" }],
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/no-unnecessary-type-assertion": "warn",
        "@typescript-eslint/no-redundant-type-constituents": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/unbound-method": "warn",
        "eqeqeq": ["warn", "smart"],
        "prefer-spread": "warn",
        "no-self-assign": "warn",

        // Disabled - too noisy for this codebase
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-object-type": "warn",
        "@typescript-eslint/restrict-template-expressions": "warn",

        // Kept as errors - important rules
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-inferrable-types": ["error", { ignoreParameters: true }],
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "error",
        "constructor-super": "error",
        curly: "error",
        "guard-for-in": "error",
        "id-blacklist": "off",
        "id-match": "off",
        "import/no-deprecated": "warn",
        "no-bitwise": "error",
        "no-caller": "error",

        "no-console": ["error", {
            allow: [
                "debug",
                "log",
                "warn",
                "dir",
                "timeLog",
                "assert",
                "clear",
                "count",
                "countReset",
                "group",
                "groupEnd",
                "table",
                "dirxml",
                "error",
                "groupCollapsed",
                "Console",
                "profile",
                "profileEnd",
                "timeStamp",
                "context",
            ],
        }],

        "no-debugger": "error",
        "no-empty": "off",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-new-wrappers": "error",
        "no-restricted-imports": ["error", "rxjs/Rx"],
        "no-throw-literal": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unused-labels": "error",
        "no-var": "error",
        "prefer-const": "error",
        radix: "error",
        "@typescript-eslint/adjacent-overload-signatures": "off",
    },
},
// Prettier must be last to override formatting rules
prettier,
]);
