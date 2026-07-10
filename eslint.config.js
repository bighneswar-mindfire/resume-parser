// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build output and dependencies.
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/coverage/**'],
  },

  // Base JS + TypeScript recommended rules for all source files.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Backend: Node.js environment.
  {
    files: ['backend/**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Frontend: browser environment + React.
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Not needed with the modern JSX transform.
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Turn off ESLint rules that conflict with Prettier. Keep this last.
  prettier
);
