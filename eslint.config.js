import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint'
import {defineConfig, globalIgnores} from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                project: ['./tsconfig.app.json', './tsconfig.node.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            'typescript-eslint': tseslint.plugin,
            prettier: eslintPluginPrettier,
            import: eslintPluginImport,
        },
        rules: {
            indent: ['error', 2],
            semi: ['error', 'always'],
            'linebreak-style': ['error', 'unix'],
            camelcase: ['error', {properties: 'always'}],
            'no-console': 'off',
            // 'no-console': ['warn', {allow: ['warn', 'error']}],
            eqeqeq: ['error', 'always'],
            'max-len': ['error', {code: 100}],
            quotes: ['error', 'single'],

            // TypeScript
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'error',
            '@typescript-eslint/consistent-type-assertions': 'error',
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {accessibility: 'explicit'},
            ],
            '@typescript-eslint/type-annotation-spacing': 'error',
            '@typescript-eslint/no-inferrable-types': 'warn',
            '@typescript-eslint/strict-boolean-expressions': 'off',

            // react
            'react-hooks/preserve-manual-memoization': 'off',

            // Import
            'import/default': 'error',
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-self-import': 'error',
            'import/no-duplicates': 'error',
            'import/no-extraneous-dependencies': 'warn',
            'import/no-cycle': [
                'warn',
                {
                    maxDepth: 2,
                    ignoreExternal: true,
                },
            ],
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                        'object',
                    ],
                    'newlines-between': 'never',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: false,
                    },
                },
            ],
            'prettier/prettier': [
                'error',
                {
                    arrowParens: 'always',
                    semi: true,
                    singleQuote: true,
                    trailingComma: 'all',
                    tabWidth: 2,
                    useTabs: false,
                },
            ],
        },

    },
    eslintConfigPrettier,
])
