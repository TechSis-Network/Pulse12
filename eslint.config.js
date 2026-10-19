import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.agents/**', 'base44/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['*.{js,ts}'], languageOptions: { globals: globals.node } },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': hooks, 'unused-imports': unusedImports },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper', 'toast-close'] }],
    },
  },
];
